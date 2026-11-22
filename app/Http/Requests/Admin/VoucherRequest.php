<?php

namespace App\Http\Requests\Admin;

use App\Enums\VoucherType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class VoucherRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $this->merge(['code' => strtoupper(trim((string) $this->input('code')))]);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'code' => ['required', 'string', 'max:40', 'alpha_dash', Rule::unique('vouchers', 'code')->ignore($this->route('voucher'))],
            'description' => ['nullable', 'string', 'max:255'],
            'type' => ['required', Rule::enum(VoucherType::class)],
            'value' => [
                Rule::requiredIf($this->input('type') !== VoucherType::FreeShipping->value),
                'nullable', 'numeric', 'min:0',
                Rule::when($this->input('type') === VoucherType::Percentage->value, ['max:100']),
            ],
            'min_spend' => ['nullable', 'numeric', 'min:0'],
            'max_discount' => ['nullable', 'numeric', 'min:0'],
            'usage_limit' => ['nullable', 'integer', 'min:1'],
            'starts_at' => ['nullable', 'date'],
            'expires_at' => ['nullable', 'date', 'after_or_equal:starts_at'],
            'is_active' => ['boolean'],
        ];
    }
}
