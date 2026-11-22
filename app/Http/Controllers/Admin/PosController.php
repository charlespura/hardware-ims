<?php

namespace App\Http\Controllers\Admin;

use App\Enums\OrderChannel;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\PosSaleRequest;
use App\Models\Category;
use App\Models\Order;
use App\Models\Product;
use App\Services\OrderService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PosController extends Controller
{
    public function index(Request $request): Response
    {
        return Inertia::render('admin/pos/index', [
            'products' => Product::active()
                ->orderBy('name')
                ->get(['id', 'category_id', 'name', 'sku', 'unit', 'price', 'stock', 'reorder_level', 'image_path']),
            'categories' => Category::orderBy('name')->get(['id', 'name']),
            'recentSales' => Order::where('channel', OrderChannel::Pos)
                ->whereDate('placed_at', today())
                ->latest('placed_at')
                ->take(5)
                ->get(['id', 'number', 'customer_name', 'total', 'payment_method', 'placed_at']),
            'todayTotal' => (float) Order::where('channel', OrderChannel::Pos)->revenue()->whereDate('placed_at', today())->sum('total'),
            'lastSale' => $request->query('sale')
                ? Order::where('number', $request->query('sale'))->first(['id', 'number', 'total', 'amount_tendered', 'change_due', 'payment_method'])
                : null,
        ]);
    }

    public function store(PosSaleRequest $request, OrderService $orders): RedirectResponse
    {
        $order = $orders->placePos($request->user(), $request->saleData());

        return to_route('admin.pos.index', ['sale' => $order->number]);
    }
}
