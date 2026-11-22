<?php

namespace App\Support;

use App\Models\Voucher;

/**
 * The computed totals for a cart, checkout or POS sale.
 */
final readonly class Quote
{
    public function __construct(
        public float $subtotal,
        public float $discount,
        public float $shippingFee,
        public float $total,
        public ?Voucher $voucher = null,
        public ?string $voucherError = null,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'subtotal' => $this->subtotal,
            'discount' => $this->discount,
            'shipping_fee' => $this->shippingFee,
            'total' => $this->total,
            'voucher' => $this->voucher ? [
                'code' => $this->voucher->code,
                'summary' => $this->voucher->summary(),
            ] : null,
            'voucher_error' => $this->voucherError,
        ];
    }
}
