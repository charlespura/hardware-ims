import { Head, router } from '@inertiajs/react';
import {
    Download,
    Package,
    Percent,
    ReceiptText,
    TrendingUp,
    Wallet,
} from 'lucide-react';
import { useState } from 'react';
import { BarList } from '@/components/charts/bar-list';
import { PageHeader } from '@/components/page-header';
import { StatCard } from '@/components/stat-card';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { formatMoney, formatNumber } from '@/lib/format';
import { channelLabel, paymentMethodLabel } from '@/lib/labels';
import { index, inventory, sales } from '@/routes/admin/reports';
import type { Channel, PaymentMethod } from '@/types';

type Props = {
    range: { from: string; to: string };
    summary: {
        orders: number;
        units: number;
        gross_sales: number;
        discounts: number;
        shipping: number;
        net_sales: number;
        cogs: number;
        gross_profit: number;
        average_order: number;
        cancelled: number;
    };
    byChannel: { name: Channel; orders: number; revenue: string }[];
    byPayment: { name: PaymentMethod; orders: number; revenue: string }[];
    products: {
        product_id: number;
        name: string;
        sku: string;
        units: string;
        revenue: string;
        profit: string;
    }[];
};

const iso = (d: Date) => d.toISOString().slice(0, 10);

export default function Reports({
    range,
    summary,
    byChannel,
    byPayment,
    products,
}: Props) {
    const [from, setFrom] = useState(range.from);
    const [to, setTo] = useState(range.to);
    const margin =
        summary.net_sales > 0
            ? Math.round((summary.gross_profit / summary.net_sales) * 1000) / 10
            : 0;

    const go = (f: string, t: string) =>
        router.get(
            index.url(),
            { from: f, to: t },
            { preserveState: true, preserveScroll: true },
        );

    const presets = (() => {
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastMonthStart = new Date(
            today.getFullYear(),
            today.getMonth() - 1,
            1,
        );
        const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - 6);

        return [
            { label: 'Last 7 days', from: iso(weekAgo), to: iso(today) },
            { label: 'This month', from: iso(startOfMonth), to: iso(today) },
            {
                label: 'Last month',
                from: iso(lastMonthStart),
                to: iso(lastMonthEnd),
            },
        ];
    })();

    return (
        <>
            <Head title="Reports" />
            <div className="space-y-6 p-4 md:p-6">
                <PageHeader
                    title="Sales report"
                    description="Revenue, profit and best sellers for a date range. Cancelled orders are excluded."
                    actions={
                        <>
                            <Button variant="outline" asChild>
                                <a href={inventory.url()}>
                                    <Download /> Inventory CSV
                                </a>
                            </Button>
                            <Button asChild>
                                <a
                                    href={sales.url({
                                        query: {
                                            from: range.from,
                                            to: range.to,
                                        },
                                    })}
                                >
                                    <Download /> Sales CSV
                                </a>
                            </Button>
                        </>
                    }
                />

                <div className="flex flex-wrap items-end gap-3">
                    <div className="flex items-center gap-2">
                        <Input
                            type="date"
                            value={from}
                            max={to}
                            onChange={(e) => setFrom(e.target.value)}
                            aria-label="From"
                            className="w-40"
                        />
                        <span className="text-muted-foreground">to</span>
                        <Input
                            type="date"
                            value={to}
                            min={from}
                            onChange={(e) => setTo(e.target.value)}
                            aria-label="To"
                            className="w-40"
                        />
                        <Button
                            variant="secondary"
                            onClick={() => go(from, to)}
                        >
                            Apply
                        </Button>
                    </div>
                    <div className="flex gap-1">
                        {presets.map((p) => (
                            <Button
                                key={p.label}
                                size="sm"
                                variant={
                                    p.from === range.from && p.to === range.to
                                        ? 'default'
                                        : 'ghost'
                                }
                                onClick={() => {
                                    setFrom(p.from);
                                    setTo(p.to);
                                    go(p.from, p.to);
                                }}
                            >
                                {p.label}
                            </Button>
                        ))}
                    </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                        label="Net sales"
                        value={formatMoney(summary.net_sales)}
                        hint={`${formatMoney(summary.discounts)} in vouchers`}
                        icon={Wallet}
                        highlight
                    />
                    <StatCard
                        label="Gross profit"
                        value={formatMoney(summary.gross_profit)}
                        hint={`${margin}% margin · COGS ${formatMoney(summary.cogs)}`}
                        icon={TrendingUp}
                    />
                    <StatCard
                        label="Orders"
                        value={formatNumber(summary.orders)}
                        hint={`${summary.cancelled} cancelled · avg ${formatMoney(summary.average_order)}`}
                        icon={ReceiptText}
                    />
                    <StatCard
                        label="Units sold"
                        value={formatNumber(summary.units)}
                        hint={`${formatMoney(summary.shipping)} delivery fees collected`}
                        icon={Package}
                    />
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    <BreakdownCard
                        title="By sales channel"
                        rows={byChannel.map((r) => ({
                            name: channelLabel[r.name],
                            orders: r.orders,
                            revenue: Number(r.revenue),
                        }))}
                    />
                    <BreakdownCard
                        title="By payment method"
                        rows={byPayment.map((r) => ({
                            name: paymentMethodLabel[r.name],
                            orders: r.orders,
                            revenue: Number(r.revenue),
                        }))}
                    />
                </div>

                <Card className="pb-0">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Percent className="size-4" /> Product performance
                        </CardTitle>
                        <CardDescription>
                            Top 15 products by revenue in this period.
                        </CardDescription>
                    </CardHeader>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="pl-6">Product</TableHead>
                                <TableHead className="text-right">
                                    Units
                                </TableHead>
                                <TableHead className="text-right">
                                    Revenue
                                </TableHead>
                                <TableHead className="text-right">
                                    Profit
                                </TableHead>
                                <TableHead className="pr-6 text-right">
                                    Margin
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {products.length === 0 && (
                                <TableRow>
                                    <TableCell
                                        colSpan={5}
                                        className="py-8 text-center text-muted-foreground"
                                    >
                                        No sales in this period.
                                    </TableCell>
                                </TableRow>
                            )}
                            {products.map((p) => (
                                <TableRow key={`${p.product_id}-${p.sku}`}>
                                    <TableCell className="pl-6">
                                        <div className="font-medium">
                                            {p.name}
                                        </div>
                                        <div className="font-mono text-xs text-muted-foreground">
                                            {p.sku}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right tabular-nums">
                                        {formatNumber(p.units)}
                                    </TableCell>
                                    <TableCell className="text-right tabular-nums">
                                        {formatMoney(p.revenue)}
                                    </TableCell>
                                    <TableCell className="text-right tabular-nums">
                                        {formatMoney(p.profit)}
                                    </TableCell>
                                    <TableCell className="pr-6 text-right text-muted-foreground tabular-nums">
                                        {Number(p.revenue) > 0
                                            ? `${Math.round((Number(p.profit) / Number(p.revenue)) * 1000) / 10}%`
                                            : '—'}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Card>
            </div>
        </>
    );
}

function BreakdownCard({
    title,
    rows,
}: {
    title: string;
    rows: { name: string; orders: number; revenue: number }[];
}) {
    const sorted = [...rows].sort((a, b) => b.revenue - a.revenue);

    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>Revenue incl. delivery fees</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {sorted.length ? (
                    <>
                        <BarList
                            data={sorted.map((r) => ({
                                name: r.name,
                                value: r.revenue,
                            }))}
                        />
                        <p className="text-xs text-muted-foreground">
                            {sorted
                                .map((r) => `${r.name}: ${r.orders} orders`)
                                .join(' · ')}
                        </p>
                    </>
                ) : (
                    <p className="text-sm text-muted-foreground">
                        No sales in this period.
                    </p>
                )}
            </CardContent>
        </Card>
    );
}

Reports.layout = { breadcrumbs: [{ title: 'Reports', href: index() }] };
