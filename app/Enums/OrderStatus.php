<?php

namespace App\Enums;

enum OrderStatus: string
{
    case Pending = 'pending';
    case Processing = 'processing';
    case OutForDelivery = 'out_for_delivery';
    case ReadyForPickup = 'ready_for_pickup';
    case Completed = 'completed';
    case Cancelled = 'cancelled';

    public function label(): string
    {
        return match ($this) {
            self::Pending => 'Pending',
            self::Processing => 'Processing',
            self::OutForDelivery => 'Out for delivery',
            self::ReadyForPickup => 'Ready for pickup',
            self::Completed => 'Completed',
            self::Cancelled => 'Cancelled',
        };
    }

    /**
     * The statuses an order may move to next, given how it is fulfilled.
     *
     * @return list<self>
     */
    public function nextStatuses(FulfillmentMethod $fulfillment): array
    {
        return match ($this) {
            self::Pending => [self::Processing, self::Cancelled],
            self::Processing => [
                $fulfillment === FulfillmentMethod::Pickup ? self::ReadyForPickup : self::OutForDelivery,
                self::Cancelled,
            ],
            self::OutForDelivery, self::ReadyForPickup => [self::Completed],
            self::Completed, self::Cancelled => [],
        };
    }

    public function canTransitionTo(self $next, FulfillmentMethod $fulfillment): bool
    {
        return in_array($next, $this->nextStatuses($fulfillment), true);
    }

    public function isOpen(): bool
    {
        return ! in_array($this, [self::Completed, self::Cancelled], true);
    }
}
