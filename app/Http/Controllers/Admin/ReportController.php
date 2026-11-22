<?php

namespace App\Http\Controllers\Admin;

use App\Enums\OrderStatus;
use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    public function index(Request $request): Response
    {
        [$from, $to] = $this->range($request);

        $orders = Order::revenue()->whereBetween('placed_at', [$from, $to]);

        $items = OrderItem::query()
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->where('orders.status', '!=', OrderStatus::Cancelled->value)
            ->whereBetween('orders.placed_at', [$from, $to]);

        $gross = (float) (clone $orders)->sum('subtotal');
        $discounts = (float) (clone $orders)->sum('discount');
        $shipping = (float) (clone $orders)->sum('shipping_fee');
        $cogs = (float) (clone $items)->sum(DB::raw('order_items.unit_cost * order_items.quantity'));
        $count = (clone $orders)->count();
        $net = $gross - $discounts;

        return Inertia::render('admin/reports/index', [
            'range' => ['from' => $from->toDateString(), 'to' => $to->toDateString()],
            'summary' => [
                'orders' => $count,
                'units' => (int) (clone $items)->sum('order_items.quantity'),
                'gross_sales' => $gross,
                'discounts' => $discounts,
                'shipping' => $shipping,
                'net_sales' => $net,
                'cogs' => $cogs,
                'gross_profit' => $net - $cogs,
                'average_order' => $count > 0 ? round(($net + $shipping) / $count, 2) : 0,
                'cancelled' => Order::where('status', OrderStatus::Cancelled)->whereBetween('placed_at', [$from, $to])->count(),
            ],
            'byChannel' => (clone $orders)->toBase()->selectRaw('channel as name, COUNT(*) as orders, SUM(total) as revenue')->groupBy('channel')->get(),
            'byPayment' => (clone $orders)->toBase()->selectRaw('payment_method as name, COUNT(*) as orders, SUM(total) as revenue')->groupBy('payment_method')->get(),
            'products' => (clone $items)
                ->groupBy('order_items.product_id', 'order_items.product_name', 'order_items.sku')
                ->selectRaw('order_items.product_id, order_items.product_name as name, order_items.sku, SUM(order_items.quantity) as units, SUM(order_items.line_total) as revenue, SUM(order_items.line_total - order_items.unit_cost * order_items.quantity) as profit')
                ->orderByDesc('revenue')
                ->take(15)
                ->get(),
        ]);
    }

    public function exportSales(Request $request): StreamedResponse
    {
        [$from, $to] = $this->range($request);

        $orders = Order::whereBetween('placed_at', [$from, $to])->orderBy('placed_at')->withCount('items');

        return response()->streamDownload(function () use ($orders) {
            $out = fopen('php://output', 'w');

            if ($out === false) {
                return;
            }

            fputcsv($out, ['Order #', 'Date', 'Channel', 'Customer', 'Status', 'Payment method', 'Payment status', 'Items', 'Subtotal', 'Discount', 'Shipping', 'Total']);

            foreach ($orders->lazy() as $o) {
                fputcsv($out, [
                    $o->number, $o->placed_at->format('Y-m-d H:i'), $o->channel->label(), $o->customer_name,
                    $o->status->label(), $o->payment_method->label(), $o->payment_status->label(), $o->items_count,
                    $o->subtotal, $o->discount, $o->shipping_fee, $o->total,
                ]);
            }

            fclose($out);
        }, "sales-{$from->toDateString()}-to-{$to->toDateString()}.csv", ['Content-Type' => 'text/csv']);
    }

    public function exportInventory(): StreamedResponse
    {
        return response()->streamDownload(function () {
            $out = fopen('php://output', 'w');

            if ($out === false) {
                return;
            }

            fputcsv($out, ['SKU', 'Product', 'Category', 'Brand', 'Unit', 'On hand', 'Reorder level', 'Status', 'Unit cost', 'Selling price', 'Stock value (cost)']);

            foreach (Product::with(['category:id,name', 'brand:id,name'])->orderBy('name')->lazy() as $p) {
                fputcsv($out, [
                    $p->sku, $p->name, $p->category?->name, $p->brand?->name, $p->unit, $p->stock, $p->reorder_level,
                    str_replace('_', ' ', $p->stock_status), $p->cost_price, $p->price, round($p->stock * (float) $p->cost_price, 2),
                ]);
            }

            fclose($out);
        }, 'inventory-'.now()->toDateString().'.csv', ['Content-Type' => 'text/csv']);
    }

    /**
     * @return array{0: CarbonImmutable, 1: CarbonImmutable}
     */
    private function range(Request $request): array
    {
        $data = $request->validate([
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
        ]);

        return [
            isset($data['from']) ? CarbonImmutable::parse($data['from'])->startOfDay() : CarbonImmutable::today()->startOfMonth(),
            isset($data['to']) ? CarbonImmutable::parse($data['to'])->endOfDay() : CarbonImmutable::today()->endOfDay(),
        ];
    }
}
