<?php

namespace Tests\Feature\Store;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Enums\StockMovementType;
use App\Enums\VoucherType;
use App\Models\Address;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use App\Models\Voucher;
use App\Notifications\OrderPlacedNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class CheckoutTest extends TestCase
{
    use RefreshDatabase;

    private User $customer;

    private Address $address;

    protected function setUp(): void
    {
        parent::setUp();

        Notification::fake();
        Storage::fake('public');

        $this->customer = User::factory()->create();
        $this->address = Address::factory()->for($this->customer)->create();
    }

    private function checkout(array $overrides = [])
    {
        return $this->actingAs($this->customer)->post(route('checkout.store'), [
            'fulfillment' => 'delivery',
            'address_id' => $this->address->id,
            'preferred_date' => now()->addDays(2)->toDateString(),
            'payment_method' => 'cod',
            ...$overrides,
        ]);
    }

    public function test_placing_an_order_saves_items_deducts_stock_and_clears_the_cart(): void
    {
        $hammer = Product::factory()->price(500)->stock(10)->create();
        $nails = Product::factory()->price(75)->stock(100)->create();
        $this->customer->cartItems()->create(['product_id' => $hammer->id, 'quantity' => 2]);
        $this->customer->cartItems()->create(['product_id' => $nails->id, 'quantity' => 4]);

        $this->checkout()->assertRedirect();

        $order = Order::with('items')->sole();

        $this->assertSame(OrderStatus::Pending, $order->status);
        $this->assertCount(2, $order->items);
        $this->assertEquals(1300.00, (float) $order->subtotal);
        $this->assertEquals(45.00, (float) $order->shipping_fee);
        $this->assertEquals(1345.00, (float) $order->total);
        $this->assertSame(8, $hammer->fresh()->stock);
        $this->assertSame(96, $nails->fresh()->stock);
        $this->assertDatabaseHas('stock_movements', ['product_id' => $hammer->id, 'type' => StockMovementType::Sale->value, 'quantity' => -2, 'balance_after' => 8]);
        $this->assertSame(0, $this->customer->cartItems()->count());
        Notification::assertSentTo($this->customer, OrderPlacedNotification::class);
    }

    public function test_totals_keep_centavos(): void
    {
        $item = Product::factory()->price(199.75)->stock(5)->create();
        $this->customer->cartItems()->create(['product_id' => $item->id, 'quantity' => 1]);

        $this->checkout(['fulfillment' => 'pickup', 'address_id' => null]);

        $this->assertEquals(199.75, (float) Order::sole()->total);
    }

    public function test_delivery_is_free_above_the_threshold_and_pickup_is_always_free(): void
    {
        config(['store.free_shipping_threshold' => 1000]);
        $item = Product::factory()->price(1200)->stock(5)->create();
        $this->customer->cartItems()->create(['product_id' => $item->id, 'quantity' => 1]);

        $this->checkout();

        $this->assertEquals(0, (float) Order::sole()->shipping_fee);
    }

    public function test_checkout_fails_when_stock_ran_out_after_adding_to_cart(): void
    {
        $item = Product::factory()->stock(5)->create();
        $this->customer->cartItems()->create(['product_id' => $item->id, 'quantity' => 3]);
        $item->forceFill(['stock' => 1])->save(); // e.g. a walk-in sale took the rest

        $this->checkout()->assertSessionHasErrors('stock');

        $this->assertDatabaseCount('orders', 0);
        $this->assertSame(1, $item->fresh()->stock);
    }

    public function test_a_valid_voucher_is_applied_and_counted(): void
    {
        $item = Product::factory()->price(1000)->stock(5)->create();
        $this->customer->cartItems()->create(['product_id' => $item->id, 'quantity' => 2]);
        $voucher = Voucher::factory()->create(['code' => 'SAVE10', 'type' => VoucherType::Percentage, 'value' => 10, 'min_spend' => 500]);

        $this->actingAs($this->customer)->withSession(['voucher_code' => 'SAVE10'])->post(route('checkout.store'), [
            'fulfillment' => 'pickup',
            'payment_method' => 'cod',
        ]);

        $order = Order::sole();
        $this->assertEquals(200, (float) $order->discount);
        $this->assertEquals(1800, (float) $order->total);
        $this->assertSame(1, $voucher->fresh()->times_used);
    }

    public function test_an_unknown_voucher_code_is_rejected_in_the_cart(): void
    {
        $this->actingAs($this->customer)
            ->post(route('cart.voucher.apply'), ['voucher_code' => 'ANYTHING'])
            ->assertSessionHasErrors('voucher_code');
    }

    public function test_expired_and_below_minimum_vouchers_are_rejected(): void
    {
        $item = Product::factory()->price(100)->stock(5)->create();
        $this->customer->cartItems()->create(['product_id' => $item->id, 'quantity' => 1]);
        Voucher::factory()->create(['code' => 'OLD', 'expires_at' => now()->subDay()]);
        Voucher::factory()->create(['code' => 'BIG', 'min_spend' => 5000]);

        $this->actingAs($this->customer)->post(route('cart.voucher.apply'), ['voucher_code' => 'old'])
            ->assertSessionHasErrors(['voucher_code' => 'This voucher has expired.']);
        $this->actingAs($this->customer)->post(route('cart.voucher.apply'), ['voucher_code' => 'BIG'])
            ->assertSessionHasErrors('voucher_code');
    }

    public function test_a_customer_can_use_a_voucher_only_once(): void
    {
        $item = Product::factory()->price(1000)->stock(10)->create();
        Voucher::factory()->create(['code' => 'ONCE']);

        foreach ([1, 2] as $attempt) {
            $this->customer->cartItems()->create(['product_id' => $item->id, 'quantity' => 1]);
            $response = $this->actingAs($this->customer)->withSession(['voucher_code' => 'ONCE'])
                ->post(route('checkout.store'), ['fulfillment' => 'pickup', 'payment_method' => 'cod']);
        }

        $response->assertSessionHasErrors('voucher_code');
        $this->assertDatabaseCount('orders', 1);
    }

    public function test_gcash_order_with_proof_is_queued_for_verification(): void
    {
        $item = Product::factory()->stock(5)->create();
        $this->customer->cartItems()->create(['product_id' => $item->id, 'quantity' => 1]);

        $this->checkout([
            'payment_method' => 'gcash',
            'payment_reference' => '1234567890',
            'payment_proof' => UploadedFile::fake()->image('receipt.jpg'),
        ]);

        $order = Order::sole();
        $this->assertSame(PaymentStatus::ForVerification, $order->payment_status);
        Storage::disk('public')->assertExists($order->payment_proof_path);
    }

    public function test_delivery_requires_one_of_your_own_addresses(): void
    {
        $item = Product::factory()->stock(5)->create();
        $this->customer->cartItems()->create(['product_id' => $item->id, 'quantity' => 1]);
        $someoneElses = Address::factory()->create();

        $this->checkout(['address_id' => $someoneElses->id])->assertSessionHasErrors('address_id');
        $this->checkout(['address_id' => null])->assertSessionHasErrors('address_id');
    }
}
