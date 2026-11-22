<?php

namespace Tests\Feature\Store;

use App\Enums\FulfillmentMethod;
use App\Enums\OrderStatus;
use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use App\Models\Voucher;
use App\Notifications\OrderUpdatedNotification;
use App\Services\OrderService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class OrderWorkflowTest extends TestCase
{
    use RefreshDatabase;

    private User $customer;

    private User $staff;

    private Product $product;

    protected function setUp(): void
    {
        parent::setUp();

        Notification::fake();
        Storage::fake('public');

        $this->customer = User::factory()->create();
        $this->staff = User::factory()->staff()->create();
        $this->product = Product::factory()->price(250)->stock(20)->create();
    }

    private function placeOrder(string $payment = 'cod', string $fulfillment = 'pickup', ?string $voucher = null): Order
    {
        $this->customer->cartItems()->create(['product_id' => $this->product->id, 'quantity' => 4]);

        return app(OrderService::class)->placeOnline($this->customer, [
            'fulfillment' => $fulfillment,
            'payment_method' => $payment,
            'voucher_code' => $voucher,
        ]);
    }

    public function test_staff_move_a_cod_pickup_order_through_every_step(): void
    {
        $order = $this->placeOrder();

        foreach ([OrderStatus::Processing, OrderStatus::ReadyForPickup, OrderStatus::Completed] as $next) {
            $this->actingAs($this->staff)
                ->post(route('admin.orders.status', $order), ['status' => $next->value])
                ->assertSessionHasNoErrors();
        }

        $order->refresh();
        $this->assertSame(OrderStatus::Completed, $order->status);
        $this->assertSame(PaymentStatus::Paid, $order->payment_status, 'COD is recorded as paid on completion');
        $this->assertNotNull($order->completed_at);
        $this->assertSame(4, $order->activities()->count());
        Notification::assertSentToTimes($this->customer, OrderUpdatedNotification::class, 3);
    }

    public function test_steps_cannot_be_skipped(): void
    {
        $order = $this->placeOrder();

        $this->actingAs($this->staff)
            ->post(route('admin.orders.status', $order), ['status' => OrderStatus::Completed->value])
            ->assertSessionHasErrors('status');

        $this->assertSame(OrderStatus::Pending, $order->fresh()->status);
    }

    public function test_delivery_orders_use_out_for_delivery_not_ready_for_pickup(): void
    {
        $this->assertSame(
            [OrderStatus::OutForDelivery, OrderStatus::Cancelled],
            OrderStatus::Processing->nextStatuses(FulfillmentMethod::Delivery),
        );
    }

    public function test_gcash_orders_cannot_be_confirmed_until_payment_is_verified(): void
    {
        $order = $this->placeOrder('gcash');
        app(OrderService::class)->submitPaymentProof($order, 'REF123', UploadedFile::fake()->image('r.png'), $this->customer);

        $this->actingAs($this->staff)
            ->post(route('admin.orders.status', $order), ['status' => 'processing'])
            ->assertSessionHasErrors('status');

        $this->actingAs($this->staff)->post(route('admin.orders.payment.verify', $order))->assertSessionHasNoErrors();
        $this->assertSame(PaymentStatus::Paid, $order->fresh()->payment_status);

        $this->actingAs($this->staff)
            ->post(route('admin.orders.status', $order), ['status' => 'processing'])
            ->assertSessionHasNoErrors();
    }

    public function test_rejected_proof_can_be_uploaded_again_by_the_customer(): void
    {
        $order = $this->placeOrder('bank_transfer');
        app(OrderService::class)->submitPaymentProof($order, 'BAD', UploadedFile::fake()->image('r.png'), $this->customer);

        $this->actingAs($this->staff)
            ->post(route('admin.orders.payment.reject', $order), ['reason' => 'Amount does not match'])
            ->assertSessionHasNoErrors();
        $this->assertSame(PaymentStatus::Rejected, $order->fresh()->payment_status);

        $this->actingAs($this->customer)
            ->post(route('orders.payment-proof', $order), ['payment_reference' => 'GOOD', 'payment_proof' => UploadedFile::fake()->image('new.png')])
            ->assertSessionHasNoErrors();

        $this->assertSame(PaymentStatus::ForVerification, $order->fresh()->payment_status);
        $this->assertSame('GOOD', $order->fresh()->payment_reference);
    }

    public function test_cancelling_restocks_items_and_releases_the_voucher(): void
    {
        $voucher = Voucher::factory()->create(['code' => 'TEN']);
        $order = $this->placeOrder(voucher: 'TEN');
        $this->assertSame(16, $this->product->fresh()->stock);
        $this->assertSame(1, $voucher->fresh()->times_used);

        $this->actingAs($this->customer)->post(route('orders.cancel', $order))->assertSessionHasNoErrors();

        $this->assertSame(OrderStatus::Cancelled, $order->fresh()->status);
        $this->assertSame(20, $this->product->fresh()->stock);
        $this->assertSame(0, $voucher->fresh()->times_used);
        $this->assertDatabaseHas('stock_movements', ['product_id' => $this->product->id, 'type' => 'cancellation', 'quantity' => 4]);
    }

    public function test_customers_cannot_cancel_once_the_order_is_confirmed(): void
    {
        $order = $this->placeOrder();
        app(OrderService::class)->transition($order, OrderStatus::Processing, $this->staff);

        $this->actingAs($this->customer)->post(route('orders.cancel', $order))->assertForbidden();
    }

    public function test_cancelling_a_paid_order_flags_a_refund(): void
    {
        $order = $this->placeOrder('gcash');
        $order->forceFill(['payment_status' => PaymentStatus::Paid])->save();

        app(OrderService::class)->transition($order, OrderStatus::Cancelled, $this->staff, 'Out of stock at supplier');

        $this->assertSame(PaymentStatus::Refunded, $order->fresh()->payment_status);
        $this->assertSame(PaymentMethod::Gcash, $order->fresh()->payment_method);
    }

    public function test_cancelling_while_proof_awaits_review_flags_a_refund(): void
    {
        $order = $this->placeOrder('gcash');
        app(OrderService::class)->submitPaymentProof($order, 'SENT', UploadedFile::fake()->image('r.png'), $this->customer);

        $this->actingAs($this->customer)->post(route('orders.cancel', $order))->assertSessionHasNoErrors();

        $this->assertSame(PaymentStatus::Refunded, $order->fresh()->payment_status);
    }

    public function test_buy_again_refills_the_cart(): void
    {
        $order = $this->placeOrder();

        $this->actingAs($this->customer)->post(route('orders.reorder', $order))->assertRedirect(route('cart.index'));

        $this->assertSame(4, $this->customer->cartItems()->first()->quantity);
    }
}
