<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class PurchaseOrderRequest extends FormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'supplier_id' => ['required', 'exists:suppliers,id'],
            'expected_at' => ['nullable', 'date', 'after_or_equal:today'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'distinct', 'exists:products,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:100000'],
            'items.*.unit_cost' => ['required', 'numeric', 'min:0'],
        ];
    }

    /**
     * @return array{supplier_id: int, expected_at: string|null, notes: string|null, items: array<int, array{product_id: int, quantity: int, unit_cost: float}>}
     */
    public function purchaseData(): array
    {
        return [
            'supplier_id' => $this->integer('supplier_id'),
            'expected_at' => $this->filled('expected_at') ? $this->string('expected_at')->value() : null,
            'notes' => $this->filled('notes') ? $this->string('notes')->value() : null,
            'items' => collect($this->array('items'))
                ->map(fn (mixed $item) => [
                    'product_id' => (int) data_get($item, 'product_id'),
                    'quantity' => (int) data_get($item, 'quantity'),
                    'unit_cost' => (float) data_get($item, 'unit_cost'),
                ])
                ->values()
                ->all(),
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'items.required' => 'Add at least one product to this purchase order.',
            'items.*.product_id.distinct' => 'Each product can only appear once.',
        ];
    }
}
