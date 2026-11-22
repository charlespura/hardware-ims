<?php

namespace App\Http\Controllers\Admin;

use App\Enums\PurchaseOrderStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\PurchaseOrderRequest;
use App\Models\Product;
use App\Models\PurchaseOrder;
use App\Models\Supplier;
use App\Services\PurchaseOrderService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class PurchaseOrderController extends Controller
{
    public function __construct(private readonly PurchaseOrderService $service) {}

    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'status' => ['nullable', Rule::enum(PurchaseOrderStatus::class)],
            'supplier' => ['nullable', 'integer'],
        ]);

        return Inertia::render('admin/purchase-orders/index', [
            'purchaseOrders' => PurchaseOrder::query()
                ->with('supplier:id,name')
                ->withCount('items')
                ->when($filters['status'] ?? null, fn ($q, $s) => $q->where('status', $s))
                ->when($filters['supplier'] ?? null, fn ($q, $id) => $q->where('supplier_id', $id))
                ->latest()
                ->paginate(15)
                ->withQueryString(),
            'suppliers' => Supplier::orderBy('name')->get(['id', 'name']),
            'filters' => [
                'status' => $filters['status'] ?? '',
                'supplier' => (string) ($filters['supplier'] ?? ''),
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/purchase-orders/create', [
            'suppliers' => Supplier::where('is_active', true)->orderBy('name')->get(['id', 'name']),
            'products' => Product::active()->orderBy('name')->get(['id', 'name', 'sku', 'unit', 'cost_price', 'stock', 'reorder_level']),
        ]);
    }

    public function store(PurchaseOrderRequest $request): RedirectResponse
    {
        $po = $this->service->create($request->user(), $request->purchaseData());
        $this->toast("Purchase order {$po->number} created.");

        return to_route('admin.purchase-orders.show', $po);
    }

    public function show(PurchaseOrder $purchaseOrder): Response
    {
        return Inertia::render('admin/purchase-orders/show', [
            'purchaseOrder' => $purchaseOrder->load([
                'supplier',
                'items.product:id,name,sku,unit,stock,reorder_level',
                'creator:id,name',
                'receiver:id,name',
            ]),
        ]);
    }

    public function receive(Request $request, PurchaseOrder $purchaseOrder): RedirectResponse
    {
        $this->service->receive($purchaseOrder, $request->user());
        $this->toast("{$purchaseOrder->number} received — stock levels updated.");

        return back();
    }

    public function cancel(PurchaseOrder $purchaseOrder): RedirectResponse
    {
        $this->service->cancel($purchaseOrder);
        $this->toast("{$purchaseOrder->number} was cancelled.", 'info');

        return back();
    }
}
