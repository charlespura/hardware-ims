import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowLeft,
    CheckCircle2,
    Printer,
    RotateCcw,
    Upload,
} from 'lucide-react';
import { ConfirmDialog } from '@/components/confirm-dialog';
import InputError from '@/components/input-error';
import { OrderProgress } from '@/components/orders/order-progress';
import { OrderTimeline } from '@/components/orders/order-timeline';
import { OrderTotals } from '@/components/orders/order-totals';
import { ProductImage } from '@/components/product-image';
import {
    OrderStatusBadge,
    PaymentStatusBadge,
} from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { ShopContainer } from '@/layouts/shop-layout';
import { formatDate, formatDateTime, formatMoney } from '@/lib/format';
import { fulfillmentLabel, paymentMethodLabel } from '@/lib/labels';
import { cancel, index, paymentProof, receipt, reorder } from '@/routes/orders';
import { show as product } from '@/routes/shop';
import type { Order, PaymentAccount } from '@/types';

type Props = {
    order: Order;
    paymentAccounts: Record<'gcash' | 'bank_transfer', PaymentAccount>;
    justPlaced: boolean;
    can: { cancel: boolean; uploadProof: boolean };
};

export default function OrderShow({
    order,
    paymentAccounts,
    justPlaced,
    can,
}: Props) {
    const proof = useForm<{
        payment_reference: string;
        payment_proof: File | null;
    }>({
        payment_reference: order.payment_reference ?? '',
        payment_proof: null,
    });
    const account =
        order.payment_method === 'gcash' ||
        order.payment_method === 'bank_transfer'
            ? paymentAccounts[order.payment_method]
            : null;

    return (
        <ShopContainer className="max-w-5xl">
            <Head title={`Order ${order.number}`} />

            <Link
                href={index()}
                className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
                <ArrowLeft className="size-4" /> All orders
            </Link>

            {justPlaced && (
                <div className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-500/30 dark:bg-emerald-500/10">
                    <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />
                    <div className="text-sm">
                        <p className="font-medium">
                            Thank you — your order has been placed!
                        </p>
                        <p className="text-muted-foreground">
                            We sent a confirmation to {order.customer_email}.
                            We’ll e-mail you again when it’s confirmed.
                        </p>
                    </div>
                </div>
            )}

            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="font-mono text-2xl font-semibold tracking-tight">
                        {order.number}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Placed {formatDateTime(order.placed_at)}
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" asChild>
                        <a
                            href={receipt.url(order)}
                            target="_blank"
                            rel="noreferrer"
                        >
                            <Printer /> Receipt
                        </a>
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.post(reorder.url(order))}
                    >
                        <RotateCcw /> Buy again
                    </Button>
                    {can.cancel && (
                        <ConfirmDialog
                            trigger={
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-destructive"
                                >
                                    Cancel order
                                </Button>
                            }
                            title="Cancel this order?"
                            description="Your items will be released back to stock. This can’t be undone."
                            confirmLabel="Yes, cancel order"
                            destructive
                            onConfirm={() =>
                                router.post(
                                    cancel.url(order),
                                    {},
                                    { preserveScroll: true },
                                )
                            }
                        />
                    )}
                </div>
            </div>

            <Card className="mt-6">
                <CardContent className="space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                        <OrderStatusBadge status={order.status} />
                        <PaymentStatusBadge status={order.payment_status} />
                    </div>
                    <OrderProgress
                        status={order.status}
                        fulfillment={order.fulfillment}
                    />
                </CardContent>
            </Card>

            <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
                <div className="space-y-6">
                    {can.uploadProof && account && (
                        <Card
                            className={
                                order.payment_status === 'rejected'
                                    ? 'border-red-300 dark:border-red-500/40'
                                    : 'border-amber-300 dark:border-amber-500/40'
                            }
                        >
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <AlertTriangle className="size-5 text-amber-500" />
                                    {order.payment_status === 'for_verification'
                                        ? 'Payment proof received'
                                        : 'Complete your payment'}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-sm">
                                {order.payment_status === 'rejected' &&
                                    order.payment_rejection_reason && (
                                        <p className="rounded-md bg-red-50 p-3 text-red-800 dark:bg-red-500/10 dark:text-red-300">
                                            We couldn’t verify your last upload:{' '}
                                            <strong>
                                                {order.payment_rejection_reason}
                                            </strong>
                                        </p>
                                    )}
                                {order.payment_status === 'for_verification' ? (
                                    <p className="text-muted-foreground">
                                        Our staff are checking reference no.{' '}
                                        <strong className="text-foreground">
                                            {order.payment_reference}
                                        </strong>
                                        . You can replace the screenshot below
                                        if needed.
                                    </p>
                                ) : (
                                    <p className="text-muted-foreground">
                                        Send{' '}
                                        <strong className="text-foreground">
                                            {formatMoney(order.total)}
                                        </strong>{' '}
                                        to {account.label}{' '}
                                        <strong className="text-foreground">
                                            {account.account_number}
                                        </strong>{' '}
                                        ({account.account_name}), then upload
                                        the receipt.
                                    </p>
                                )}
                                <form
                                    className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_1fr_auto] sm:items-end"
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        proof.post(paymentProof.url(order), {
                                            forceFormData: true,
                                            preserveScroll: true,
                                            onSuccess: () =>
                                                proof.setData(
                                                    'payment_proof',
                                                    null,
                                                ),
                                        });
                                    }}
                                >
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="ref">
                                            Reference number
                                        </Label>
                                        <Input
                                            id="ref"
                                            value={proof.data.payment_reference}
                                            onChange={(e) =>
                                                proof.setData(
                                                    'payment_reference',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                        <InputError
                                            message={
                                                proof.errors.payment_reference
                                            }
                                        />
                                    </div>
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="proof">
                                            Screenshot
                                        </Label>
                                        <Input
                                            id="proof"
                                            type="file"
                                            accept="image/png,image/jpeg,image/webp"
                                            onChange={(e) =>
                                                proof.setData(
                                                    'payment_proof',
                                                    e.target.files?.[0] ?? null,
                                                )
                                            }
                                        />
                                        <InputError
                                            message={proof.errors.payment_proof}
                                        />
                                    </div>
                                    <Button
                                        type="submit"
                                        disabled={
                                            proof.processing ||
                                            !proof.data.payment_proof
                                        }
                                    >
                                        {proof.processing ? (
                                            <Spinner />
                                        ) : (
                                            <Upload />
                                        )}{' '}
                                        Submit
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    )}

                    <Card>
                        <CardHeader>
                            <CardTitle>Items</CardTitle>
                        </CardHeader>
                        <CardContent className="divide-y">
                            {order.items?.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex items-center gap-4 py-3 first:pt-0 last:pb-0"
                                >
                                    <ProductImage
                                        src={item.product?.image_url}
                                        alt={item.product_name}
                                        className="size-14 shrink-0"
                                        iconClassName="size-6"
                                    />
                                    <div className="min-w-0 flex-1">
                                        {item.product?.slug ? (
                                            <Link
                                                href={product(
                                                    item.product.slug,
                                                )}
                                                className="line-clamp-1 font-medium hover:text-primary"
                                            >
                                                {item.product_name}
                                            </Link>
                                        ) : (
                                            <p className="line-clamp-1 font-medium">
                                                {item.product_name}
                                            </p>
                                        )}
                                        <p className="text-sm text-muted-foreground">
                                            {item.quantity} ×{' '}
                                            {formatMoney(item.unit_price)}
                                        </p>
                                    </div>
                                    <p className="font-medium tabular-nums">
                                        {formatMoney(item.line_total)}
                                    </p>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Order history</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <OrderTimeline
                                activities={order.activities ?? []}
                            />
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Summary</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <OrderTotals
                                subtotal={order.subtotal}
                                discount={order.discount}
                                shippingFee={order.shipping_fee}
                                total={order.total}
                                voucherCode={order.voucher_code}
                                showShipping={order.fulfillment === 'delivery'}
                            />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="space-y-4 text-sm">
                            <Detail
                                label="Fulfillment"
                                value={fulfillmentLabel[order.fulfillment]}
                            />
                            {order.shipping_address && (
                                <Detail
                                    label="Deliver to"
                                    value={
                                        <>
                                            {order.customer_name} ·{' '}
                                            {order.customer_phone}
                                            <br />
                                            {order.shipping_address}
                                        </>
                                    }
                                />
                            )}
                            {order.preferred_date && (
                                <Detail
                                    label="Preferred date"
                                    value={formatDate(order.preferred_date)}
                                />
                            )}
                            <Detail
                                label="Payment"
                                value={paymentMethodLabel[order.payment_method]}
                            />
                            {order.notes && (
                                <Detail
                                    label="Your notes"
                                    value={order.notes}
                                />
                            )}
                            {order.cancellation_reason && (
                                <Detail
                                    label="Cancellation reason"
                                    value={order.cancellation_reason}
                                />
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </ShopContainer>
    );
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div>
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {label}
            </p>
            <p className="mt-0.5">{value}</p>
        </div>
    );
}
