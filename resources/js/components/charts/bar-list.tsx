import { useState } from 'react';
import { formatMoney } from '@/lib/format';

/**
 * Horizontal single-series bars, sorted by value, value printed at the tip.
 * Used for "revenue by category" — one hue, no legend (the card title names it).
 */
export function BarList({
    data,
    format = formatMoney,
}: {
    data: { name: string; value: number }[];
    format?: (value: number) => string;
}) {
    const [hover, setHover] = useState<string | null>(null);
    const max = Math.max(...data.map((d) => d.value), 1);
    const total = data.reduce((sum, d) => sum + d.value, 0);

    return (
        <ul className="space-y-3" role="list">
            {data.map((d) => (
                <li
                    key={d.name}
                    className="relative grid grid-cols-[minmax(0,9rem)_1fr] items-center gap-3 text-sm"
                    onMouseEnter={() => setHover(d.name)}
                    onMouseLeave={() => setHover(null)}
                    tabIndex={0}
                    onFocus={() => setHover(d.name)}
                    onBlur={() => setHover(null)}
                    aria-label={`${d.name}: ${format(d.value)} (${Math.round((d.value / total) * 100)}%)`}
                >
                    <span className="truncate text-muted-foreground">
                        {d.name}
                    </span>
                    <div className="flex items-center gap-2">
                        <div className="h-4 min-w-0 flex-1">
                            <div
                                className="h-full rounded-r-[4px] bg-viz-1 transition-opacity"
                                style={{
                                    width: `${Math.max(2, (d.value / max) * 100)}%`,
                                    opacity:
                                        hover && hover !== d.name ? 0.45 : 1,
                                }}
                            />
                        </div>
                        <span className="w-24 shrink-0 text-right font-medium tabular-nums">
                            {format(d.value)}
                        </span>
                    </div>
                    {hover === d.name && (
                        <span className="pointer-events-none absolute -top-8 left-36 z-10 rounded-md border bg-popover px-2 py-1 text-xs whitespace-nowrap shadow-md">
                            {d.name} · {format(d.value)} ·{' '}
                            {Math.round((d.value / total) * 100)}% of sales
                        </span>
                    )}
                </li>
            ))}
        </ul>
    );
}
