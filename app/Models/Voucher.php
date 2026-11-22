<?php

namespace App\Models;

use App\Enums\VoucherType;
use Carbon\CarbonImmutable;
use Database\Factories\VoucherFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property string $code
 * @property string|null $description
 * @property VoucherType $type
 * @property string $value
 * @property string $min_spend
 * @property string|null $max_discount
 * @property int|null $usage_limit
 * @property int $times_used
 * @property CarbonImmutable|null $starts_at
 * @property CarbonImmutable|null $expires_at
 * @property bool $is_active
 */
#[Fillable(['code', 'description', 'type', 'value', 'min_spend', 'max_discount', 'usage_limit', 'starts_at', 'expires_at', 'is_active'])]
class Voucher extends Model
{
    /** @use HasFactory<VoucherFactory> */
    use HasFactory;

    protected static function booted(): void
    {
        static::saving(function (Voucher $voucher) {
            $voucher->code = strtoupper(trim($voucher->code));
        });
    }

    protected function casts(): array
    {
        return [
            'type' => VoucherType::class,
            'value' => 'decimal:2',
            'min_spend' => 'decimal:2',
            'max_discount' => 'decimal:2',
            'usage_limit' => 'integer',
            'times_used' => 'integer',
            'starts_at' => 'datetime',
            'expires_at' => 'datetime',
            'is_active' => 'boolean',
        ];
    }

    /** @return HasMany<Order, $this> */
    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    /**
     * A short human summary, e.g. "10% off (max ₱500) · min. spend ₱1,000".
     */
    public function summary(): string
    {
        $peso = fn ($v) => '₱'.number_format((float) $v, 2);

        $main = match ($this->type) {
            VoucherType::Percentage => rtrim(rtrim(number_format((float) $this->value, 2), '0'), '.').'% off'
                .($this->max_discount ? ' (max '.$peso($this->max_discount).')' : ''),
            VoucherType::Fixed => $peso($this->value).' off',
            VoucherType::FreeShipping => 'Free shipping',
        };

        return (float) $this->min_spend > 0 ? "{$main} · min. spend {$peso($this->min_spend)}" : $main;
    }
}
