<?php

namespace App\Services;

use App\Enums\FulfillmentMethod;
use App\Enums\OrderStatus;
use App\Enums\VoucherType;
use App\Models\User;
use App\Models\Voucher;
use App\Support\Quote;

/**
 * Single source of truth for subtotal, delivery fee and voucher discounts,
 * so the cart, checkout and the saved order always agree.
 */
class PricingService
{
    public function shippingFee(float $subtotal, FulfillmentMethod $fulfillment): float
    {
        if ($fulfillment === FulfillmentMethod::Pickup || $subtotal <= 0) {
            return 0.0;
        }

        $threshold = (float) config('store.free_shipping_threshold');

        return $threshold > 0 && $subtotal >= $threshold ? 0.0 : (float) config('store.shipping_fee');
    }

    /**
     * @param  iterable<array{price: float|string, quantity: int}>  $lines
     */
    public function quote(iterable $lines, FulfillmentMethod $fulfillment, ?Voucher $voucher = null, ?User $customer = null): Quote
    {
        $subtotal = 0.0;

        foreach ($lines as $line) {
            $subtotal += round((float) $line['price'] * $line['quantity'], 2);
        }

        $subtotal = round($subtotal, 2);
        $shipping = $this->shippingFee($subtotal, $fulfillment);
        $discount = 0.0;
        $error = null;

        if ($voucher) {
            $error = $this->voucherError($voucher, $subtotal, $fulfillment, $customer);

            if ($error === null) {
                $discount = $this->discountFor($voucher, $subtotal, $shipping);
            } else {
                $voucher = null;
            }
        }

        return new Quote(
            subtotal: $subtotal,
            discount: $discount,
            shippingFee: $shipping,
            total: round(max(0, $subtotal + $shipping - $discount), 2),
            voucher: $voucher,
            voucherError: $error,
        );
    }

    public function findVoucher(?string $code): ?Voucher
    {
        if (blank($code)) {
            return null;
        }

        return Voucher::where('code', strtoupper(trim($code)))->first();
    }

    /**
     * Why a voucher cannot be used right now, or null when it can.
     */
    public function voucherError(Voucher $voucher, float $subtotal, FulfillmentMethod $fulfillment, ?User $customer = null): ?string
    {
        $now = now();

        return match (true) {
            ! $voucher->is_active => 'This voucher is no longer active.',
            $voucher->starts_at && $voucher->starts_at->isAfter($now) => 'This voucher is not valid yet.',
            $voucher->expires_at && $voucher->expires_at->isBefore($now) => 'This voucher has expired.',
            $voucher->usage_limit !== null && $voucher->times_used >= $voucher->usage_limit => 'This voucher has been fully redeemed.',
            $subtotal < (float) $voucher->min_spend => 'Spend at least ₱'.number_format((float) $voucher->min_spend, 2).' to use this voucher.',
            $voucher->type === VoucherType::FreeShipping && $fulfillment === FulfillmentMethod::Pickup => 'Free-shipping vouchers apply to home delivery only.',
            $customer !== null && $this->alreadyUsedBy($voucher, $customer) => 'You have already used this voucher.',
            default => null,
        };
    }

    private function alreadyUsedBy(Voucher $voucher, User $customer): bool
    {
        return $voucher->orders()
            ->where('user_id', $customer->id)
            ->where('status', '!=', OrderStatus::Cancelled)
            ->exists();
    }

    private function discountFor(Voucher $voucher, float $subtotal, float $shipping): float
    {
        $discount = match ($voucher->type) {
            VoucherType::Percentage => $subtotal * ((float) $voucher->value / 100),
            VoucherType::Fixed => (float) $voucher->value,
            VoucherType::FreeShipping => $shipping,
        };

        if ($voucher->max_discount !== null) {
            $discount = min($discount, (float) $voucher->max_discount);
        }

        return round(min($discount, $subtotal + $shipping), 2);
    }
}
