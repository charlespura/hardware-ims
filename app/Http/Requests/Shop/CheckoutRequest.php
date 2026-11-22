<?php

namespace App\Http\Requests\Shop;

use App\Enums\FulfillmentMethod;
use App\Enums\PaymentMethod;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CheckoutRequest extends FormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $maxDate = now()->addDays((int) config('store.max_schedule_days'))->toDateString();

        return [
            'fulfillment' => ['required', Rule::enum(FulfillmentMethod::class)],
            'address_id' => [
                Rule::requiredIf($this->input('fulfillment') === FulfillmentMethod::Delivery->value),
                'nullable',
                Rule::exists('addresses', 'id')->where('user_id', $this->user()->id),
            ],
            'preferred_date' => ['nullable', 'date', 'after_or_equal:tomorrow', "before_or_equal:{$maxDate}"],
            'notes' => ['nullable', 'string', 'max:500'],
            'payment_method' => ['required', Rule::enum(PaymentMethod::class)->only(PaymentMethod::online())],
            'payment_reference' => ['nullable', 'required_with:payment_proof', 'string', 'max:100'],
            'payment_proof' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ];
    }

    /**
     * The validated checkout input in the shape OrderService expects.
     *
     * @return array{fulfillment: string, address_id: int|null, preferred_date: string|null, notes: string|null, payment_method: string, payment_reference: string|null}
     */
    public function orderData(): array
    {
        return [
            'fulfillment' => $this->string('fulfillment')->value(),
            'address_id' => $this->filled('address_id') ? $this->integer('address_id') : null,
            'preferred_date' => $this->filled('preferred_date') ? $this->string('preferred_date')->value() : null,
            'notes' => $this->filled('notes') ? $this->string('notes')->value() : null,
            'payment_method' => $this->string('payment_method')->value(),
            'payment_reference' => $this->filled('payment_reference') ? $this->string('payment_reference')->value() : null,
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'address_id.required' => 'Choose a delivery address or add a new one.',
            'preferred_date.after_or_equal' => 'The earliest schedule we can offer is tomorrow.',
            'payment_reference.required_with' => 'Enter the reference number shown on your receipt.',
        ];
    }
}
