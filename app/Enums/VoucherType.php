<?php

namespace App\Enums;

enum VoucherType: string
{
    case Percentage = 'percentage';
    case Fixed = 'fixed';
    case FreeShipping = 'free_shipping';

    public function label(): string
    {
        return match ($this) {
            self::Percentage => 'Percent off',
            self::Fixed => 'Fixed amount off',
            self::FreeShipping => 'Free shipping',
        };
    }
}
