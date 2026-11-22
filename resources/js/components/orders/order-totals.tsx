import { formatMoney } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { Money } from '@/types';

export function OrderTotals({
    subtotal,
    discount,
    shippingFee,
    total,
    voucherCode,
    showShipping = true,
    className,
}: {
    subtotal: Money;
    discount: Money;
    shippingFee: Money;
    total: Money;
    voucherCode?: string | null;
    showShipping?: boolean;
    className?: string;
}) {
    return (
        <dl className={cn('space-y-2 text-sm', className)}>
            <Row label="Subtotal" value={formatMoney(subtotal)} />
            {showShipping && (
                <Row
                    label="Delivery"
                    value={
                        Number(shippingFee) > 0
                            ? formatMoney(shippingFee)
                            : 'Free'
                    }
                />
            )}
            {Number(discount) > 0 && (
                <Row
                    label={
                        voucherCode ? `Voucher (${voucherCode})` : 'Discount'
                    }
                    value={`− ${formatMoney(discount)}`}
                    className="text-emerald-600 dark:text-emerald-400"
                />
            )}
            <div className="flex items-center justify-between border-t pt-3 text-base font-semibold">
                <dt>Total</dt>
                <dd className="tabular-nums">{formatMoney(total)}</dd>
            </div>
        </dl>
    );
}

function Row({
    label,
    value,
    className,
}: {
    label: string;
    value: string;
    className?: string;
}) {
    return (
        <div className={cn('flex items-center justify-between', className)}>
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="tabular-nums">{value}</dd>
        </div>
    );
}
