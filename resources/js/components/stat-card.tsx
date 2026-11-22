import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function StatCard({
    label,
    value,
    hint,
    icon: Icon,
    highlight = false,
}: {
    label: string;
    value: ReactNode;
    hint?: ReactNode;
    icon: LucideIcon;
    highlight?: boolean;
}) {
    return (
        <Card className="gap-0 py-5">
            <CardContent className="flex items-start justify-between gap-4 px-5">
                <div className="min-w-0 space-y-1">
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <p className="truncate text-2xl font-semibold tracking-tight tabular-nums">
                        {value}
                    </p>
                    {hint && (
                        <div className="text-xs text-muted-foreground">
                            {hint}
                        </div>
                    )}
                </div>
                <div
                    className={cn(
                        'flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground',
                        highlight && 'bg-primary/10 text-primary',
                    )}
                >
                    <Icon className="size-5" />
                </div>
            </CardContent>
        </Card>
    );
}
