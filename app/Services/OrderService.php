<?php

namespace App\Services;

use App\Enums\FulfillmentMethod;
use App\Enums\OrderChannel;
use App\Enums\OrderStatus;
use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Enums\StockMovementType;
use App\Models\Address;
use App\Models\CartItem;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use App\Notifications\OrderPlacedNotification;
use App\Notifications\OrderUpdatedNotification;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

/**
 * The order lifecycle: placing (online + POS), moving through statuses,
 * cancelling with restock, and verifying manual payments.
 */
class OrderService
{
    public function __construct(
        private readonly InventoryService $inventory,
        private readonly PricingService $pricing,
    ) {}

    /**
     * Turn a customer's cart into an order.
     *
     * @param  array{fulfillment: string, address_id?: int|null, preferred_date?: string|null, notes?: string|null, payment_method: string, payment_reference?: string|null, voucher_code?: string|null}  $data
     */
    public function placeOnline(User $customer, array $data, ?UploadedFile $proof = null): Order
    {
        $fulfillment = FulfillmentMethod::from($data['fulfillment']);
        $method = PaymentMethod::from($data['payment_method']);

        $order = DB::transaction(function () use ($customer, $data, $fulfillment, $method, $proof) {
            /** @var Collection<int, CartItem> $cart */
            $cart = $customer->cartItems()->with('product')->get();

            if ($cart->isEmpty()) {
                throw ValidationException::withMessages(['cart' => 'Your cart is empty.']);
            }

            $lines = $this->availableLines($cart->map(fn (CartItem $i) => [$i->product, $i->quantity]));

            $voucher = $this->pricing->findVoucher($data['voucher_code'] ?? null);

            if (filled($data['voucher_code'] ?? null) && ! $voucher) {
                throw ValidationException::withMessages(['voucher_code' => 'That voucher code does not exist.']);
            }

            $quote = $this->pricing->quote(
                $cart->map(fn (CartItem $i) => ['price' => $i->product->price, 'quantity' => $i->quantity]),
                $fulfillment,
                $voucher,
                $customer,
            );

            if ($quote->voucherError) {
                throw ValidationException::withMessages(['voucher_code' => $quote->voucherError]);
            }

            $address = null;

            if ($fulfillment === FulfillmentMethod::Delivery) {
                /** @var Address $address */
                $address = $customer->addresses()->findOrFail($data['address_id'] ?? 0);
            }

            $order = Order::create([
                'user_id' => $customer->id,
                'channel' => OrderChannel::Online,
                'status' => OrderStatus::Pending,
                'fulfillment' => $fulfillment,
                'customer_name' => $address->recipient_name ?? $customer->name,
                'customer_phone' => $address->phone ?? $customer->phone,
                'customer_email' => $customer->email,
                'shipping_address' => $address?->toLine(),
                'preferred_date' => $data['preferred_date'] ?? null,
                'notes' => $data['notes'] ?? null,
                'payment_method' => $method,
                'payment_status' => PaymentStatus::Unpaid,
                'voucher_id' => $quote->voucher?->id,
                'voucher_code' => $quote->voucher?->code,
                'subtotal' => $quote->subtotal,
                'discount' => $quote->discount,
                'shipping_fee' => $quote->shippingFee,
                'total' => $quote->total,
                'placed_at' => now(),
            ]);

            $this->assignNumber($order, 'HH');
            $this->addItems($order, $lines, $customer);

            $quote->voucher?->increment('times_used');

            $this->log($order, $customer, 'Order placed', OrderStatus::Pending);

            if ($proof && $method->requiresProof()) {
                $this->storeProof($order, $data['payment_reference'] ?? '', $proof, $customer);
            }

            $customer->cartItems()->delete();

            return $order;
        });

        $customer->notify(new OrderPlacedNotification($order));

        return $order;
    }

    /**
     * Record a completed walk-in sale from the POS screen.
     *
     * @param  array{items: array<int, array{product_id: int, quantity: int}>, customer_name?: string|null, payment_method: string, payment_reference?: string|null, amount_tendered?: float|string|null}  $data
     */
    public function placePos(User $cashier, array $data): Order
    {
        return DB::transaction(function () use ($cashier, $data) {
            $products = Product::whereIn('id', collect($data['items'])->pluck('product_id'))->get()->keyBy('id');

            $lines = $this->availableLines(collect($data['items'])
                ->groupBy('product_id')
                ->map(fn (Collection $rows, $id) => [$products->get($id), (int) $rows->sum('quantity')])
                ->values());

            $quote = $this->pricing->quote(
                $lines->map(fn (array $l) => ['price' => $l[0]->price, 'quantity' => $l[1]]),
                FulfillmentMethod::Pickup,
            );

            $method = PaymentMethod::from($data['payment_method']);
            $tendered = $method === PaymentMethod::Cash ? (float) ($data['amount_tendered'] ?? 0) : $quote->total;

            if ($tendered < $quote->total) {
                throw ValidationException::withMessages([
                    'amount_tendered' => 'Amount tendered is less than the total of ₱'.number_format($quote->total, 2).'.',
                ]);
            }

            $order = Order::create([
                'processed_by' => $cashier->id,
                'channel' => OrderChannel::Pos,
                'status' => OrderStatus::Completed,
                'fulfillment' => FulfillmentMethod::Pickup,
                'customer_name' => filled($data['customer_name'] ?? null) ? $data['customer_name'] : 'Walk-in customer',
                'payment_method' => $method,
                'payment_status' => PaymentStatus::Paid,
                'payment_reference' => $data['payment_reference'] ?? null,
                'paid_at' => now(),
                'subtotal' => $quote->subtotal,
                'discount' => 0,
                'shipping_fee' => 0,
                'total' => $quote->total,
                'amount_tendered' => $tendered,
                'change_due' => round($tendered - $quote->total, 2),
                'placed_at' => now(),
                'completed_at' => now(),
            ]);

            $this->assignNumber($order, 'POS');
            $this->addItems($order, $lines, $cashier);
            $this->log($order, $cashier, 'Walk-in sale completed', OrderStatus::Completed);

            return $order;
        });
    }

    /**
     * Move an order to its next status (staff action).
     */
    public function transition(Order $order, OrderStatus $to, User $actor, ?string $note = null): Order
    {
        if (! $order->status->canTransitionTo($to, $order->fulfillment)) {
            throw ValidationException::withMessages([
                'status' => "An order that is {$order->status->label()} cannot be marked as {$to->label()}.",
            ]);
        }

        if ($to === OrderStatus::Cancelled) {
            return $this->cancel($order, $actor, $note);
        }

        if ($to === OrderStatus::Processing && $order->payment_method->requiresProof() && $order->payment_status !== PaymentStatus::Paid) {
            throw ValidationException::withMessages([
                'status' => 'Verify the customer\'s '.$order->payment_method->label().' payment before confirming this order.',
            ]);
        }

        DB::transaction(function () use ($order, $to, $actor, $note) {
            $order->status = $to;
            $order->processed_by ??= $actor->id;

            if ($to === OrderStatus::Completed) {
                $order->completed_at = now();

                if ($order->payment_status !== PaymentStatus::Paid) {
                    $order->payment_status = PaymentStatus::Paid;
                    $order->paid_at = now();
                }
            }

            $order->save();
            $this->log($order, $actor, $this->titleFor($to, $order), $to, $note);
        });

        $this->notifyCustomer($order, $this->titleFor($to, $order), $this->messageFor($to, $order), $note);

        return $order;
    }

    /**
     * Cancel an open order, put the items back on the shelf and release the voucher.
     */
    public function cancel(Order $order, User $actor, ?string $reason = null): Order
    {
        if (! $order->status->isOpen()) {
            throw ValidationException::withMessages(['status' => 'This order can no longer be cancelled.']);
        }

        DB::transaction(function () use ($order, $actor, $reason) {
            foreach ($order->items()->with('product')->get() as $item) {
                if ($item->product) {
                    $this->inventory->move($item->product, $item->quantity, StockMovementType::Cancellation, $order, $actor, "Order {$order->number} cancelled");
                }
            }

            if ($order->voucher_id) {
                $order->voucher()->where('times_used', '>', 0)->decrement('times_used');
            }

            $order->status = OrderStatus::Cancelled;
            $order->cancelled_at = now();
            $order->cancellation_reason = $reason;

            // Money may already be with us (verified, or a proof awaiting review).
            if (in_array($order->payment_status, [PaymentStatus::Paid, PaymentStatus::ForVerification], true)) {
                $order->payment_status = PaymentStatus::Refunded;
            }

            $order->save();

            $by = $actor->id === $order->user_id ? 'by customer' : 'by store';
            $this->log($order, $actor, "Order cancelled {$by}", OrderStatus::Cancelled, $reason);
        });

        if ($actor->id !== $order->user_id) {
            $this->notifyCustomer($order, 'Your order was cancelled', 'Your order has been cancelled and any reserved items were released.', $reason);
        }

        return $order;
    }

    public function submitPaymentProof(Order $order, string $reference, UploadedFile $proof, User $customer): Order
    {
        if (! $order->canUploadPaymentProof()) {
            throw ValidationException::withMessages(['payment_proof' => 'Payment proof can no longer be submitted for this order.']);
        }

        DB::transaction(fn () => $this->storeProof($order, $reference, $proof, $customer));

        return $order;
    }

    public function verifyPayment(Order $order, User $actor): Order
    {
        $this->assertAwaitingVerification($order);

        DB::transaction(function () use ($order, $actor) {
            $order->forceFill([
                'payment_status' => PaymentStatus::Paid,
                'paid_at' => now(),
                'payment_rejection_reason' => null,
            ])->save();

            $this->log($order, $actor, 'Payment verified');
        });

        $this->notifyCustomer($order, 'Payment received', 'We have verified your '.$order->payment_method->label().' payment. Your order will be confirmed shortly.');

        return $order;
    }

    public function rejectPayment(Order $order, User $actor, string $reason): Order
    {
        $this->assertAwaitingVerification($order);

        DB::transaction(function () use ($order, $actor, $reason) {
            $order->forceFill([
                'payment_status' => PaymentStatus::Rejected,
                'payment_rejection_reason' => $reason,
            ])->save();

            $this->log($order, $actor, 'Payment proof rejected', null, $reason);
        });

        $this->notifyCustomer($order, 'We could not verify your payment', 'Please upload a new proof of payment from your order page.', $reason);

        return $order;
    }

    /**
     * Check every line is still sellable and return them with the product guaranteed.
     *
     * @param  Collection<int, array{0: Product|null, 1: int}>  $lines
     * @return Collection<int, array{0: Product, 1: int}>
     */
    private function availableLines(Collection $lines): Collection
    {
        $problems = [];
        $available = [];

        foreach ($lines as [$product, $quantity]) {
            if (! $product || ! $product->is_active) {
                $problems[] = 'An item in your list is no longer available.';
            } elseif ($product->stock < $quantity) {
                $problems[] = $product->stock === 0
                    ? "{$product->name} is out of stock."
                    : "Only {$product->stock} {$product->unit} of {$product->name} left.";
            } else {
                $available[] = [$product, $quantity];
            }
        }

        if ($problems) {
            throw ValidationException::withMessages(['stock' => implode(' ', array_unique($problems))]);
        }

        return collect($available);
    }

    /**
     * @param  Collection<int, array{0: Product, 1: int}>  $lines
     */
    private function addItems(Order $order, Collection $lines, User $actor): void
    {
        foreach ($lines as [$product, $quantity]) {
            $order->items()->create([
                'product_id' => $product->id,
                'product_name' => $product->name,
                'sku' => $product->sku,
                'unit_price' => $product->price,
                'unit_cost' => $product->cost_price,
                'quantity' => $quantity,
                'line_total' => round((float) $product->price * $quantity, 2),
            ]);

            $this->inventory->move($product, -$quantity, StockMovementType::Sale, $order, $actor, "Order {$order->number}");
        }
    }

    private function assignNumber(Order $order, string $prefix): void
    {
        $order->forceFill(['number' => sprintf('%s-%s-%05d', $prefix, now()->format('ymd'), $order->id)])->save();
    }

    private function storeProof(Order $order, string $reference, UploadedFile $proof, User $customer): void
    {
        if ($order->payment_proof_path) {
            Storage::disk('public')->delete($order->payment_proof_path);
        }

        $order->forceFill([
            'payment_reference' => $reference,
            'payment_proof_path' => $proof->store('payment-proofs', 'public'),
            'payment_status' => PaymentStatus::ForVerification,
            'payment_rejection_reason' => null,
        ])->save();

        $this->log($order, $customer, 'Payment proof submitted', null, "Reference no. {$reference}");
    }

    private function assertAwaitingVerification(Order $order): void
    {
        if ($order->payment_status !== PaymentStatus::ForVerification) {
            throw ValidationException::withMessages(['payment' => 'There is no payment waiting for verification on this order.']);
        }
    }

    private function log(Order $order, ?User $actor, string $title, ?OrderStatus $status = null, ?string $note = null): void
    {
        $order->activities()->create([
            'user_id' => $actor?->id,
            'status' => $status,
            'title' => $title,
            'note' => $note,
        ]);
    }

    private function titleFor(OrderStatus $status, Order $order): string
    {
        return match ($status) {
            OrderStatus::Processing => 'Order confirmed',
            OrderStatus::OutForDelivery => 'Out for delivery',
            OrderStatus::ReadyForPickup => 'Ready for pickup',
            OrderStatus::Completed => $order->fulfillment === FulfillmentMethod::Pickup ? 'Order picked up' : 'Order delivered',
            default => $status->label(),
        };
    }

    private function messageFor(OrderStatus $status, Order $order): string
    {
        return match ($status) {
            OrderStatus::Processing => 'Good news — we have confirmed your order and are preparing your items.',
            OrderStatus::OutForDelivery => 'Your order is on its way to '.$order->shipping_address.'.',
            OrderStatus::ReadyForPickup => 'Your order is ready. Please bring your order number to '.config('store.address').'.',
            OrderStatus::Completed => 'Thank you for shopping with us! We hope to see you again.',
            default => 'Your order status is now '.$status->label().'.',
        };
    }

    private function notifyCustomer(Order $order, string $headline, string $message, ?string $note = null): void
    {
        $order->customer?->notify(new OrderUpdatedNotification($order, $headline, $message, $note));
    }
}
