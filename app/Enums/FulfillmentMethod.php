<?php

namespace App\Enums;

enum FulfillmentMethod: string
{
    case Delivery = 'delivery';
    case Pickup = 'pickup';

    public function label(): string
    {
        return match ($this) {
            self::Delivery => 'Home delivery',
            self::Pickup => 'Store pickup',
        };
    }
}
