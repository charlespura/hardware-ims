<?php

namespace Tests\Feature\Store;

use App\Enums\OrderChannel;
use App\Enums\OrderStatus;
use App\Enums\PurchaseOrderStatus;
use App\Models\Category;
use App\Models\Order;
use App\Models\Product;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BackOfficeTest extends TestCase
{
    use RefreshDatabase;

    private User $staff;

    protected function setUp(): void
    {
        parent::setUp();

        $this->staff = User::factory()->staff()->create();
    }

    public function test_pos_sale_completes_immediately_and_computes_change(): void
    {
        $product = Product::factory()->price(120)->stock(10)->create();

        $this->actingAs($this->staff)->post(route('admin.pos.store'), [
            'payment_method' => 'cash',
            'amount_tendered' => 500,
            'items' => [['product_id' => $product->id, 'quantity' => 3]],
        ])->assertRedirect();

        $order = Order::sole();
        $this->assertSame(OrderChannel::Pos, $order->channel);
        $this->assertSame(OrderStatus::Completed, $order->status);
        $this->assertEquals(360, (float) $order->total);
        $this->assertEquals(140, (float) $order->change_due);
        $this->assertSame(7, $product->fresh()->stock);
    }

    public function test_pos_rejects_insufficient_cash(): void
    {
        $product = Product::factory()->price(120)->stock(10)->create();

        $this->actingAs($this->staff)->post(route('admin.pos.store'), [
            'payment_method' => 'cash',
            'amount_tendered' => 100,
            'items' => [['product_id' => $product->id, 'quantity' => 1]],
        ])->assertSessionHasErrors('amount_tendered');

        $this->assertSame(10, $product->fresh()->stock);
    }

    public function test_receiving_a_purchase_order_adds_stock_and_updates_cost(): void
    {
        $product = Product::factory()->stock(3)->create(['cost_price' => 100]);
        $supplier = Supplier::factory()->create();

        $this->actingAs($this->staff)->post(route('admin.purchase-orders.store'), [
            'supplier_id' => $supplier->id,
            'items' => [['product_id' => $product->id, 'quantity' => 50, 'unit_cost' => 90]],
        ])->assertSessionHasNoErrors();

        $po = $supplier->purchaseOrders()->sole();
        $this->assertSame(PurchaseOrderStatus::Ordered, $po->status);
        $this->assertSame(3, $product->fresh()->stock, 'stock only changes when the delivery is received');

        $this->actingAs($this->staff)->post(route('admin.purchase-orders.receive', $po))->assertSessionHasNoErrors();

        $this->assertSame(PurchaseOrderStatus::Received, $po->fresh()->status);
        $this->assertSame(53, $product->fresh()->stock);
        $this->assertEquals(90, (float) $product->fresh()->cost_price);

        // Receiving twice is blocked.
        $this->actingAs($this->staff)->post(route('admin.purchase-orders.receive', $po))->assertSessionHasErrors('status');
        $this->assertSame(53, $product->fresh()->stock);
    }

    public function test_creating_a_product_records_opening_stock_in_the_ledger(): void
    {
        $category = Category::factory()->create();

        $this->actingAs($this->staff)->post(route('admin.products.store'), [
            'name' => 'Spirit Level 24"',
            'sku' => 'LVL-24',
            'category_id' => $category->id,
            'unit' => 'pc',
            'cost_price' => 300,
            'price' => 450,
            'reorder_level' => 5,
            'opening_stock' => 12,
            'is_active' => true,
        ])->assertSessionHasNoErrors();

        $product = Product::where('sku', 'LVL-24')->sole();
        $this->assertSame(12, $product->stock);
        $this->assertSame('spirit-level-24', $product->slug);
        $this->assertDatabaseHas('stock_movements', ['product_id' => $product->id, 'type' => 'initial', 'quantity' => 12]);
    }

    public function test_stock_adjustments_cannot_go_negative(): void
    {
        $product = Product::factory()->stock(4)->create();

        $this->actingAs($this->staff)
            ->post(route('admin.products.adjust-stock', $product), ['mode' => 'remove', 'quantity' => 5, 'note' => 'Damaged'])
            ->assertSessionHasErrors('stock');

        $this->actingAs($this->staff)
            ->post(route('admin.products.adjust-stock', $product), ['mode' => 'set', 'quantity' => 9, 'note' => 'Physical count'])
            ->assertSessionHasNoErrors();

        $this->assertSame(9, $product->fresh()->stock);
        $this->assertDatabaseHas('stock_movements', ['product_id' => $product->id, 'type' => 'adjustment', 'quantity' => 5, 'note' => 'Physical count']);
    }

    public function test_reports_and_csv_exports_render(): void
    {
        Product::factory()->count(3)->create();

        $this->actingAs($this->staff)->get(route('admin.reports.index'))->assertOk();
        $this->actingAs($this->staff)->get(route('admin.reports.inventory'))->assertOk()->assertHeader('content-type', 'text/csv; charset=utf-8');
        $this->actingAs($this->staff)->get(route('admin.reports.sales'))->assertOk();
    }
}
