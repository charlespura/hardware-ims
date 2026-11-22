<?php

namespace App\Services;

use App\Enums\PurchaseOrderStatus;
use App\Enums\StockMovementType;
use App\Models\PurchaseOrder;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PurchaseOrderService
{
    public function __construct(private readonly InventoryService $inventory) {}

    /**
     * @param  array{supplier_id: int, expected_at?: string|null, notes?: string|null, items: array<int, array{product_id: int, quantity: int, unit_cost: float|string}>}  $data
     */
    public function create(User $user, array $data): PurchaseOrder
    {
        return DB::transaction(function () use ($user, $data) {
            $po = PurchaseOrder::create([
                'supplier_id' => $data['supplier_id'],
                'created_by' => $user->id,
                'status' => PurchaseOrderStatus::Ordered,
                'expected_at' => $data['expected_at'] ?? null,
                'notes' => $data['notes'] ?? null,
            ]);

            $total = 0;

            foreach ($data['items'] as $item) {
                $line = round((float) $item['unit_cost'] * (int) $item['quantity'], 2);
                $total += $line;

                $po->items()->create([
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'unit_cost' => $item['unit_cost'],
                    'line_total' => $line,
                ]);
            }

            $po->forceFill([
                'number' => sprintf('PO-%s-%04d', now()->format('ymd'), $po->id),
                'total' => round($total, 2),
            ])->save();

            return $po;
        });
    }

    /**
     * Mark the delivery as received: stock goes up and the product cost is updated.
     */
    public function receive(PurchaseOrder $po, User $user): PurchaseOrder
    {
        $this->assertOpen($po);

        return DB::transaction(function () use ($po, $user) {
            foreach ($po->items()->with('product')->get() as $item) {
                $this->inventory->move($item->product, $item->quantity, StockMovementType::Purchase, $po, $user, "Received {$po->number}");
                $item->product->forceFill(['cost_price' => $item->unit_cost])->saveQuietly();
            }

            $po->forceFill([
                'status' => PurchaseOrderStatus::Received,
                'received_at' => now(),
                'received_by' => $user->id,
            ])->save();

            return $po;
        });
    }

    public function cancel(PurchaseOrder $po): PurchaseOrder
    {
        $this->assertOpen($po);

        $po->forceFill(['status' => PurchaseOrderStatus::Cancelled, 'cancelled_at' => now()])->save();

        return $po;
    }

    private function assertOpen(PurchaseOrder $po): void
    {
        if ($po->status !== PurchaseOrderStatus::Ordered) {
            throw ValidationException::withMessages(['status' => "This purchase order is already {$po->status->label()}."]);
        }
    }
}
