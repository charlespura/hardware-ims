<?php

namespace App\Enums;

enum PurchaseOrderStatus: string
{
    case Ordered = 'ordered';
    case Received = 'received';
    case Cancelled = 'cancelled';

    public function label(): string
    {
        return match ($this) {
            self::Ordered => 'Awaiting delivery',
            self::Received => 'Received',
            self::Cancelled => 'Cancelled',
        };
    }
}
