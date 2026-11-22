<?php

namespace App\Enums;

enum StockMovementType: string
{
    case Initial = 'initial';
    case Purchase = 'purchase';
    case Sale = 'sale';
    case Cancellation = 'cancellation';
    case Adjustment = 'adjustment';

    public function label(): string
    {
        return match ($this) {
            self::Initial => 'Opening stock',
            self::Purchase => 'Purchase order received',
            self::Sale => 'Sale',
            self::Cancellation => 'Order cancelled (restocked)',
            self::Adjustment => 'Manual adjustment',
        };
    }
}
