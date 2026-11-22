import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Fulfillment, OrderStatus } from '@/types';

/**
 * Horizontal stepper: Placed → Confirmed → Out for delivery / Ready → Completed.
 */
export function OrderProgress({
    status,
    fulfillment,
}: {
    status: OrderStatus;
    fulfillment: Fulfillment;
}) {
    if (status === 'cancelled') {
        return (
            <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
                <X className="size-5 shrink-0" />
                This order was cancelled and the reserved items were returned to
                stock.
            </div>
        );
    }

    const steps: { key: OrderStatus; label: string }[] = [
        { key: 'pending', label: 'Placed' },
        { key: 'processing', label: 'Confirmed' },
        fulfillment === 'pickup'
            ? { key: 'ready_for_pickup', label: 'Ready for pickup' }
            : { key: 'out_for_delivery', label: 'Out for delivery' },
        {
            key: 'completed',
            label: fulfillment === 'pickup' ? 'Picked up' : 'Delivered',
        },
    ];

    const current = steps.findIndex((s) => s.key === status);

    return (
        <ol className="grid grid-cols-4 gap-2" aria-label="Order progress">
            {steps.map((step, i) => {
                const done = i < current || status === 'completed';
                const active = i === current && status !== 'completed';

                return (
                    <li
                        key={step.key}
                        className="flex flex-col items-center gap-2 text-center"
                    >
                        <div className="flex w-full items-center">
                            <div
                                className={cn(
                                    'h-0.5 flex-1',
                                    i === 0
                                        ? 'bg-transparent'
                                        : i <= current
                                          ? 'bg-primary'
                                          : 'bg-border',
                                )}
                            />
                            <span
                                className={cn(
                                    'flex size-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold',
                                    done &&
                                        'border-primary bg-primary text-primary-foreground',
                                    active &&
                                        'border-primary bg-background text-primary ring-4 ring-primary/15',
                                    !done &&
                                        !active &&
                                        'border-border bg-background text-muted-foreground',
                                )}
                                aria-current={active ? 'step' : undefined}
                            >
                                {done ? <Check className="size-4" /> : i + 1}
                            </span>
                            <div
                                className={cn(
                                    'h-0.5 flex-1',
                                    i === steps.length - 1
                                        ? 'bg-transparent'
                                        : i < current
                                          ? 'bg-primary'
                                          : 'bg-border',
                                )}
                            />
                        </div>
                        <span
                            className={cn(
                                'text-xs font-medium',
                                !done && !active && 'text-muted-foreground',
                            )}
                        >
                            {step.label}
                        </span>
                    </li>
                );
            })}
        </ol>
    );
}
