import { useState } from 'react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Rectangle,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import type { BarShapeProps } from 'recharts';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { formatMoney, formatMoneyCompact } from '@/lib/format';

export type SalesPoint = { date: string; online: number; pos: number };

const SERIES = [
    { key: 'online', label: 'Online', color: 'var(--viz-1)' },
    { key: 'pos', label: 'Walk-in (POS)', color: 'var(--viz-2)' },
] as const;

const shortDate = (iso: string) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString('en-PH', {
        month: 'short',
        day: 'numeric',
    });

/**
 * Daily revenue as stacked columns (online + walk-in). Rounded data-end on
 * whichever segment is on top that day; 2px surface gap between segments.
 */
export function SalesChart({ data }: { data: SalesPoint[] }) {
    const [asTable, setAsTable] = useState(false);
    const totals = {
        online: data.reduce((sum, d) => sum + d.online, 0),
        pos: data.reduce((sum, d) => sum + d.pos, 0),
    };

    const segment = (key: 'online' | 'pos') =>
        function Segment(props: BarShapeProps) {
            const row = props.payload as SalesPoint;
            const isTop = key === 'online' ? true : row.online === 0;

            return (
                <Rectangle
                    {...props}
                    radius={isTop ? [4, 4, 0, 0] : 0}
                    stroke="var(--card)"
                    strokeWidth={2}
                />
            );
        };

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <ul
                    className="flex flex-wrap gap-x-5 gap-y-1 text-sm"
                    aria-label="Legend"
                >
                    {SERIES.map((s) => (
                        <li key={s.key} className="flex items-center gap-2">
                            <span
                                className="size-2.5 rounded-sm"
                                style={{ background: s.color }}
                            />
                            <span className="text-muted-foreground">
                                {s.label}
                            </span>
                            <span className="font-medium">
                                {formatMoney(totals[s.key])}
                            </span>
                        </li>
                    ))}
                </ul>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setAsTable((v) => !v)}
                >
                    {asTable ? 'Show chart' : 'View as table'}
                </Button>
            </div>

            {asTable ? (
                <div className="max-h-72 overflow-y-auto rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">
                                    Online
                                </TableHead>
                                <TableHead className="text-right">
                                    Walk-in
                                </TableHead>
                                <TableHead className="text-right">
                                    Total
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {[...data].reverse().map((d) => (
                                <TableRow key={d.date}>
                                    <TableCell>{shortDate(d.date)}</TableCell>
                                    <TableCell className="text-right tabular-nums">
                                        {formatMoney(d.online)}
                                    </TableCell>
                                    <TableCell className="text-right tabular-nums">
                                        {formatMoney(d.pos)}
                                    </TableCell>
                                    <TableCell className="text-right font-medium tabular-nums">
                                        {formatMoney(d.online + d.pos)}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            ) : (
                <div
                    className="h-72"
                    role="img"
                    aria-label="Daily revenue for the last 30 days, online and walk-in"
                >
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={data}
                            margin={{ top: 8, right: 4, left: 0, bottom: 0 }}
                            barCategoryGap="20%"
                        >
                            <CartesianGrid
                                vertical={false}
                                stroke="var(--border)"
                            />
                            <XAxis
                                dataKey="date"
                                tickFormatter={shortDate}
                                tickLine={false}
                                axisLine={false}
                                minTickGap={24}
                                tick={{
                                    fill: 'var(--muted-foreground)',
                                    fontSize: 12,
                                }}
                            />
                            <YAxis
                                tickFormatter={(v: number) =>
                                    formatMoneyCompact(v)
                                }
                                tickLine={false}
                                axisLine={false}
                                width={56}
                                tick={{
                                    fill: 'var(--muted-foreground)',
                                    fontSize: 12,
                                }}
                            />
                            <Tooltip
                                cursor={{ fill: 'var(--muted)', opacity: 0.6 }}
                                content={<SalesTooltip />}
                            />
                            <Bar
                                dataKey="pos"
                                stackId="sales"
                                fill="var(--viz-2)"
                                maxBarSize={24}
                                shape={segment('pos')}
                            />
                            <Bar
                                dataKey="online"
                                stackId="sales"
                                fill="var(--viz-1)"
                                maxBarSize={24}
                                shape={segment('online')}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
}

function SalesTooltip({
    active,
    payload,
}: {
    active?: boolean;
    payload?: { payload: SalesPoint }[];
}) {
    if (!active || !payload?.length) {
        return null;
    }

    const row = payload[0].payload;

    return (
        <div className="min-w-44 rounded-lg border bg-popover px-3 py-2 text-sm text-popover-foreground shadow-md">
            <p className="mb-1.5 font-medium">{shortDate(row.date)}</p>
            {SERIES.map((s) => (
                <div
                    key={s.key}
                    className="flex items-center justify-between gap-4"
                >
                    <span className="flex items-center gap-2 text-muted-foreground">
                        <span
                            className="size-2 rounded-sm"
                            style={{ background: s.color }}
                        />
                        {s.label}
                    </span>
                    <span className="tabular-nums">
                        {formatMoney(row[s.key])}
                    </span>
                </div>
            ))}
            <div className="mt-1.5 flex justify-between border-t pt-1.5 font-medium">
                <span>Total</span>
                <span className="tabular-nums">
                    {formatMoney(row.online + row.pos)}
                </span>
            </div>
        </div>
    );
}
