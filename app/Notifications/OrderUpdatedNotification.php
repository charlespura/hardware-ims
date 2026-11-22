<?php

namespace App\Notifications;

use App\Models\Order;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class OrderUpdatedNotification extends Notification
{
    use Queueable;

    public function __construct(
        public Order $order,
        public string $headline,
        public string $message,
        public ?string $note = null,
    ) {}

    /** @return array<int, string> */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(User $notifiable): MailMessage
    {
        $mail = (new MailMessage)
            ->subject("{$this->headline} — order {$this->order->number}")
            ->greeting("Hi {$notifiable->name},")
            ->line($this->message);

        if ($this->note) {
            $mail->line("Note from the store: _{$this->note}_");
        }

        return $mail->action('View your order', route('orders.show', $this->order));
    }
}
