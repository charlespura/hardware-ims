import { Head, Link } from '@inertiajs/react';
import { Plus, Truck } from 'lucide-react';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { Pagination } from '@/components/pagination';
import { PurchaseOrderStatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
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
import { formatDate, formatMoney } from '@/lib/format';
import { create, index, show } from '@/routes/admin/purchase-orders';
import type { Paginated, PurchaseOrder, Supplier } from '@/types';

type Props = {
    purchaseOrders: Paginated<PurchaseOrder>;
    suppliers: Pick<Supplier, 'id' | 'name'>[];
    filters: { status: string; supplier: string };
};

export default function PurchaseOrders({
    purchaseOrders,
    suppliers,
    filters,
}: Props) {
    const apply = useFilters(index.url(), filters);

    return (
        <>
            <Head title="Purchase orders" />
            <div className="space-y-5 p-4 md:p-6">
                <PageHeader
                    title="Purchase orders"
                    description="Restock from suppliers. Receiving a PO adds the items to stock and updates their cost."
                    actions={
                        <Button asChild>
                            <Link href={create()}>
                                <Plus /> New purchase order
                            </Link>
                        </Button>
                    }
                />
                <div className="flex flex-col gap-3 sm:flex-row">
                    <Select
                        value={filters.status || 'all'}
                        onValueChange={(v) =>
                            apply({ status: v === 'all' ? '' : v })
                        }
                    >
                        <SelectTrigger className="sm:w-52" aria-label="Status">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All statuses</SelectItem>
                            <SelectItem value="ordered">
                                Awaiting delivery
                            </SelectItem>
                            <SelectItem value="received">Received</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select
                        value={filters.supplier || 'all'}
                        onValueChange={(v) =>
                            apply({ supplier: v === 'all' ? '' : v })
                        }
                    >
                        <SelectTrigger
                            className="sm:w-64"
                            aria-label="Supplier"
                        >
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All suppliers</SelectItem>
                            {suppliers.map((s) => (
                                <SelectItem key={s.id} value={String(s.id)}>
                                    {s.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <Card className="py-0">
                    {purchaseOrders.data.length === 0 ? (
                        <EmptyState
                            icon={Truck}
                            title="No purchase orders"
                            description="Create one to restock low items."
                            className="m-4 border-0"
                        />
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="pl-4">
                                        PO number
                                    </TableHead>
                                    <TableHead>Supplier</TableHead>
                                    <TableHead className="text-right">
                                        Items
                                    </TableHead>
                                    <TableHead>Expected</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="pr-4 text-right">
                                        Total
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {purchaseOrders.data.map((po) => (
                                    <TableRow key={po.id}>
                                        <TableCell className="pl-4">
                                            <Link
                                                href={show(po)}
                                                className="font-mono font-medium hover:text-primary"
                                            >
                                                {po.number}
                                            </Link>
                                            <div className="text-xs text-muted-foreground">
                                                Created{' '}
                                                {formatDate(po.created_at)}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {po.supplier?.name}
                                        </TableCell>
                                        <TableCell className="text-right tabular-nums">
                                            {po.items_count}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {po.status === 'received'
                                                ? `Received ${formatDate(po.received_at)}`
                                                : formatDate(po.expected_at)}
                                        </TableCell>
                                        <TableCell>
                                            <PurchaseOrderStatusBadge
                                                status={po.status}
                                            />
                                        </TableCell>
                                        <TableCell className="pr-4 text-right font-medium tabular-nums">
                                            {formatMoney(po.total)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </Card>
                <Pagination meta={purchaseOrders} />
            </div>
        </>
    );
}

PurchaseOrders.layout = {
    breadcrumbs: [{ title: 'Purchase orders', href: index() }],
};
