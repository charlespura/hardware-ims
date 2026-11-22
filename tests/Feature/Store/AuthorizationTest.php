<?php

namespace Tests\Feature\Store;

use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use App\Services\OrderService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthorizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_sent_to_login_from_protected_pages(): void
    {
        foreach (['cart.index', 'orders.index', 'admin.dashboard', 'admin.products.index'] as $route) {
            $this->get(route($route))->assertRedirect(route('login'));
        }
    }

    public function test_customers_cannot_open_the_back_office(): void
    {
        $customer = User::factory()->create();

        foreach (['admin.dashboard', 'admin.orders.index', 'admin.products.index', 'admin.pos.index', 'admin.reports.index'] as $route) {
            $this->actingAs($customer)->get(route($route))->assertForbidden();
        }
    }

    public function test_staff_cannot_manage_users_or_vouchers(): void
    {
        $staff = User::factory()->staff()->create();

        $this->actingAs($staff)->get(route('admin.users.index'))->assertForbidden();
        $this->actingAs($staff)->get(route('admin.vouchers.index'))->assertForbidden();
        $this->actingAs($staff)->get(route('admin.orders.index'))->assertOk();
    }

    public function test_admins_can_manage_users_and_vouchers(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)->get(route('admin.users.index'))->assertOk();
        $this->actingAs($admin)->get(route('admin.vouchers.index'))->assertOk();
    }

    public function test_customers_can_only_see_their_own_orders(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $order = $this->orderFor($owner);

        $this->actingAs($owner)->get(route('orders.show', $order))->assertOk();
        $this->actingAs($other)->get(route('orders.show', $order))->assertForbidden();
        $this->actingAs($other)->get(route('orders.receipt', $order))->assertForbidden();
    }

    public function test_deactivated_users_cannot_sign_in(): void
    {
        $user = User::factory()->inactive()->create();

        $this->post(route('login.store'), ['email' => $user->email, 'password' => 'password'])
            ->assertSessionHasErrors('email');

        $this->assertGuest();
    }

    public function test_registration_cannot_assign_a_role(): void
    {
        $this->post(route('register.store'), [
            'name' => 'Sneaky',
            'email' => 'sneaky@example.com',
            'phone' => '09170000000',
            'role' => 'admin',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $this->assertSame('customer', User::where('email', 'sneaky@example.com')->sole()->role->value);
    }

    public function test_admins_cannot_demote_themselves(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)->put(route('admin.users.update', $admin), ['name' => $admin->name, 'role' => 'customer', 'is_active' => true]);

        $this->assertSame('admin', $admin->fresh()->role->value);
    }

    private function orderFor(User $customer): Order
    {
        $product = Product::factory()->create();
        $customer->cartItems()->create(['product_id' => $product->id, 'quantity' => 1]);

        return app(OrderService::class)->placeOnline($customer, ['fulfillment' => 'pickup', 'payment_method' => 'cod']);
    }
}
