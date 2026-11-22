<?php

namespace Tests\Feature\Store;

use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CartTest extends TestCase
{
    use RefreshDatabase;

    public function test_customer_can_add_a_product_to_the_cart(): void
    {
        $customer = User::factory()->create();
        $product = Product::factory()->stock(10)->create();

        $this->actingAs($customer)
            ->post(route('cart.store'), ['product_id' => $product->id, 'quantity' => 3])
            ->assertSessionHasNoErrors();

        $this->assertDatabaseHas('cart_items', ['user_id' => $customer->id, 'product_id' => $product->id, 'quantity' => 3]);
    }

    public function test_adding_the_same_product_twice_merges_the_quantity(): void
    {
        $customer = User::factory()->create();
        $product = Product::factory()->stock(10)->create();

        $this->actingAs($customer)->post(route('cart.store'), ['product_id' => $product->id, 'quantity' => 2]);
        $this->actingAs($customer)->post(route('cart.store'), ['product_id' => $product->id, 'quantity' => 4]);

        $this->assertSame(6, $customer->cartItems()->first()->quantity);
    }

    public function test_cannot_add_more_than_is_in_stock(): void
    {
        $customer = User::factory()->create();
        $product = Product::factory()->stock(2)->create();

        $this->actingAs($customer)
            ->post(route('cart.store'), ['product_id' => $product->id, 'quantity' => 5])
            ->assertSessionHasErrors('quantity');

        $this->assertDatabaseCount('cart_items', 0);
    }

    public function test_hidden_products_cannot_be_added(): void
    {
        $customer = User::factory()->create();
        $product = Product::factory()->inactive()->create();

        $this->actingAs($customer)
            ->post(route('cart.store'), ['product_id' => $product->id, 'quantity' => 1])
            ->assertNotFound();
    }

    public function test_removing_an_item_only_affects_your_own_cart(): void
    {
        $product = Product::factory()->create();
        [$alice, $bob] = User::factory()->count(2)->create();
        $alice->cartItems()->create(['product_id' => $product->id, 'quantity' => 1]);
        $bobsItem = $bob->cartItems()->create(['product_id' => $product->id, 'quantity' => 1]);

        // Alice cannot delete Bob's line (the legacy app deleted the item from every cart).
        $this->actingAs($alice)->delete(route('cart.destroy', $bobsItem))->assertNotFound();

        $this->assertDatabaseCount('cart_items', 2);
    }

    public function test_staff_cannot_use_the_customer_cart(): void
    {
        $this->actingAs(User::factory()->staff()->create())
            ->get(route('cart.index'))
            ->assertForbidden();
    }
}
