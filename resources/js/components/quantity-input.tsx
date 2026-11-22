import { Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function QuantityInput({
    value,
    onChange,
    min = 1,
    max = 999,
    disabled = false,
    size = 'default',
    className,
}: {
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    disabled?: boolean;
    size?: 'sm' | 'default';
    className?: string;
}) {
    const clamp = (n: number) =>
        Math.max(min, Math.min(max, Number.isNaN(n) ? min : n));
    const box = size === 'sm' ? 'h-8' : 'h-10';

    return (
        <div
            className={cn(
                'inline-flex items-center rounded-md border bg-background',
                box,
                className,
            )}
        >
            <Button
                type="button"
                variant="ghost"
                size="icon"
                className={cn('rounded-r-none', box)}
                onClick={() => onChange(clamp(value - 1))}
                disabled={disabled || value <= min}
                aria-label="Decrease quantity"
            >
                <Minus />
            </Button>
            <input
                type="number"
                inputMode="numeric"
                className="h-full w-12 [appearance:textfield] border-x bg-transparent text-center text-sm tabular-nums outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                value={value}
                min={min}
                max={max}
                disabled={disabled}
                aria-label="Quantity"
                onChange={(e) => onChange(clamp(parseInt(e.target.value, 10)))}
            />
            <Button
                type="button"
                variant="ghost"
                size="icon"
                className={cn('rounded-l-none', box)}
                onClick={() => onChange(clamp(value + 1))}
                disabled={disabled || value >= max}
                aria-label="Increase quantity"
            >
                <Plus />
            </Button>
        </div>
    );
}
