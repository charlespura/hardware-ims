<?php

namespace App\Enums;

enum PaymentStatus: string
{
    case Unpaid = 'unpaid';
    case ForVerification = 'for_verification';
    case Paid = 'paid';
    case Rejected = 'rejected';
    case Refunded = 'refunded';

    public function label(): string
    {
        return match ($this) {
            self::Unpaid => 'Unpaid',
            self::ForVerification => 'For verification',
            self::Paid => 'Paid',
            self::Rejected => 'Proof rejected',
            self::Refunded => 'Refunded',
        };
    }
}
