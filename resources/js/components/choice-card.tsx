import type { ReactNode } from 'react';
import { RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';

/** A large, clickable radio option used on checkout and POS screens. */
export function ChoiceCard({
    value,
    id,
    checked,
    title,
    description,
    aside,
    icon,
    disabled,
}: {
    value: string;
    id: string;
    checked: boolean;
    title: ReactNode;
    description?: ReactNode;
    aside?: ReactNode;
    icon?: ReactNode;
    disabled?: boolean;
}) {
    return (
        <label
            htmlFor={id}
            className={cn(
                'flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors hover:bg-accent/50',
                checked && 'border-primary bg-primary/5 ring-1 ring-primary',
                disabled && 'cursor-not-allowed opacity-50',
            )}
        >
            <RadioGroupItem
                value={value}
                id={id}
                className="mt-0.5"
                disabled={disabled}
            />
            {icon && <span className="text-muted-foreground">{icon}</span>}
            <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">{title}</span>
                {description && (
                    <span className="mt-0.5 block text-sm text-muted-foreground">
                        {description}
                    </span>
                )}
            </span>
            {aside && (
                <span className="text-sm font-medium tabular-nums">
                    {aside}
                </span>
            )}
        </label>
    );
}
