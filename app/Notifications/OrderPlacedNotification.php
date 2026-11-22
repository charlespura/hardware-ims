<?php

namespace App\Notifications;

use App\Models\Order;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class OrderPlacedNotification extends Notification
{
    use Queueable;

    public function __construct(public Order $order) {}

    /** @return array<int, string> */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(User $notifiable): MailMessage
    {
        $order = $this->order->loadMissing('items');
        $peso = fn ($v) => '₱'.number_format((float) $v, 2);

        $mail = (new MailMessage)
            ->subject("Order {$order->number} received")
            ->greeting("Thanks for your order, {$notifiable->name}!")
            ->line("We've received order **{$order->number}** and will confirm it shortly.");

        foreach ($order->items as $item) {
            $mail->line("• {$item->quantity} × {$item->product_name} — {$peso($item->line_total)}");
        }

        $mail->line("**Total: {$peso($order->total)}** ({$order->payment_method->label()})");

        if ($order->payment_method->requiresProof() && ! $order->payment_proof_path) {
            $mail->line('Please upload your proof of payment so we can verify it.');
        }

        return $mail->action('View your order', route('orders.show', $order));
    }
}
