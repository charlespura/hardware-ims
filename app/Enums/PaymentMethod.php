<?php

namespace App\Enums;

enum PaymentMethod: string
{
    case Cod = 'cod';
    case Gcash = 'gcash';
    case BankTransfer = 'bank_transfer';
    case Cash = 'cash';

    public function label(): string
    {
        return match ($this) {
            self::Cod => 'Cash on delivery / pickup',
            self::Gcash => 'GCash',
            self::BankTransfer => 'Bank transfer',
            self::Cash => 'Cash',
        };
    }

    /**
     * Methods that need a reference number + screenshot verified by staff.
     */
    public function requiresProof(): bool
    {
        return in_array($this, [self::Gcash, self::BankTransfer], true);
    }

    /**
     * Methods a customer can choose at online checkout.
     *
     * @return list<self>
     */
    public static function online(): array
    {
        return [self::Cod, self::Gcash, self::BankTransfer];
    }
}
