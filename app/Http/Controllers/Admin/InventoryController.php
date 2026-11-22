<?php

namespace App\Http\Controllers\Admin;

use App\Enums\StockMovementType;
use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\StockMovement;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class InventoryController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'type' => ['nullable', Rule::enum(StockMovementType::class)],
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date'],
        ]);

        $movements = StockMovement::query()
            ->with(['product:id,name,sku,unit', 'user:id,name', 'reference'])
            ->when($filters['search'] ?? null, fn ($q, $term) => $q->whereHas('product', fn ($p) => $p->withTrashed()->search($term)))
            ->when($filters['type'] ?? null, fn ($q, $type) => $q->where('type', $type))
            ->when($filters['from'] ?? null, fn ($q, $from) => $q->whereDate('created_at', '>=', $from))
            ->when($filters['to'] ?? null, fn ($q, $to) => $q->whereDate('created_at', '<=', $to))
            ->latest()->latest('id')
            ->paginate(20)
            ->withQueryString()
            ->through(fn (StockMovement $m) => [
                ...$m->only(['id', 'type', 'quantity', 'balance_after', 'note', 'created_at']),
                'product' => $m->product?->only(['id', 'name', 'sku', 'unit']),
                'user' => $m->user?->only(['id', 'name']),
                'reference' => $m->reference ? ['type' => class_basename($m->reference), 'number' => $m->reference->number ?? null] : null,
            ]);

        return Inertia::render('admin/inventory/index', [
            'movements' => $movements,
            'summary' => [
                'skus' => Product::active()->count(),
                'units' => (int) Product::active()->sum('stock'),
                'low' => Product::active()->where('stock', '>', 0)->lowStock()->count(),
                'out' => Product::active()->where('stock', 0)->count(),
            ],
            'filters' => [
                'search' => $filters['search'] ?? '',
                'type' => $filters['type'] ?? '',
                'from' => $filters['from'] ?? '',
                'to' => $filters['to'] ?? '',
            ],
        ]);
    }
}
