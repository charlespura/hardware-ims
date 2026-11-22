import { Head, Link } from '@inertiajs/react';
import { ClipboardList } from 'lucide-react';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { Pagination } from '@/components/pagination';
import { SearchInput } from '@/components/search-input';
import {
    OrderStatusBadge,
    PaymentStatusBadge,
} from '@/components/status-badge';
import { Card } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useFilters } from '@/hooks/use-filters';
import { formatDateTime, formatMoney } from '@/lib/format';
import {
    channelLabel,
    fulfillmentLabel,
    paymentMethodLabel,
} from '@/lib/labels';
import { cn } from '@/lib/utils';
import { index, show } from '@/routes/admin/orders';
import type { Order, Paginated } from '@/types';

type Props = {
    orders: Paginated<Order>;
    counts: Record<string, number>;
    filters: { status: string; channel: string; search: string };
};

const tabs = [
    { value: 'all', label: 'All' },
    { value: 'to_verify', label: 'Verify payment' },
    { value: 'pending', label: 'Pending' },
    { value: 'processing', label: 'Processing' },
    { value: 'out_for_delivery', label: 'Out for delivery' },
    { value: 'ready_for_pickup', label: 'Ready for pickup' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
];

export default function AdminOrders({ orders, counts, filters }: Props) {
    const apply = useFilters(index.url(), filters);

    return (
        <>
            <Head title="Orders" />
            <div className="space-y-5 p-4 md:p-6">
                <PageHeader
                    title="Orders"
                    description="Confirm, prepare and complete online orders. Walk-in sales appear here too."
                />

                <nav
                    className="-mx-1 flex gap-1 overflow-x-auto pb-1"
                    aria-label="Order status"
                >
                    {tabs.map((t) => (
                        <button
                            key={t.value}
                            type="button"
                            onClick={() =>
                                apply({
                                    status: t.value === 'all' ? '' : t.value,
                                })
                            }
                            className={cn(
                                'inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
                                filters.status === t.value
                                    ? 'border-primary bg-primary text-primary-foreground'
                                    : 'bg-background hover:bg-accent',
                            )}
                        >
                            {t.label}
                            <span
                                className={cn(
                                    'rounded-full px-1.5 text-xs tabular-nums',
                                    filters.status === t.value
                                        ? 'bg-primary-foreground/20'
                                        : 'bg-muted text-muted-foreground',
                                    t.value === 'to_verify' &&
                                        counts.to_verify > 0 &&
                                        filters.status !== t.value &&
                                        'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300',
                                )}
                            >
                                {counts[t.value] ?? 0}
                            </span>
                        </button>
                    ))}
                </nav>

                <div className="flex flex-col gap-3 sm:flex-row">
                    <SearchInput
                        value={filters.search}
                        onSearch={(search) => apply({ search })}
                        placeholder="Search order #, customer, e-mail or phone"
                        className="flex-1"
                    />
                    <Select
                        value={filters.channel || 'all'}
                        onValueChange={(v) =>
                            apply({ channel: v === 'all' ? '' : v })
                        }
                    >
                        <SelectTrigger className="sm:w-44" aria-label="Channel">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All channels</SelectItem>
                            <SelectItem value="online">Online</SelectItem>
                            <SelectItem value="pos">Walk-in (POS)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <Card className="py-0">
                    {orders.data.length === 0 ? (
                        <EmptyState
                            icon={ClipboardList}
                            title="No orders match"
                            description="Try another status tab or search term."
                            className="m-4 border-0"
                        />
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="pl-4">
                                        Order
                                    </TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Fulfillment</TableHead>
                                    <TableHead>Payment</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="pr-4 text-right">
                                        Total
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {orders.data.map((o) => (
                                    <TableRow
                                        key={o.id}
                                        className="cursor-pointer"
                                    >
                                        <TableCell className="pl-4">
                                            <Link
                                                href={show(o)}
                                                className="font-mono font-medium hover:text-primary"
                                            >
                                                {o.number}
                                            </Link>
                                            <div className="text-xs text-muted-foreground">
                                                {formatDateTime(o.placed_at)}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium">
                                                {o.customer_name}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {channelLabel[o.channel]} ·{' '}
                                                {o.items_count} item(s)
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {o.channel === 'pos'
                                                ? 'Counter'
                                                : fulfillmentLabel[
                                                      o.fulfillment
                                                  ]}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col items-start gap-1">
                                                <PaymentStatusBadge
                                                    status={o.payment_status}
                                                />
                                                <span className="text-xs text-muted-foreground">
                                                    {
                                                        paymentMethodLabel[
                                                            o.payment_method
                                                        ]
                                                    }
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <OrderStatusBadge
                                                status={o.status}
                                            />
                                        </TableCell>
                                        <TableCell className="pr-4 text-right font-medium tabular-nums">
                                            {formatMoney(o.total)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </Card>
                <Pagination meta={orders} />
            </div>
        </>
    );
}

AdminOrders.layout = { breadcrumbs: [{ title: 'Orders', href: index() }] };
