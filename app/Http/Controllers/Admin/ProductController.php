<?php

namespace App\Http\Controllers\Admin;

use App\Enums\OrderStatus;
use App\Enums\StockMovementType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ProductRequest;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use App\Services\InventoryService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    public function __construct(private readonly InventoryService $inventory) {}

    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'category' => ['nullable', 'integer'],
            'stock' => ['nullable', Rule::in(['in', 'low', 'out'])],
            'status' => ['nullable', Rule::in(['active', 'inactive', 'archived'])],
            'sort' => ['nullable', Rule::in(['name', 'stock', 'price', 'newest'])],
        ]);

        $products = Product::query()
            ->with(['category:id,name', 'brand:id,name'])
            ->search($filters['search'] ?? null)
            ->when($filters['category'] ?? null, fn ($q, $id) => $q->where('category_id', $id))
            ->when(($filters['stock'] ?? null) === 'out', fn ($q) => $q->where('stock', 0))
            ->when(($filters['stock'] ?? null) === 'low', fn ($q) => $q->where('stock', '>', 0)->lowStock())
            ->when(($filters['stock'] ?? null) === 'in', fn ($q) => $q->whereColumn('stock', '>', 'reorder_level'))
            ->when(($filters['status'] ?? null) === 'active', fn ($q) => $q->where('is_active', true))
            ->when(($filters['status'] ?? null) === 'inactive', fn ($q) => $q->where('is_active', false))
            ->when(($filters['status'] ?? null) === 'archived', fn ($q) => $q->onlyTrashed())
            ->when(match ($filters['sort'] ?? 'name') {
                'stock' => ['stock', 'asc'],
                'price' => ['price', 'desc'],
                'newest' => ['created_at', 'desc'],
                default => ['name', 'asc'],
            }, fn ($q, $sort) => $q->orderBy(...$sort))
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('admin/products/index', [
            'products' => $products,
            'categories' => Category::orderBy('name')->get(['id', 'name']),
            'filters' => [
                'search' => $filters['search'] ?? '',
                'category' => (string) ($filters['category'] ?? ''),
                'stock' => $filters['stock'] ?? '',
                'status' => $filters['status'] ?? '',
                'sort' => $filters['sort'] ?? 'name',
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/products/form', $this->formOptions());
    }

    public function store(ProductRequest $request): RedirectResponse
    {
        $product = DB::transaction(function () use ($request) {
            $product = Product::create([
                ...$request->safe()->except(['image', 'remove_image', 'opening_stock']),
                'image_path' => $request->file('image')?->store('products', 'public'),
            ]);

            if ($request->integer('opening_stock') > 0) {
                $this->inventory->move($product, $request->integer('opening_stock'), StockMovementType::Initial, null, $request->user(), 'Opening stock');
            }

            return $product;
        });

        $this->toast("{$product->name} was added to the catalog.");

        return to_route('admin.products.show', $product);
    }

    public function show(Product $product): Response
    {
        $product->load(['category:id,name', 'brand:id,name']);

        $recentSales = fn () => $product->orderItems()
            ->whereHas('order', fn ($q) => $q->where('status', '!=', OrderStatus::Cancelled)->where('placed_at', '>=', now()->subDays(30)));

        return Inertia::render('admin/products/show', [
            'product' => $product,
            'movements' => $product->stockMovements()
                ->with(['user:id,name', 'reference'])
                ->latest()->latest('id')
                ->paginate(10)
                ->through(fn ($m) => [
                    ...$m->only(['id', 'type', 'quantity', 'balance_after', 'note', 'created_at']),
                    'user' => $m->user?->only(['id', 'name']),
                    'reference' => $m->reference ? ['type' => class_basename($m->reference), 'number' => $m->reference->number ?? null] : null,
                ]),
            'stats' => [
                'units_30d' => (int) $recentSales()->sum('quantity'),
                'revenue_30d' => (float) $recentSales()->sum('line_total'),
                'stock_value' => round($product->stock * (float) $product->cost_price, 2),
                'margin' => (float) $product->price > 0 ? round((1 - (float) $product->cost_price / (float) $product->price) * 100, 1) : 0,
            ],
        ]);
    }

    public function edit(Product $product): Response
    {
        return Inertia::render('admin/products/form', [...$this->formOptions(), 'product' => $product]);
    }

    public function update(ProductRequest $request, Product $product): RedirectResponse
    {
        $data = $request->safe()->except(['image', 'remove_image', 'opening_stock']);

        if ($request->hasFile('image') || $request->boolean('remove_image')) {
            if ($product->image_path) {
                Storage::disk('public')->delete($product->image_path);
            }

            $data['image_path'] = $request->file('image')?->store('products', 'public');
        }

        $product->update($data);

        $this->toast('Product updated.');

        return to_route('admin.products.show', $product);
    }

    public function adjustStock(Request $request, Product $product): RedirectResponse
    {
        $data = $request->validate([
            'mode' => ['required', Rule::in(['add', 'remove', 'set'])],
            'quantity' => ['required', 'integer', 'min:0', 'max:1000000'],
            'note' => ['required', 'string', 'max:255'],
        ]);

        $quantity = $request->integer('quantity');
        $note = $request->string('note')->value();

        $movement = $data['mode'] === 'set'
            ? $this->inventory->setCount($product, $quantity, $request->user(), $note)
            : $this->inventory->move($product, $data['mode'] === 'remove' ? -$quantity : $quantity, StockMovementType::Adjustment, null, $request->user(), $note);

        $this->toast($movement ? "Stock for {$product->name} is now {$movement->balance_after}." : 'Stock count unchanged.', $movement ? 'success' : 'info');

        return back();
    }

    public function destroy(Product $product): RedirectResponse
    {
        $product->delete();
        $this->toast("{$product->name} was archived. You can restore it from the Archived filter.", 'info');

        return to_route('admin.products.index');
    }

    public function restore(int $product): RedirectResponse
    {
        $model = Product::onlyTrashed()->findOrFail($product);
        $model->restore();
        $this->toast("{$model->name} was restored.");

        return back();
    }

    /**
     * @return array<string, mixed>
     */
    private function formOptions(): array
    {
        return [
            'categories' => Category::orderBy('name')->get(['id', 'name']),
            'brands' => Brand::orderBy('name')->get(['id', 'name']),
            'units' => ['pc', 'set', 'box', 'bag', 'kg', 'meter', 'roll', 'sheet', 'gallon', 'liter', 'pair', 'length'],
        ];
    }
}
