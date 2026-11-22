<?php

namespace App\Http\Controllers\Admin;

use App\Enums\OrderChannel;
use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\OrderService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class OrderController extends Controller
{
    public function __construct(private readonly OrderService $orders) {}

    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'status' => ['nullable', Rule::in(['all', 'to_verify', ...array_column(OrderStatus::cases(), 'value')])],
            'channel' => ['nullable', Rule::enum(OrderChannel::class)],
            'search' => ['nullable', 'string', 'max:100'],
        ]);

        $status = $filters['status'] ?? 'all';

        $base = fn () => Order::query()
            ->when($filters['channel'] ?? null, fn (Builder $q, $c) => $q->where('channel', $c))
            ->when($filters['search'] ?? null, fn (Builder $q, $term) => $q->where(fn (Builder $q) => $q
                ->where('number', 'like', "%{$term}%")
                ->orWhere('customer_name', 'like', "%{$term}%")
                ->orWhere('customer_email', 'like', "%{$term}%")
                ->orWhere('customer_phone', 'like', "%{$term}%")));

        $counts = $base()->toBase()->selectRaw('status, COUNT(*) as aggregate')->groupBy('status')->pluck('aggregate', 'status');

        $orders = $base()
            ->withCount('items')
            ->when($status === 'to_verify', fn (Builder $q) => $q->where('payment_status', PaymentStatus::ForVerification)->where('status', '!=', OrderStatus::Cancelled))
            ->when(! in_array($status, ['all', 'to_verify'], true), fn (Builder $q) => $q->where('status', $status))
            ->latest('placed_at')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('admin/orders/index', [
            'orders' => $orders,
            'counts' => [
                'all' => $counts->sum(),
                'to_verify' => $base()->where('payment_status', PaymentStatus::ForVerification)->where('status', '!=', OrderStatus::Cancelled)->count(),
                ...collect(OrderStatus::cases())->mapWithKeys(fn (OrderStatus $s) => [$s->value => (int) ($counts[$s->value] ?? 0)]),
            ],
            'filters' => [
                'status' => $status,
                'channel' => $filters['channel'] ?? '',
                'search' => $filters['search'] ?? '',
            ],
        ]);
    }

    public function show(Order $order): Response
    {
        $order->load(['items.product:id,slug,image_path,stock,reorder_level', 'activities.user:id,name,role', 'customer:id,name,email,phone,created_at', 'processor:id,name']);

        return Inertia::render('admin/orders/show', [
            'order' => $order,
            'nextStatuses' => collect($order->status->nextStatuses($order->fulfillment))
                ->map(fn (OrderStatus $s) => ['value' => $s->value, 'label' => $s->label()])
                ->values(),
            'customerStats' => $order->customer ? [
                'orders' => $order->customer->orders()->count(),
                'spent' => (float) $order->customer->orders()->revenue()->sum('total'),
            ] : null,
        ]);
    }

    public function updateStatus(Request $request, Order $order): RedirectResponse
    {
        $data = $request->validate([
            'status' => ['required', Rule::enum(OrderStatus::class)],
            'note' => ['nullable', 'string', 'max:255'],
        ]);

        $this->orders->transition($order, OrderStatus::from($data['status']), $request->user(), $data['note'] ?? null);
        $this->toast("Order {$order->number} is now {$order->status->label()}.");

        return back();
    }

    public function verifyPayment(Request $request, Order $order): RedirectResponse
    {
        $this->orders->verifyPayment($order, $request->user());
        $this->toast('Payment marked as verified.');

        return back();
    }

    public function rejectPayment(Request $request, Order $order): RedirectResponse
    {
        $data = $request->validate(['reason' => ['required', 'string', 'max:255']]);

        $this->orders->rejectPayment($order, $request->user(), $data['reason']);
        $this->toast('Payment proof rejected. The customer has been asked to upload a new one.', 'info');

        return back();
    }
}
