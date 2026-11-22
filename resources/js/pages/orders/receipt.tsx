import { Head } from '@inertiajs/react';
import { Printer } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useEffect } from 'react';
import AppLogoIcon from '@/components/app-logo-icon';
import { Button } from '@/components/ui/button';
import { formatDateTime, formatMoney } from '@/lib/format';
import {
    channelLabel,
    fulfillmentLabel,
    paymentMethodLabel,
    paymentStatus,
} from '@/lib/labels';
import type { Order, StoreInfo } from '@/types';

export default function Receipt({
    order,
    store,
}: {
    order: Order;
    store: StoreInfo;
}) {
    useEffect(() => {
        document.documentElement.classList.remove('dark');
    }, []);

    // Online orders link back to the order page; walk-in receipts encode a summary.
    const qr =
        order.channel === 'online'
            ? `${window.location.origin}/orders/${order.number}`
            : `${store.name} | ${order.number} | ${formatMoney(order.total)} | ${order.placed_at}`;

    return (
        <div className="min-h-svh bg-neutral-100 py-8 print:bg-white print:py-0">
            <Head title={`Receipt ${order.number}`} />
            <div className="no-print mx-auto mb-4 flex max-w-md justify-end">
                <Button onClick={() => window.print()}>
                    <Printer /> Print receipt
                </Button>
            </div>

            <article className="mx-auto max-w-md bg-white p-8 font-mono text-[13px] text-neutral-900 shadow-sm print:max-w-none print:shadow-none">
                <header className="space-y-1 border-b border-dashed border-neutral-300 pb-4 text-center">
                    <div className="mx-auto mb-2 flex size-10 items-center justify-center rounded-md bg-neutral-900 text-white">
                        <AppLogoIcon className="size-6" />
                    </div>
                    <h1 className="font-sans text-lg font-semibold">
                        {store.name}
                    </h1>
                    <p>{store.address}</p>
                    <p>
                        {store.phone} · {store.email}
                    </p>
                </header>

                <section className="space-y-0.5 border-b border-dashed border-neutral-300 py-4">
                    <Row label="Receipt no." value={order.number} />
                    <Row label="Date" value={formatDateTime(order.placed_at)} />
                    <Row label="Channel" value={channelLabel[order.channel]} />
                    <Row label="Customer" value={order.customer_name} />
                    {order.channel === 'online' && (
                        <Row
                            label="Fulfillment"
                            value={fulfillmentLabel[order.fulfillment]}
                        />
                    )}
                    {order.processor && (
                        <Row label="Cashier" value={order.processor.name} />
                    )}
                </section>

                <table className="w-full border-b border-dashed border-neutral-300">
                    <thead>
                        <tr className="text-left">
                            <th className="py-2 font-semibold">Item</th>
                            <th className="py-2 text-right font-semibold">
                                Qty
                            </th>
                            <th className="py-2 text-right font-semibold">
                                Amount
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {order.items?.map((item) => (
                            <tr key={item.id} className="align-top">
                                <td className="py-1 pr-2">
                                    {item.product_name}
                                    <div className="text-[11px] text-neutral-500">
                                        @ {formatMoney(item.unit_price)}
                                    </div>
                                </td>
                                <td className="py-1 text-right">
                                    {item.quantity}
                                </td>
                                <td className="py-1 text-right">
                                    {formatMoney(item.line_total)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <section className="space-y-0.5 border-b border-dashed border-neutral-300 py-4">
                    <Row label="Subtotal" value={formatMoney(order.subtotal)} />
                    {Number(order.shipping_fee) > 0 && (
                        <Row
                            label="Delivery"
                            value={formatMoney(order.shipping_fee)}
                        />
                    )}
                    {Number(order.discount) > 0 && (
                        <Row
                            label={`Discount ${order.voucher_code ?? ''}`}
                            value={`-${formatMoney(order.discount)}`}
                        />
                    )}
                    <Row label="TOTAL" value={formatMoney(order.total)} bold />
                    <Row
                        label="Payment"
                        value={`${paymentMethodLabel[order.payment_method]} (${paymentStatus[order.payment_status].label})`}
                    />
                    {order.amount_tendered && (
                        <Row
                            label="Cash received"
                            value={formatMoney(order.amount_tendered)}
                        />
                    )}
                    {order.change_due !== null &&
                        order.change_due !== undefined &&
                        order.channel === 'pos' && (
                            <Row
                                label="Change"
                                value={formatMoney(order.change_due)}
                            />
                        )}
                    {order.payment_reference && (
                        <Row
                            label="Reference"
                            value={order.payment_reference}
                        />
                    )}
                </section>

                <footer className="space-y-3 pt-4 text-center">
                    <QRCodeSVG value={qr} size={96} className="mx-auto" />
                    <p className="text-[11px] text-neutral-500">
                        {order.channel === 'online'
                            ? 'Scan to view this order online.'
                            : 'Scan to verify this receipt.'}
                    </p>
                    <p className="font-sans font-medium">
                        Thank you for shopping with us!
                    </p>
                    <p className="text-[11px] text-neutral-500">
                        This is not an official BIR receipt.
                    </p>
                </footer>
            </article>
        </div>
    );
}

function Row({
    label,
    value,
    bold = false,
}: {
    label: string;
    value: string;
    bold?: boolean;
}) {
    return (
        <div
            className={`flex justify-between gap-4 ${bold ? 'pt-1 text-base font-bold' : ''}`}
        >
            <span>{label}</span>
            <span className="text-right">{value}</span>
        </div>
    );
}
