import { Head, Link } from '@inertiajs/react';
import { ChevronRight, Package } from 'lucide-react';
import { EmptyState } from '@/components/empty-state';
import { Pagination } from '@/components/pagination';
import { ProductImage } from '@/components/product-image';
import {
    OrderStatusBadge,
    PaymentStatusBadge,
} from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { ShopContainer } from '@/layouts/shop-layout';
import { formatDate, formatMoney } from '@/lib/format';
import { fulfillmentLabel } from '@/lib/labels';
import { cn } from '@/lib/utils';
import { index, show } from '@/routes/orders';
import { index as shop } from '@/routes/shop';
import type { Order, Paginated } from '@/types';

const tabs = [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'In progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
];

export default function Orders({
    orders,
    tab,
}: {
    orders: Paginated<Order>;
    tab: string;
}) {
    return (
        <ShopContainer className="max-w-4xl">
            <Head title="My orders" />
            <h1 className="text-2xl font-semibold tracking-tight">My orders</h1>

            <nav
                className="mt-6 flex gap-1 overflow-x-auto border-b"
                aria-label="Filter orders"
            >
                {tabs.map((t) => (
                    <Link
                        key={t.value}
                        href={index.url({
                            query: t.value === 'all' ? {} : { tab: t.value },
                        })}
                        preserveScroll
                        className={cn(
                            '-mb-px border-b-2 px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors',
                            tab === t.value
                                ? 'border-primary text-foreground'
                                : 'border-transparent text-muted-foreground hover:text-foreground',
                        )}
                    >
                        {t.label}
                    </Link>
                ))}
            </nav>

            <div className="mt-6 space-y-4">
                {orders.data.length === 0 && (
                    <EmptyState
                        icon={Package}
                        title="No orders here yet"
                        description="When you place an order it will show up here so you can track it."
                        action={
                            <Button asChild>
                                <Link href={shop()}>Browse products</Link>
                            </Button>
                        }
                    />
                )}

                {orders.data.map((order) => (
                    <Link
                        key={order.id}
                        href={show(order)}
                        className="group block rounded-xl border bg-card p-4 transition-colors hover:border-primary/40 sm:p-5"
                    >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <p className="font-mono text-sm font-medium">
                                    {order.number}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Placed {formatDate(order.placed_at)} ·{' '}
                                    {fulfillmentLabel[order.fulfillment]}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <PaymentStatusBadge
                                    status={order.payment_status}
                                />
                                <OrderStatusBadge status={order.status} />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center justify-between gap-4">
                            <div className="flex -space-x-2">
                                {order.items?.slice(0, 4).map((item) => (
                                    <ProductImage
                                        key={item.id}
                                        src={item.product?.image_url}
                                        alt={item.product_name}
                                        className="size-11 rounded-lg border-2 border-background"
                                        iconClassName="size-5"
                                    />
                                ))}
                                {(order.items?.length ?? 0) > 4 && (
                                    <span className="flex size-11 items-center justify-center rounded-lg border-2 border-background bg-muted text-xs font-medium">
                                        +{(order.items?.length ?? 0) - 4}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2 text-right">
                                <div>
                                    <p className="text-xs text-muted-foreground">
                                        {order.items?.length} item(s)
                                    </p>
                                    <p className="font-semibold tabular-nums">
                                        {formatMoney(order.total)}
                                    </p>
                                </div>
                                <ChevronRight className="size-5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                            </div>
                        </div>
                    </Link>
                ))}

                <Pagination meta={orders} />
            </div>
        </ShopContainer>
    );
}
