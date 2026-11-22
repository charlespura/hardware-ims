<?php

namespace App\Http\Controllers\Shop;

use App\Enums\FulfillmentMethod;
use App\Http\Controllers\Controller;
use App\Http\Requests\Shop\CheckoutRequest;
use App\Models\CartItem;
use App\Services\OrderService;
use App\Services\PricingService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CheckoutController extends Controller
{
    public function create(Request $request, PricingService $pricing): Response|RedirectResponse
    {
        $user = $request->user();
        $items = $user->cartItems()->with('product')->get()->filter(fn (CartItem $i) => $i->product !== null);

        if ($items->isEmpty() || $items->contains(fn (CartItem $i) => CartController::issueFor($i) !== null)) {
            $this->toast($items->isEmpty() ? 'Your cart is empty.' : 'Please fix the items in your cart before checking out.', 'warning');

            return to_route('cart.index');
        }

        $voucher = $pricing->findVoucher($request->session()->get('voucher_code'));
        $lines = CartController::lines($items);

        return Inertia::render('checkout/index', [
            'items' => $items->map(fn (CartItem $i) => [
                'id' => $i->id,
                'quantity' => $i->quantity,
                'name' => $i->product->name,
                'price' => $i->product->price,
                'unit' => $i->product->unit,
                'image_url' => $i->product->image_url,
            ])->values(),
            'quotes' => [
                'delivery' => $pricing->quote($lines, FulfillmentMethod::Delivery, $voucher, $user)->toArray(),
                'pickup' => $pricing->quote($lines, FulfillmentMethod::Pickup, $voucher, $user)->toArray(),
            ],
            'addresses' => $user->addresses()->orderByDesc('is_default')->latest()->get(),
            'paymentAccounts' => config('store.payment_accounts'),
            'scheduleWindow' => [
                'min' => now()->addDay()->toDateString(),
                'max' => now()->addDays((int) config('store.max_schedule_days'))->toDateString(),
            ],
        ]);
    }

    public function store(CheckoutRequest $request, OrderService $orders): RedirectResponse
    {
        $voucherCode = $request->session()->get('voucher_code');

        $order = $orders->placeOnline(
            $request->user(),
            [...$request->orderData(), 'voucher_code' => is_string($voucherCode) ? $voucherCode : null],
            $request->file('payment_proof'),
        );

        $request->session()->forget('voucher_code');

        return to_route('orders.show', ['order' => $order, 'placed' => 1]);
    }
}
