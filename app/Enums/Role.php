<?php

namespace App\Enums;

enum Role: string
{
    case Admin = 'admin';
    case Staff = 'staff';
    case Customer = 'customer';

    public function label(): string
    {
        return match ($this) {
            self::Admin => 'Administrator',
            self::Staff => 'Staff',
            self::Customer => 'Customer',
        };
    }

    public function isBackOffice(): bool
    {
        return $this !== self::Customer;
    }
}
