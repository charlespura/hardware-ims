<?php

namespace App\Http\Requests\Admin;

use App\Enums\PaymentMethod;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PosSaleRequest extends FormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'customer_name' => ['nullable', 'string', 'max:255'],
            'payment_method' => ['required', Rule::enum(PaymentMethod::class)->only([PaymentMethod::Cash, PaymentMethod::Gcash])],
            'payment_reference' => ['nullable', 'required_if:payment_method,gcash', 'string', 'max:100'],
            'amount_tendered' => ['nullable', 'required_if:payment_method,cash', 'numeric', 'min:0'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'exists:products,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
        ];
    }

    /**
     * @return array{items: array<int, array{product_id: int, quantity: int}>, customer_name: string|null, payment_method: string, payment_reference: string|null, amount_tendered: float|null}
     */
    public function saleData(): array
    {
        return [
            'items' => collect($this->array('items'))
                ->map(fn (mixed $item) => ['product_id' => (int) data_get($item, 'product_id'), 'quantity' => (int) data_get($item, 'quantity')])
                ->values()
                ->all(),
            'customer_name' => $this->filled('customer_name') ? $this->string('customer_name')->value() : null,
            'payment_method' => $this->string('payment_method')->value(),
            'payment_reference' => $this->filled('payment_reference') ? $this->string('payment_reference')->value() : null,
            'amount_tendered' => $this->filled('amount_tendered') ? $this->float('amount_tendered') : null,
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'items.required' => 'Add at least one item to the sale.',
            'payment_reference.required_if' => 'Enter the GCash reference number.',
            'amount_tendered.required_if' => 'Enter the cash received.',
        ];
    }
}
