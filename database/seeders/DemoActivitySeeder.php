<?php

namespace Database\Seeders;

use App\Enums\FulfillmentMethod;
use App\Enums\OrderStatus;
use App\Enums\PaymentMethod;
use App\Enums\Role;
use App\Models\Order;
use App\Models\Product;
use App\Models\Supplier;
use App\Models\User;
use App\Services\OrderService;
use App\Services\PurchaseOrderService;
use Carbon\CarbonImmutable;
use Illuminate\Database\Seeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;

/**
 * Replays ~6 weeks of store activity through the real services, so stock
 * movements, order timelines and dashboard numbers are all consistent.
 */
class DemoActivitySeeder extends Seeder
{
    /** The real "now", captured before the clock is frozen for replaying history. */
    private CarbonImmutable $now;

    private User $staff;

    private User $admin;

    /** @var Collection<int, Product> */
    private Collection $fastMovers;

    public function __construct(
        private readonly OrderService $orders,
        private readonly PurchaseOrderService $purchasing,
    ) {}

    public function run(): void
    {
        config(['mail.default' => 'array']); // don't flood the mail log with demo e-mails
        mt_srand(20241212);
        $this->now = CarbonImmutable::now();

        $this->staff = User::where('email', 'staff@hardwarehub.test')->firstOrFail();
        $this->admin = User::where('email', 'admin@hardwarehub.test')->firstOrFail();
        $this->fastMovers = Product::where('stock', '>=', 60)->get();
        $customers = User::where('role', Role::Customer)->where('email', '!=', 'customer@hardwarehub.test')->with('addresses')->get();
        $juan = User::where('email', 'customer@hardwarehub.test')->with('addresses')->firstOrFail();

        $this->seedPurchaseOrders();

        for ($daysAgo = 42; $daysAgo >= 0; $daysAgo--) {
            $day = $this->now->startOfDay()->subDays($daysAgo);
            $online = match (true) {
                $daysAgo <= 2 => mt_rand(2, 4),
                $daysAgo < 14 => mt_rand(0, 3),
                default => mt_rand(0, 2),
            };
            $walkIns = mt_rand(1, 4);

            for ($i = 0; $i < $online; $i++) {
                $placedAt = $day->setTime(mt_rand(8, 20), mt_rand(0, 59));

                if ($placedAt->isAfter($this->now)) {
                    $placedAt = $this->now->subMinutes(mt_rand(5, 120));
                }

                $this->onlineOrder($customers->random(), $placedAt, $daysAgo);
            }

            for ($i = 0; $i < $walkIns; $i++) {
                $soldAt = $day->setTime(mt_rand(8, 17), mt_rand(0, 59));
                $soldAt = $soldAt->isAfter($this->now) ? $this->now->subMinutes(mt_rand(5, 240)) : $soldAt;

                $this->at($soldAt, fn () => $this->attempt(fn () => $this->orders->placePos($this->staff, [
                    'items' => $this->randomLines(mt_rand(1, 3), 4),
                    'customer_name' => mt_rand(0, 2) === 0 ? 'Walk-in customer' : fake()->firstName(),
                    'payment_method' => mt_rand(0, 4) === 0 ? 'gcash' : 'cash',
                    'payment_reference' => (string) mt_rand(1000000000, 9999999999),
                    'amount_tendered' => 100000,
                ])));
            }
        }

        $this->seedDemoCustomerStory($juan);

        Carbon::setTestNow();
        CarbonImmutable::setTestNow();
    }

    private function onlineOrder(User $customer, CarbonImmutable $placedAt, int $daysAgo, ?string $payment = null, ?string $fulfillment = null, ?string $finalStatus = null): ?Order
    {
        $payment ??= collect(['cod', 'cod', 'cod', 'gcash', 'gcash', 'bank_transfer'])->random();
        $fulfillment ??= mt_rand(0, 9) < 7 ? 'delivery' : 'pickup';

        $order = $this->at($placedAt, function () use ($customer, $payment, $fulfillment) {
            foreach ($this->randomLines(mt_rand(1, 3), 5) as $line) {
                $customer->cartItems()->updateOrCreate(['product_id' => $line['product_id']], ['quantity' => $line['quantity']]);
            }

            $data = [
                'fulfillment' => $fulfillment,
                'address_id' => $customer->addresses->first()?->id,
                'preferred_date' => now()->addDays(mt_rand(1, 3))->toDateString(),
                'payment_method' => $payment,
                'payment_reference' => (string) mt_rand(1000000000, 9999999999),
                'voucher_code' => mt_rand(0, 6) === 0 ? 'WELCOME10' : null,
            ];

            $proof = PaymentMethod::from($payment)->requiresProof() ? $this->receiptImage($data['payment_reference']) : null;

            return $this->attempt(fn () => $this->orders->placeOnline($customer, $data, $proof))
                ?? $this->attempt(fn () => $this->orders->placeOnline($customer, [...$data, 'voucher_code' => null], $proof));
        });

        if (! $order) {
            $customer->cartItems()->delete();

            return null;
        }

        $finalStatus ??= match (true) {
            $daysAgo >= 3 => mt_rand(0, 9) === 0 ? 'cancelled' : 'completed',
            $daysAgo >= 1 => collect(['processing', 'shipped', 'shipped', 'completed'])->random(),
            default => mt_rand(0, 2) === 0 ? 'processing' : 'pending',
        };

        $this->progress($order, $placedAt, $finalStatus);

        return $order;
    }

    private function progress(Order $order, CarbonImmutable $placedAt, string $finalStatus): void
    {
        if ($finalStatus === 'pending') {
            return;
        }

        if ($finalStatus === 'cancelled') {
            $this->at($placedAt->addHours(3), fn () => $this->orders->cancel($order, $order->customer, 'Changed my mind'));

            return;
        }

        if ($order->payment_method->requiresProof()) {
            $this->at($placedAt->addHour(), fn () => $this->orders->verifyPayment($order, $this->staff));
        }

        $this->at($placedAt->addHours(2), fn () => $this->orders->transition($order, OrderStatus::Processing, $this->staff));

        if ($finalStatus === 'processing') {
            return;
        }

        $next = $order->fulfillment === FulfillmentMethod::Pickup ? OrderStatus::ReadyForPickup : OrderStatus::OutForDelivery;
        $this->at($placedAt->addHours(20), fn () => $this->orders->transition($order, $next, $this->staff));

        if ($finalStatus === 'completed') {
            $this->at($placedAt->addHours(30), fn () => $this->orders->transition($order, OrderStatus::Completed, $this->staff));
        }
    }

    private function seedDemoCustomerStory(User $juan): void
    {
        $today = $this->now;

        $this->onlineOrder($juan, $today->subDays(12)->setTime(9, 30), 12, 'cod', 'delivery', 'completed');
        $this->onlineOrder($juan, $today->subDays(6)->setTime(15, 10), 6, 'cod', 'pickup', 'completed');
        $this->onlineOrder($juan, $today->subDay()->setTime(10, 5), 1, 'gcash', 'delivery', 'shipped');
        $this->onlineOrder($juan, $today->subHours(2), 0, 'gcash', 'delivery', 'pending');

        // Something sitting in Juan's cart for the demo.
        $juan->cartItems()->create(['product_id' => Product::where('sku', 'SN987654')->value('id'), 'quantity' => 1]);
        $juan->cartItems()->create(['product_id' => Product::where('sku', 'PAINT123456')->value('id'), 'quantity' => 2]);
    }

    private function seedPurchaseOrders(): void
    {
        $metro = Supplier::where('name', 'like', 'Metro%')->firstOrFail();
        $toolpro = Supplier::where('name', 'like', 'ToolPro%')->firstOrFail();
        $tiles = Supplier::where('name', 'like', 'Luzon%')->firstOrFail();
        $sku = fn (string $sku) => Product::where('sku', $sku)->firstOrFail();

        $received = $this->at($this->now->startOfDay()->subDays(21)->setTime(10, 0), fn () => $this->purchasing->create($this->admin, [
            'supplier_id' => $metro->id,
            'expected_at' => now()->addDays(3)->toDateString(),
            'notes' => 'Monthly restock of structural materials.',
            'items' => [
                ['product_id' => $sku('CEM123456')->id, 'quantity' => 80, 'unit_cost' => 248],
                ['product_id' => $sku('STEEL654321')->id, 'quantity' => 60, 'unit_cost' => 355],
                ['product_id' => $sku('PHLFT6R7K9W')->id, 'quantity' => 300, 'unit_cost' => 14.5],
            ],
        ]));
        $this->at($this->now->startOfDay()->subDays(18)->setTime(14, 0), fn () => $this->purchasing->receive($received, $this->staff));

        $this->at($this->now->startOfDay()->subDays(2)->setTime(11, 0), fn () => $this->purchasing->create($this->admin, [
            'supplier_id' => $toolpro->id,
            'expected_at' => now()->addDays(5)->toDateString(),
            'notes' => 'Restock of low-stock tools.',
            'items' => [
                ['product_id' => $sku('MW123456789')->id, 'quantity' => 10, 'unit_cost' => 1430],
                ['product_id' => $sku('LAD789654')->id, 'quantity' => 8, 'unit_cost' => 1800],
                ['product_id' => $sku('MAK-GA4030')->id, 'quantity' => 6, 'unit_cost' => 2050],
            ],
        ]));

        $this->at($this->now->startOfDay()->subDays(1)->setTime(9, 0), fn () => $this->purchasing->create($this->staff, [
            'supplier_id' => $tiles->id,
            'expected_at' => now()->addDays(4)->toDateString(),
            'items' => [
                ['product_id' => $sku('TILE123456')->id, 'quantity' => 40, 'unit_cost' => 540],
            ],
        ]));
    }

    /**
     * @return array<int, array{product_id: int, quantity: int}>
     */
    private function randomLines(int $count, int $maxQty): array
    {
        return $this->fastMovers->random(min($count, $this->fastMovers->count()))
            ->map(fn (Product $p) => ['product_id' => $p->id, 'quantity' => mt_rand(1, $maxQty)])
            ->values()
            ->all();
    }

    /**
     * Run a callback with the clock frozen at the given moment.
     *
     * @template T
     *
     * @param  callable(): T  $callback
     * @return T
     */
    private function at(CarbonImmutable $moment, callable $callback): mixed
    {
        Carbon::setTestNow($moment);
        CarbonImmutable::setTestNow($moment);

        return $callback();
    }

    /**
     * @template T
     *
     * @param  callable(): T  $callback
     * @return T|null
     */
    private function attempt(callable $callback): mixed
    {
        try {
            return $callback();
        } catch (ValidationException) {
            return null;
        }
    }

    /**
     * Draw a simple fake e-wallet receipt so payment verification has something to show.
     */
    private function receiptImage(string $reference): UploadedFile
    {
        $img = imagecreatetruecolor(360, 520);
        $blue = imagecolorallocate($img, 0, 112, 243) ?: 0;
        $white = imagecolorallocate($img, 255, 255, 255) ?: 0;
        $dark = imagecolorallocate($img, 30, 41, 59) ?: 0;
        $muted = imagecolorallocate($img, 100, 116, 139) ?: 0;

        imagefilledrectangle($img, 0, 0, 360, 520, $white);
        imagefilledrectangle($img, 0, 0, 360, 120, $blue);
        imagestring($img, 5, 24, 40, 'DEMO E-WALLET RECEIPT', $white);
        imagestring($img, 3, 24, 70, 'Sample image for testing', $white);
        imagestring($img, 4, 24, 160, 'Sent to: HardwareHub Trading', $dark);
        imagestring($img, 4, 24, 200, 'Ref No. '.$reference, $dark);
        imagestring($img, 4, 24, 240, now()->format('M d, Y g:i A'), $muted);
        imagestring($img, 3, 24, 460, 'Not a real transaction.', $muted);

        $path = tempnam(sys_get_temp_dir(), 'receipt').'.png';
        imagepng($img, $path);
        imagedestroy($img);

        return new UploadedFile($path, 'receipt.png', 'image/png', null, true);
    }
}
