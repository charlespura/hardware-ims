import type { ReactNode } from 'react';
import {
    orderStatus,
    paymentStatus,
    purchaseOrderStatus,
    stockStatus,
} from '@/lib/labels';
import type { Tone } from '@/lib/labels';
import { cn } from '@/lib/utils';
import type {
    OrderStatus,
    PaymentStatus,
    PurchaseOrderStatus,
    StockStatus,
} from '@/types';

const tones: Record<Tone, string> = {
    neutral: 'bg-muted text-muted-foreground',
    info: 'bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300',
    warning:
        'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
    success:
        'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300',
    danger: 'bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300',
    brand: 'bg-orange-100 text-orange-800 dark:bg-orange-500/15 dark:text-orange-300',
};

const dots: Record<Tone, string> = {
    neutral: 'bg-muted-foreground/60',
    info: 'bg-sky-500',
    warning: 'bg-amber-500',
    success: 'bg-emerald-500',
    danger: 'bg-red-500',
    brand: 'bg-orange-500',
};

export function StatusBadge({
    tone = 'neutral',
    children,
    className,
}: {
    tone?: Tone;
    children: ReactNode;
    className?: string;
}) {
    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap',
                tones[tone],
                className,
            )}
        >
            <span className={cn('size-1.5 rounded-full', dots[tone])} />
            {children}
        </span>
    );
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
    const meta = orderStatus[status];

    return <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>;
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
    const meta = paymentStatus[status];

    return <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>;
}

export function PurchaseOrderStatusBadge({
    status,
}: {
    status: PurchaseOrderStatus;
}) {
    const meta = purchaseOrderStatus[status];

    return <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>;
}

export function StockBadge({
    status,
    stock,
    unit,
    customer = false,
}: {
    status: StockStatus;
    stock: number;
    unit?: string;
    customer?: boolean;
}) {
    const meta = stockStatus[status];

    if (customer && status === 'low_stock') {
        return <StatusBadge tone="warning">Only {stock} left</StatusBadge>;
    }

    if (customer) {
        return <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>;
    }

    return (
        <StatusBadge tone={meta.tone}>
            {stock} {unit}
        </StatusBadge>
    );
}
