import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    ArrowRight,
    BadgeCheck,
    ExternalLink,
    Mail,
    Phone,
    Printer,
    User,
    XCircle,
} from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import { OrderProgress } from '@/components/orders/order-progress';
import { OrderTimeline } from '@/components/orders/order-timeline';
import { OrderTotals } from '@/components/orders/order-totals';
import { PageHeader } from '@/components/page-header';
import { ProductImage } from '@/components/product-image';
import {
    OrderStatusBadge,
    PaymentStatusBadge,
} from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { formatDate, formatDateTime, formatMoney } from '@/lib/format';
import {
    channelLabel,
    fulfillmentLabel,
    paymentMethodLabel,
} from '@/lib/labels';
import { index, show, status as updateStatus } from '@/routes/admin/orders';
import { reject, verify } from '@/routes/admin/orders/payment';
import { show as productPage } from '@/routes/admin/products';
import { receipt } from '@/routes/orders';
import type { Order, OrderStatus } from '@/types';

type Props = {
    order: Order;
    nextStatuses: { value: OrderStatus; label: string }[];
    customerStats: { orders: number; spent: number } | null;
};

export default function AdminOrderShow({
    order,
    nextStatuses,
    customerStats,
}: Props) {
    const forward = nextStatuses.filter((s) => s.value !== 'cancelled');
    const canCancel = nextStatuses.some((s) => s.value === 'cancelled');
    const needsVerification =
        order.payment_status === 'for_verification' &&
        order.status !== 'cancelled';
    const blockedByPayment =
        order.status === 'pending' &&
        ['gcash', 'bank_transfer'].includes(order.payment_method) &&
        order.payment_status !== 'paid';

    return (
        <>
            <Head title={`Order ${order.number}`} />
            <div className="space-y-6 p-4 md:p-6">
                <PageHeader
                    title={<span className="font-mono">{order.number}</span>}
                    description={`${channelLabel[order.channel]} order · placed ${formatDateTime(order.placed_at)}`}
                    actions={
                        <Button variant="outline" asChild>
                            <a
                                href={receipt.url(order)}
                                target="_blank"
                                rel="noreferrer"
                            >
                                <Printer /> Print receipt
                            </a>
                        </Button>
                    }
                />

                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
                    <div className="space-y-6">
                        <Card>
                            <CardContent className="space-y-5">
                                <div className="flex flex-wrap items-center gap-2">
                                    <OrderStatusBadge status={order.status} />
                                    <PaymentStatusBadge
                                        status={order.payment_status}
                                    />
                                    <span className="text-sm text-muted-foreground">
                                        · {fulfillmentLabel[order.fulfillment]}
                                    </span>
                                </div>
                                {order.channel === 'online' && (
                                    <OrderProgress
                                        status={order.status}
                                        fulfillment={order.fulfillment}
                                    />
                                )}

                                {(forward.length > 0 || canCancel) && (
                                    <div className="flex flex-wrap items-center gap-2 border-t pt-4">
                                        {forward.map((s) => (
                                            <StatusAction
                                                key={s.value}
                                                order={order}
                                                next={s}
                                                disabled={
                                                    blockedByPayment &&
                                                    s.value === 'processing'
                                                }
                                            />
                                        ))}
                                        {canCancel && (
                                            <CancelAction order={order} />
                                        )}
                                        {blockedByPayment && (
                                            <p className="w-full text-sm text-amber-700 dark:text-amber-400">
                                                Verify the{' '}
                                                {
                                                    paymentMethodLabel[
                                                        order.payment_method
                                                    ]
                                                }{' '}
                                                payment before confirming this
                                                order.
                                            </p>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {order.payment_proof_url && (
                            <Card
                                className={
                                    needsVerification
                                        ? 'border-amber-300 dark:border-amber-500/40'
                                        : undefined
                                }
                            >
                                <CardHeader>
                                    <CardTitle>Payment proof</CardTitle>
                                </CardHeader>
                                <CardContent className="grid gap-5 sm:grid-cols-[180px_minmax(0,1fr)]">
                                    <a
                                        href={order.payment_proof_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="group relative block overflow-hidden rounded-lg border"
                                    >
                                        <img
                                            src={order.payment_proof_url}
                                            alt="Payment proof uploaded by the customer"
                                            className="aspect-[3/4] w-full object-cover"
                                        />
                                        <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-black/60 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                                            <ExternalLink className="size-3" />{' '}
                                            Open full size
                                        </span>
                                    </a>
                                    <div className="space-y-3 text-sm">
                                        <Field
                                            label="Method"
                                            value={
                                                paymentMethodLabel[
                                                    order.payment_method
                                                ]
                                            }
                                        />
                                        <Field
                                            label="Reference no."
                                            value={
                                                <span className="font-mono">
                                                    {order.payment_reference}
                                                </span>
                                            }
                                        />
                                        <Field
                                            label="Amount due"
                                            value={formatMoney(order.total)}
                                        />
                                        {order.paid_at && (
                                            <Field
                                                label="Verified"
                                                value={formatDateTime(
                                                    order.paid_at,
                                                )}
                                            />
                                        )}
                                        {order.payment_rejection_reason && (
                                            <Field
                                                label="Last rejection"
                                                value={
                                                    order.payment_rejection_reason
                                                }
                                            />
                                        )}
                                        {needsVerification && (
                                            <div className="flex flex-wrap gap-2 pt-2">
                                                <Button
                                                    onClick={() =>
                                                        router.post(
                                                            verify.url(order),
                                                            {},
                                                            {
                                                                preserveScroll: true,
                                                            },
                                                        )
                                                    }
                                                >
                                                    <BadgeCheck /> Mark as paid
                                                </Button>
                                                <RejectPaymentAction
                                                    order={order}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        <Card>
                            <CardHeader>
                                <CardTitle>
                                    Items ({order.items?.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-5">
                                <div className="divide-y">
                                    {order.items?.map((item) => (
                                        <div
                                            key={item.id}
                                            className="flex items-center gap-4 py-3 first:pt-0"
                                        >
                                            <ProductImage
                                                src={item.product?.image_url}
                                                alt={item.product_name}
                                                className="size-12 shrink-0"
                                                iconClassName="size-5"
                                            />
                                            <div className="min-w-0 flex-1">
                                                {item.product_id ? (
                                                    <Link
                                                        href={productPage(
                                                            item.product_id,
                                                        )}
                                                        className="font-medium hover:text-primary"
                                                    >
                                                        {item.product_name}
                                                    </Link>
                                                ) : (
                                                    <span className="font-medium">
                                                        {item.product_name}
                                                    </span>
                                                )}
                                                <p className="text-xs text-muted-foreground">
                                                    {item.sku} · {item.quantity}{' '}
                                                    ×{' '}
                                                    {formatMoney(
                                                        item.unit_price,
                                                    )}
                                                    {item.product && (
                                                        <>
                                                            {' '}
                                                            ·{' '}
                                                            {
                                                                item.product
                                                                    .stock
                                                            }{' '}
                                                            left in stock
                                                        </>
                                                    )}
                                                </p>
                                            </div>
                                            <span className="font-medium tabular-nums">
                                                {formatMoney(item.line_total)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                <OrderTotals
                                    className="ml-auto max-w-xs border-t pt-4"
                                    subtotal={order.subtotal}
                                    discount={order.discount}
                                    shippingFee={order.shipping_fee}
                                    total={order.total}
                                    voucherCode={order.voucher_code}
                                    showShipping={
                                        order.channel === 'online' &&
                                        order.fulfillment === 'delivery'
                                    }
                                />
                                {order.channel === 'pos' &&
                                    order.amount_tendered && (
                                        <p className="text-right text-sm text-muted-foreground">
                                            Cash received{' '}
                                            {formatMoney(order.amount_tendered)}{' '}
                                            · change{' '}
                                            {formatMoney(order.change_due)}
                                        </p>
                                    )}
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Customer</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                <p className="flex items-center gap-2 font-medium">
                                    <User className="size-4 text-muted-foreground" />
                                    {order.customer_name}
                                </p>
                                {order.customer_phone && (
                                    <p className="flex items-center gap-2">
                                        <Phone className="size-4 text-muted-foreground" />
                                        <a
                                            href={`tel:${order.customer_phone}`}
                                            className="hover:underline"
                                        >
                                            {order.customer_phone}
                                        </a>
                                    </p>
                                )}
                                {order.customer_email && (
                                    <p className="flex items-center gap-2">
                                        <Mail className="size-4 text-muted-foreground" />
                                        <a
                                            href={`mailto:${order.customer_email}`}
                                            className="truncate hover:underline"
                                        >
                                            {order.customer_email}
                                        </a>
                                    </p>
                                )}
                                {customerStats && (
                                    <p className="rounded-md bg-muted/50 px-3 py-2 text-muted-foreground">
                                        {customerStats.orders} order(s) ·{' '}
                                        {formatMoney(customerStats.spent)}{' '}
                                        lifetime
                                    </p>
                                )}
                            </CardContent>
                        </Card>

                        {order.channel === 'online' && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>
                                        {order.fulfillment === 'delivery'
                                            ? 'Delivery'
                                            : 'Pickup'}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3 text-sm">
                                    {order.shipping_address && (
                                        <Field
                                            label="Address"
                                            value={order.shipping_address}
                                        />
                                    )}
                                    <Field
                                        label="Preferred date"
                                        value={formatDate(order.preferred_date)}
                                    />
                                    {order.notes && (
                                        <Field
                                            label="Customer notes"
                                            value={order.notes}
                                        />
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        <Card>
                            <CardHeader>
                                <CardTitle>Activity</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <OrderTimeline
                                    activities={order.activities ?? []}
                                    showActor
                                />
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div>
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {label}
            </p>
            <p className="mt-0.5">{value}</p>
        </div>
    );
}

function StatusAction({
    order,
    next,
    disabled,
}: {
    order: Order;
    next: { value: OrderStatus; label: string };
    disabled: boolean;
}) {
    const [open, setOpen] = useState(false);
    const form = useForm({ status: next.value, note: '' });

    const labels: Partial<Record<OrderStatus, string>> = {
        processing: 'Confirm order',
        out_for_delivery: 'Send out for delivery',
        ready_for_pickup: 'Mark ready for pickup',
        completed:
            order.fulfillment === 'pickup'
                ? 'Mark as picked up'
                : 'Mark as delivered',
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button disabled={disabled}>
                    {labels[next.value] ?? next.label} <ArrowRight />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <form
                    className="space-y-4"
                    onSubmit={(e) => {
                        e.preventDefault();
                        form.post(updateStatus.url(order), {
                            preserveScroll: true,
                            onSuccess: () => setOpen(false),
                        });
                    }}
                >
                    <DialogHeader>
                        <DialogTitle>
                            {labels[next.value] ?? next.label}?
                        </DialogTitle>
                        <DialogDescription>
                            The customer will be e-mailed about this update.
                            {next.value === 'completed' &&
                                order.payment_status !== 'paid' &&
                                ' The cash payment will be recorded as received.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-1.5">
                        <Label htmlFor="note">
                            Note to customer (optional)
                        </Label>
                        <Textarea
                            id="note"
                            value={form.data.note}
                            onChange={(e) =>
                                form.setData('note', e.target.value)
                            }
                            placeholder="e.g. Rider: Mark, ETA 2–4 PM"
                        />
                        <InputError message={form.errors.note} />
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                        >
                            Back
                        </Button>
                        <Button type="submit" disabled={form.processing}>
                            Confirm
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function CancelAction({ order }: { order: Order }) {
    const [open, setOpen] = useState(false);
    const form = useForm({ status: 'cancelled' as OrderStatus, note: '' });

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="text-destructive">
                    <XCircle /> Cancel order
                </Button>
            </DialogTrigger>
            <DialogContent>
                <form
                    className="space-y-4"
                    onSubmit={(e) => {
                        e.preventDefault();
                        form.post(updateStatus.url(order), {
                            preserveScroll: true,
                            onSuccess: () => setOpen(false),
                        });
                    }}
                >
                    <DialogHeader>
                        <DialogTitle>Cancel {order.number}?</DialogTitle>
                        <DialogDescription>
                            All items go back into stock and any voucher is
                            released.
                            {order.payment_status === 'paid' &&
                                ' The payment will be flagged as a refund due.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-1.5">
                        <Label htmlFor="reason">
                            Reason (shown to the customer)
                        </Label>
                        <Textarea
                            id="reason"
                            required
                            value={form.data.note}
                            onChange={(e) =>
                                form.setData('note', e.target.value)
                            }
                            placeholder="e.g. Customer requested cancellation by phone"
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                        >
                            Keep order
                        </Button>
                        <Button
                            type="submit"
                            variant="destructive"
                            disabled={form.processing}
                        >
                            Cancel order
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function RejectPaymentAction({ order }: { order: Order }) {
    const [open, setOpen] = useState(false);
    const form = useForm({ reason: '' });

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">Reject proof</Button>
            </DialogTrigger>
            <DialogContent>
                <form
                    className="space-y-4"
                    onSubmit={(e) => {
                        e.preventDefault();
                        form.post(reject.url(order), {
                            preserveScroll: true,
                            onSuccess: () => setOpen(false),
                        });
                    }}
                >
                    <DialogHeader>
                        <DialogTitle>Reject this payment proof?</DialogTitle>
                        <DialogDescription>
                            The customer will be asked to upload a new one.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-1.5">
                        <Label htmlFor="reject-reason">Reason</Label>
                        <Textarea
                            id="reject-reason"
                            value={form.data.reason}
                            onChange={(e) =>
                                form.setData('reason', e.target.value)
                            }
                            placeholder="e.g. Amount doesn’t match, reference not found"
                        />
                        <InputError message={form.errors.reason} />
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                        >
                            Back
                        </Button>
                        <Button
                            type="submit"
                            variant="destructive"
                            disabled={form.processing}
                        >
                            Reject
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

AdminOrderShow.layout = (props: Props) => ({
    breadcrumbs: [
        { title: 'Orders', href: index() },
        { title: props.order.number, href: show(props.order) },
    ],
});
