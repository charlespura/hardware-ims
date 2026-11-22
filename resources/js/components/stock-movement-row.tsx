import { Link } from '@inertiajs/react';
import { TableCell, TableRow } from '@/components/ui/table';
import { formatDateTime } from '@/lib/format';
import { movementLabel } from '@/lib/labels';
import { cn } from '@/lib/utils';
import { show as order } from '@/routes/admin/orders';
import { show as purchaseOrder } from '@/routes/admin/purchase-orders';
import type { StockMovement } from '@/types';

export function MovementReference({ movement }: { movement: StockMovement }) {
    const ref = movement.reference;

    if (!ref?.number) {
        return (
            <span className="text-muted-foreground">
                {movement.note ?? '—'}
            </span>
        );
    }

    const href =
        ref.type === 'PurchaseOrder'
            ? purchaseOrder(ref.number)
            : order(ref.number);

    return (
        <Link
            href={href}
            className="font-mono text-xs font-medium hover:text-primary"
        >
            {ref.number}
        </Link>
    );
}

export function QuantityDelta({ quantity }: { quantity: number }) {
    return (
        <span
            className={cn(
                'font-medium tabular-nums',
                quantity > 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-red-600 dark:text-red-400',
            )}
        >
            {quantity > 0 ? '+' : ''}
            {quantity}
        </span>
    );
}

export function StockMovementRow({
    movement,
    showProduct = false,
}: {
    movement: StockMovement;
    showProduct?: boolean;
}) {
    return (
        <TableRow>
            <TableCell className="pl-4 text-muted-foreground">
                {formatDateTime(movement.created_at)}
            </TableCell>
            {showProduct && (
                <TableCell>
                    <div className="font-medium">{movement.product?.name}</div>
                    <div className="font-mono text-xs text-muted-foreground">
                        {movement.product?.sku}
                    </div>
                </TableCell>
            )}
            <TableCell>{movementLabel[movement.type]}</TableCell>
            <TableCell>
                <MovementReference movement={movement} />
            </TableCell>
            <TableCell className="text-right">
                <QuantityDelta quantity={movement.quantity} />
            </TableCell>
            <TableCell className="text-right tabular-nums">
                {movement.balance_after}
            </TableCell>
            <TableCell className="pr-4 text-muted-foreground">
                {movement.user?.name ?? 'System'}
            </TableCell>
        </TableRow>
    );
}
