<?php

namespace App\Http\Controllers\Shop;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Product;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    public function __invoke(): Response
    {
        return Inertia::render('home', [
            'featured' => Product::active()
                ->with('brand:id,name')
                ->orderByDesc('is_featured')
                ->latest()
                ->take(8)
                ->get(ProductController::PUBLIC_COLUMNS),
            'categories' => Category::query()
                ->withCount(['products' => fn ($q) => $q->active()])
                ->orderByDesc('products_count')
                ->take(8)
                ->get(['id', 'name', 'slug', 'description']),
            'stats' => [
                'products' => Product::active()->count(),
                'categories' => Category::count(),
            ],
        ]);
    }
}
