<?php

namespace App\Models;

use App\Enums\FulfillmentMethod;
use App\Enums\OrderChannel;
use App\Enums\OrderStatus;
use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;

/**
 * @property int $id
 * @property string $number
 * @property int|null $user_id
 * @property int|null $processed_by
 * @property OrderChannel $channel
 * @property OrderStatus $status
 * @property FulfillmentMethod $fulfillment
 * @property string $customer_name
 * @property string|null $customer_phone
 * @property string|null $customer_email
 * @property string|null $shipping_address
 * @property CarbonImmutable|null $preferred_date
 * @property string|null $notes
 * @property PaymentMethod $payment_method
 * @property PaymentStatus $payment_status
 * @property string|null $payment_reference
 * @property string|null $payment_proof_path
 * @property string|null $payment_rejection_reason
 * @property CarbonImmutable|null $paid_at
 * @property int|null $voucher_id
 * @property string|null $voucher_code
 * @property string $subtotal
 * @property string $discount
 * @property string $shipping_fee
 * @property string $total
 * @property string|null $amount_tendered
 * @property string|null $change_due
 * @property CarbonImmutable $placed_at
 * @property CarbonImmutable|null $completed_at
 * @property CarbonImmutable|null $cancelled_at
 * @property string|null $cancellation_reason
 */
class Order extends Model
{
    protected $guarded = ['id'];

    protected $appends = ['payment_proof_url'];

    protected function casts(): array
    {
        return [
            'channel' => OrderChannel::class,
            'status' => OrderStatus::class,
            'fulfillment' => FulfillmentMethod::class,
            'payment_method' => PaymentMethod::class,
            'payment_status' => PaymentStatus::class,
            'preferred_date' => 'date',
            'paid_at' => 'datetime',
            'placed_at' => 'datetime',
            'completed_at' => 'datetime',
            'cancelled_at' => 'datetime',
            'subtotal' => 'decimal:2',
            'discount' => 'decimal:2',
            'shipping_fee' => 'decimal:2',
            'total' => 'decimal:2',
            'amount_tendered' => 'decimal:2',
            'change_due' => 'decimal:2',
        ];
    }

    public function getRouteKeyName(): string
    {
        return 'number';
    }

    /** @return BelongsTo<User, $this> */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /** @return BelongsTo<User, $this> */
    public function processor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'processed_by');
    }

    /** @return BelongsTo<Voucher, $this> */
    public function voucher(): BelongsTo
    {
        return $this->belongsTo(Voucher::class);
    }

    /** @return HasMany<OrderItem, $this> */
    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    /** @return HasMany<OrderActivity, $this> */
    public function activities(): HasMany
    {
        return $this->hasMany(OrderActivity::class)->latest('id');
    }

    /**
     * Orders that count as revenue (anything not cancelled).
     *
     * @param  Builder<Order>  $query
     */
    #[Scope]
    protected function revenue(Builder $query): void
    {
        $query->where('status', '!=', OrderStatus::Cancelled);
    }

    /** @return Attribute<string|null, never> */
    protected function paymentProofUrl(): Attribute
    {
        return Attribute::get(fn () => $this->payment_proof_path
            ? Storage::disk('public')->url($this->payment_proof_path)
            : null);
    }

    public function canUploadPaymentProof(): bool
    {
        return $this->payment_method->requiresProof()
            && $this->status->isOpen()
            && in_array($this->payment_status, [PaymentStatus::Unpaid, PaymentStatus::Rejected, PaymentStatus::ForVerification], true);
    }

    public function canBeCancelledByCustomer(): bool
    {
        return $this->status === OrderStatus::Pending
            && $this->payment_status !== PaymentStatus::Paid;
    }
}
