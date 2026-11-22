<?php

namespace App\Http\Controllers\Shop;

use App\Enums\OrderStatus;
use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\OrderService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class OrderController extends Controller
{
    public function __construct(private readonly OrderService $orders) {}

    public function index(Request $request): Response
    {
        $tab = $request->validate(['tab' => ['nullable', Rule::in(['all', 'active', 'completed', 'cancelled'])]])['tab'] ?? 'all';

        $orders = $request->user()->orders()
            ->with(['items' => fn ($q) => $q->with('product:id,image_path,slug,stock,reorder_level')])
            ->when($tab === 'active', fn ($q) => $q->whereNotIn('status', [OrderStatus::Completed, OrderStatus::Cancelled]))
            ->when($tab === 'completed', fn ($q) => $q->where('status', OrderStatus::Completed))
            ->when($tab === 'cancelled', fn ($q) => $q->where('status', OrderStatus::Cancelled))
            ->latest('placed_at')
            ->paginate(8)
            ->withQueryString();

        return Inertia::render('orders/index', [
            'orders' => $orders,
            'tab' => $tab,
        ]);
    }

    public function show(Request $request, Order $order): Response
    {
        Gate::authorize('view', $order);

        $order->load(['items.product:id,slug,image_path,stock,reorder_level', 'activities.user:id,name,role']);

        return Inertia::render('orders/show', [
            'order' => $order,
            'paymentAccounts' => config('store.payment_accounts'),
            'justPlaced' => $request->boolean('placed'),
            'can' => [
                'cancel' => $request->user()->can('cancel', $order),
                'uploadProof' => $request->user()->can('uploadPaymentProof', $order),
            ],
        ]);
    }

    public function cancel(Request $request, Order $order): RedirectResponse
    {
        Gate::authorize('cancel', $order);

        $data = $request->validate(['reason' => ['nullable', 'string', 'max:255']]);

        $this->orders->cancel($order, $request->user(), $data['reason'] ?? null);
        $this->toast('Your order was cancelled.');

        return back();
    }

    public function uploadProof(Request $request, Order $order): RedirectResponse
    {
        Gate::authorize('uploadPaymentProof', $order);

        $data = $request->validate([
            'payment_reference' => ['required', 'string', 'max:100'],
            'payment_proof' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ]);

        $this->orders->submitPaymentProof($order, $data['payment_reference'], $request->file('payment_proof'), $request->user());
        $this->toast('Thanks! We will verify your payment shortly.');

        return back();
    }

    public function reorder(Request $request, Order $order): RedirectResponse
    {
        Gate::authorize('view', $order);

        $added = 0;

        foreach ($order->items()->with('product')->get() as $item) {
            $product = $item->product;

            if (! $product || ! $product->is_active || $product->trashed() || $product->stock < 1) {
                continue;
            }

            $cartItem = $request->user()->cartItems()->firstOrNew(['product_id' => $product->id]);
            $cartItem->quantity = min($product->stock, ($cartItem->quantity ?? 0) + $item->quantity);
            $cartItem->save();
            $added++;
        }

        $this->toast(
            $added > 0 ? "Added {$added} item(s) from {$order->number} to your cart." : 'None of these items are available right now.',
            $added > 0 ? 'success' : 'warning',
        );

        return to_route('cart.index');
    }

    public function receipt(Order $order): Response
    {
        Gate::authorize('view', $order);

        return Inertia::render('orders/receipt', [
            'order' => $order->load(['items', 'processor:id,name']),
            'store' => config('store'),
        ]);
    }
}
