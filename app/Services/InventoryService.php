<?php

namespace App\Services;

use App\Enums\StockMovementType;
use App\Models\Product;
use App\Models\StockMovement;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Every stock change goes through here so the ledger (stock_movements)
 * always explains the current quantity on hand.
 */
class InventoryService
{
    /**
     * Add (positive) or remove (negative) stock and record the movement.
     *
     * @throws ValidationException when the change would make stock negative
     */
    public function move(
        Product $product,
        int $quantity,
        StockMovementType $type,
        ?Model $reference = null,
        ?User $user = null,
        ?string $note = null,
    ): StockMovement {
        return DB::transaction(function () use ($product, $quantity, $type, $reference, $user, $note) {
            /** @var Product $locked */
            $locked = Product::withTrashed()->lockForUpdate()->findOrFail($product->id);

            $balance = $locked->stock + $quantity;

            if ($balance < 0) {
                throw ValidationException::withMessages([
                    'stock' => $locked->stock === 0
                        ? "{$locked->name} is out of stock."
                        : "Only {$locked->stock} {$locked->unit} of {$locked->name} left in stock.",
                ]);
            }

            $locked->forceFill(['stock' => $balance])->saveQuietly();
            $product->setAttribute('stock', $balance);

            return $locked->stockMovements()->create([
                'user_id' => $user?->id,
                'type' => $type,
                'quantity' => $quantity,
                'balance_after' => $balance,
                'reference_type' => $reference?->getMorphClass(),
                'reference_id' => $reference?->getKey(),
                'note' => $note,
            ]);
        });
    }

    /**
     * Set the on-hand quantity to an exact count (e.g. after a physical count).
     */
    public function setCount(Product $product, int $counted, User $user, ?string $note = null): ?StockMovement
    {
        $delta = $counted - $product->fresh()->stock;

        if ($delta === 0) {
            return null;
        }

        return $this->move($product, $delta, StockMovementType::Adjustment, null, $user, $note);
    }
}
