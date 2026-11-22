import { Head, Link, router } from '@inertiajs/react';
import { PackageCheck, XCircle } from 'lucide-react';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { PageHeader } from '@/components/page-header';
import { PurchaseOrderStatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { formatDate, formatDateTime, formatMoney } from '@/lib/format';
import { show as product } from '@/routes/admin/products';
import { cancel, index, receive, show } from '@/routes/admin/purchase-orders';
import type { PurchaseOrder } from '@/types';

export default function PurchaseOrderShow({
    purchaseOrder: po,
}: {
    purchaseOrder: PurchaseOrder;
}) {
    const open = po.status === 'ordered';

    return (
        <>
            <Head title={po.number} />
            <div className="space-y-6 p-4 md:p-6">
                <PageHeader
                    title={<span className="font-mono">{po.number}</span>}
                    description={`${po.supplier?.name} · created ${formatDate(po.created_at)} by ${po.creator?.name ?? 'system'}`}
                    actions={
                        open && (
                            <>
                                <ConfirmDialog
                                    trigger={
                                        <Button
                                            variant="outline"
                                            className="text-destructive"
                                        >
                                            <XCircle /> Cancel PO
                                        </Button>
                                    }
                                    title={`Cancel ${po.number}?`}
                                    description="Nothing is added to stock. You can create a new PO later."
                                    confirmLabel="Cancel PO"
                                    destructive
                                    onConfirm={() =>
                                        router.post(
                                            cancel.url(po),
                                            {},
                                            { preserveScroll: true },
                                        )
                                    }
                                />
                                <ConfirmDialog
                                    trigger={
                                        <Button>
                                            <PackageCheck /> Receive delivery
                                        </Button>
                                    }
                                    title="Receive all items?"
                                    description="Every line is added to stock and each product’s cost price is updated to the PO cost."
                                    confirmLabel="Receive & update stock"
                                    onConfirm={() =>
                                        router.post(
                                            receive.url(po),
                                            {},
                                            { preserveScroll: true },
                                        )
                                    }
                                />
                            </>
                        )
                    }
                />

                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
                    <Card className="pb-0">
                        <CardHeader>
                            <CardTitle>Items</CardTitle>
                        </CardHeader>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="pl-6">
                                        Product
                                    </TableHead>
                                    <TableHead className="text-right">
                                        Qty
                                    </TableHead>
                                    <TableHead className="text-right">
                                        Unit cost
                                    </TableHead>
                                    <TableHead className="text-right">
                                        {open ? 'On hand now' : 'On hand'}
                                    </TableHead>
                                    <TableHead className="pr-6 text-right">
                                        Line total
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {po.items?.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="pl-6">
                                            <Link
                                                href={product(item.product.id)}
                                                className="font-medium hover:text-primary"
                                            >
                                                {item.product.name}
                                            </Link>
                                            <div className="font-mono text-xs text-muted-foreground">
                                                {item.product.sku}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right tabular-nums">
                                            {item.quantity} {item.product.unit}
                                        </TableCell>
                                        <TableCell className="text-right tabular-nums">
                                            {formatMoney(item.unit_cost)}
                                        </TableCell>
                                        <TableCell className="text-right text-muted-foreground tabular-nums">
                                            {item.product.stock}
                                            {open && (
                                                <span className="text-emerald-600 dark:text-emerald-400">
                                                    {' '}
                                                    →{' '}
                                                    {item.product.stock +
                                                        item.quantity}
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell className="pr-6 text-right font-medium tabular-nums">
                                            {formatMoney(item.line_total)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                            <TableFooter>
                                <TableRow>
                                    <TableCell colSpan={4} className="pl-6">
                                        Total
                                    </TableCell>
                                    <TableCell className="pr-6 text-right tabular-nums">
                                        {formatMoney(po.total)}
                                    </TableCell>
                                </TableRow>
                            </TableFooter>
                        </Table>
                    </Card>

                    <Card>
                        <CardContent className="space-y-4 text-sm">
                            <PurchaseOrderStatusBadge status={po.status} />
                            <Info
                                label="Supplier"
                                value={
                                    <>
                                        {po.supplier?.name}
                                        <br />
                                        <span className="text-muted-foreground">
                                            {po.supplier?.contact_person} ·{' '}
                                            {po.supplier?.phone}
                                        </span>
                                    </>
                                }
                            />
                            <Info
                                label="Expected"
                                value={formatDate(po.expected_at)}
                            />
                            {po.received_at && (
                                <Info
                                    label="Received"
                                    value={`${formatDateTime(po.received_at)} by ${po.receiver?.name}`}
                                />
                            )}
                            {po.cancelled_at && (
                                <Info
                                    label="Cancelled"
                                    value={formatDateTime(po.cancelled_at)}
                                />
                            )}
                            {po.notes && (
                                <Info label="Notes" value={po.notes} />
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div>
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {label}
            </p>
            <p className="mt-0.5">{value}</p>
        </div>
    );
}

PurchaseOrderShow.layout = (props: { purchaseOrder: PurchaseOrder }) => ({
    breadcrumbs: [
        { title: 'Purchase orders', href: index() },
        { title: props.purchaseOrder.number, href: show(props.purchaseOrder) },
    ],
});
