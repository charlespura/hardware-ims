<?php

namespace App\Http\Controllers\Admin;

use App\Enums\OrderChannel;
use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(): Response
    {
        $today = CarbonImmutable::today();
        $monthStart = $today->startOfMonth();
        $lastMonthStart = $monthStart->subMonth();
        $lastMonthSameDay = $lastMonthStart->addDays($today->day - 1)->endOfDay();

        $revenue = fn (CarbonImmutable $from, CarbonImmutable $to) => (float) Order::revenue()
            ->whereBetween('placed_at', [$from, $to])
            ->sum('total');

        $monthRevenue = $revenue($monthStart, $today->endOfDay());
        $lastMonthRevenue = $revenue($lastMonthStart, $lastMonthSameDay);

        return Inertia::render('admin/dashboard', [
            'kpis' => [
                'today_revenue' => $revenue($today, $today->endOfDay()),
                'today_orders' => Order::revenue()->where('placed_at', '>=', $today)->count(),
                'month_revenue' => $monthRevenue,
                'month_change' => $lastMonthRevenue > 0 ? round(($monthRevenue - $lastMonthRevenue) / $lastMonthRevenue * 100, 1) : null,
                'pending_orders' => Order::where('status', OrderStatus::Pending)->count(),
                'payments_to_verify' => Order::where('payment_status', PaymentStatus::ForVerification)->where('status', '!=', OrderStatus::Cancelled)->count(),
                'low_stock' => Product::active()->lowStock()->count(),
                'inventory_value' => (float) Product::active()->sum(DB::raw('stock * cost_price')),
                'customers' => User::where('role', Role::Customer)->count(),
            ],
            'salesChart' => $this->salesChart($today),
            'topProducts' => OrderItem::query()
                ->join('orders', 'orders.id', '=', 'order_items.order_id')
                ->where('orders.status', '!=', OrderStatus::Cancelled->value)
                ->where('orders.placed_at', '>=', $today->subDays(29))
                ->groupBy('order_items.product_id', 'order_items.product_name')
                ->selectRaw('order_items.product_id, order_items.product_name as name, SUM(order_items.quantity) as units, SUM(order_items.line_total) as revenue')
                ->orderByDesc('revenue')
                ->take(5)
                ->get(),
            'categorySales' => OrderItem::query()
                ->join('orders', 'orders.id', '=', 'order_items.order_id')
                ->join('products', 'products.id', '=', 'order_items.product_id')
                ->join('categories', 'categories.id', '=', 'products.category_id')
                ->where('orders.status', '!=', OrderStatus::Cancelled->value)
                ->where('orders.placed_at', '>=', $today->subDays(29))
                ->groupBy('categories.name')
                ->selectRaw('categories.name as name, SUM(order_items.line_total) as revenue')
                ->orderByDesc('revenue')
                ->get(),
            'recentOrders' => Order::latest('placed_at')
                ->take(6)
                ->get(['id', 'number', 'customer_name', 'channel', 'status', 'payment_status', 'payment_method', 'total', 'placed_at']),
            'lowStock' => Product::active()->lowStock()
                ->orderBy('stock')->orderByDesc('reorder_level')
                ->take(6)
                ->get(['id', 'name', 'sku', 'stock', 'reorder_level', 'unit', 'image_path']),
        ]);
    }

    /**
     * Daily revenue for the last 30 days, split by sales channel.
     *
     * @return list<array{date: string, online: float, pos: float}>
     */
    private function salesChart(CarbonImmutable $today): array
    {
        $from = $today->subDays(29);

        $orders = Order::revenue()
            ->where('placed_at', '>=', $from)
            ->get(['placed_at', 'channel', 'total']);

        $days = [];

        for ($day = $from; $day->lte($today); $day = $day->addDay()) {
            $days[$day->toDateString()] = ['date' => $day->toDateString(), 'online' => 0.0, 'pos' => 0.0];
        }

        foreach ($orders as $order) {
            $key = $order->placed_at->toDateString();
            $channel = $order->channel === OrderChannel::Pos ? 'pos' : 'online';

            if (isset($days[$key])) {
                $days[$key][$channel] = round($days[$key][$channel] + (float) $order->total, 2);
            }
        }

        return array_values($days);
    }
}
