<?php

namespace App\Models;

use Database\Factories\ProductFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * @property int $id
 * @property int $category_id
 * @property int|null $brand_id
 * @property string $name
 * @property string $slug
 * @property string $sku
 * @property string|null $model
 * @property string|null $description
 * @property string|null $specifications
 * @property string $unit
 * @property string $cost_price
 * @property string $price
 * @property int $stock
 * @property int $reorder_level
 * @property string|null $image_path
 * @property bool $is_active
 * @property bool $is_featured
 */
#[Fillable([
    'category_id', 'brand_id', 'name', 'sku', 'model', 'description', 'specifications',
    'unit', 'cost_price', 'price', 'reorder_level', 'image_path', 'is_active', 'is_featured',
])]
class Product extends Model
{
    /** @use HasFactory<ProductFactory> */
    use HasFactory, SoftDeletes;

    protected $appends = ['image_url', 'stock_status'];

    protected static function booted(): void
    {
        static::saving(function (Product $product) {
            if ($product->isDirty('name') || ! $product->slug) {
                $base = Str::slug($product->name);
                $slug = $base;
                $i = 2;

                while (static::withTrashed()->where('slug', $slug)->whereKeyNot($product->getKey())->exists()) {
                    $slug = "{$base}-{$i}";
                    $i++;
                }

                $product->slug = $slug;
            }
        });
    }

    protected function casts(): array
    {
        return [
            'cost_price' => 'decimal:2',
            'price' => 'decimal:2',
            'stock' => 'integer',
            'reorder_level' => 'integer',
            'is_active' => 'boolean',
            'is_featured' => 'boolean',
        ];
    }

    /** @return BelongsTo<Category, $this> */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    /** @return BelongsTo<Brand, $this> */
    public function brand(): BelongsTo
    {
        return $this->belongsTo(Brand::class);
    }

    /** @return HasMany<StockMovement, $this> */
    public function stockMovements(): HasMany
    {
        return $this->hasMany(StockMovement::class);
    }

    /** @return HasMany<OrderItem, $this> */
    public function orderItems(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    /** @param Builder<Product> $query */
    #[Scope]
    protected function active(Builder $query): void
    {
        $query->where('is_active', true);
    }

    /** @param Builder<Product> $query */
    #[Scope]
    protected function lowStock(Builder $query): void
    {
        $query->whereColumn('stock', '<=', 'reorder_level');
    }

    /** @param Builder<Product> $query */
    #[Scope]
    protected function search(Builder $query, ?string $term): void
    {
        if (blank($term)) {
            return;
        }

        $query->where(function (Builder $q) use ($term) {
            $q->where('name', 'like', "%{$term}%")
                ->orWhere('sku', 'like', "%{$term}%")
                ->orWhere('model', 'like', "%{$term}%");
        });
    }

    /** @return Attribute<string|null, never> */
    protected function imageUrl(): Attribute
    {
        return Attribute::get(fn () => $this->image_path ? Storage::disk('public')->url($this->image_path) : null);
    }

    /** @return Attribute<string, never> */
    protected function stockStatus(): Attribute
    {
        return Attribute::get(fn () => match (true) {
            $this->stock <= 0 => 'out_of_stock',
            $this->stock <= $this->reorder_level => 'low_stock',
            default => 'in_stock',
        });
    }
}
