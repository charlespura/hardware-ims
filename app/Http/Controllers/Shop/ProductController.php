<?php

namespace App\Http\Controllers\Shop;

use App\Http\Controllers\Controller;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    /**
     * Columns that are safe to show customers (no cost price).
     */
    public const PUBLIC_COLUMNS = [
        'id', 'category_id', 'brand_id', 'name', 'slug', 'sku', 'model', 'unit',
        'price', 'stock', 'reorder_level', 'image_path', 'is_featured',
    ];

    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'category' => ['nullable', 'string', 'max:100'],
            'brand' => ['nullable', 'string', 'max:100'],
            'min_price' => ['nullable', 'numeric', 'min:0'],
            'max_price' => ['nullable', 'numeric', 'min:0'],
            'in_stock' => ['nullable', 'boolean'],
            'sort' => ['nullable', Rule::in(['featured', 'newest', 'price_asc', 'price_desc', 'name', 'popular'])],
        ]);

        $sort = $filters['sort'] ?? 'featured';

        $products = Product::active()
            ->with(['category:id,name,slug', 'brand:id,name,slug'])
            ->search($filters['search'] ?? null)
            ->when($filters['category'] ?? null, fn ($q, $slug) => $q->whereRelation('category', 'slug', $slug))
            ->when($filters['brand'] ?? null, fn ($q, $slug) => $q->whereRelation('brand', 'slug', $slug))
            ->when(isset($filters['min_price']), fn ($q) => $q->where('price', '>=', $filters['min_price']))
            ->when(isset($filters['max_price']), fn ($q) => $q->where('price', '<=', $filters['max_price']))
            ->when($request->boolean('in_stock'), fn ($q) => $q->where('stock', '>', 0))
            ->when($sort === 'popular', fn ($q) => $q->withSum('orderItems as sold', 'quantity')->orderByDesc('sold'))
            ->when($sort === 'featured', fn ($q) => $q->orderByDesc('is_featured')->orderByRaw('stock = 0')->orderBy('name'))
            ->when($sort === 'newest', fn ($q) => $q->latest())
            ->when($sort === 'price_asc', fn ($q) => $q->orderBy('price'))
            ->when($sort === 'price_desc', fn ($q) => $q->orderByDesc('price'))
            ->when($sort === 'name', fn ($q) => $q->orderBy('name'))
            ->select(self::PUBLIC_COLUMNS)
            ->paginate(12)
            ->withQueryString();

        return Inertia::render('shop/index', [
            'products' => $products,
            'categories' => Category::withCount(['products' => fn ($q) => $q->active()])->orderBy('name')->get(['id', 'name', 'slug']),
            'brands' => Brand::whereHas('products', fn ($q) => $q->active())->orderBy('name')->get(['id', 'name', 'slug']),
            'filters' => [
                'search' => $filters['search'] ?? '',
                'category' => $filters['category'] ?? '',
                'brand' => $filters['brand'] ?? '',
                'min_price' => $filters['min_price'] ?? '',
                'max_price' => $filters['max_price'] ?? '',
                'in_stock' => $request->boolean('in_stock'),
                'sort' => $sort,
            ],
        ]);
    }

    public function show(Request $request, Product $product): Response
    {
        abort_unless($product->is_active, 404);

        $product->load(['category:id,name,slug', 'brand:id,name,slug'])->makeHidden(['cost_price']);

        return Inertia::render('shop/show', [
            'product' => $product,
            'related' => Product::active()
                ->where('category_id', $product->category_id)
                ->whereKeyNot($product->id)
                ->with('brand:id,name')
                ->inRandomOrder()
                ->take(4)
                ->get(self::PUBLIC_COLUMNS),
            'inCart' => (int) $request->user()?->cartItems()->where('product_id', $product->id)->value('quantity'),
        ]);
    }
}
