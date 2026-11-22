import { Head, Link, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowDownRight,
    ArrowRight,
    ArrowUpRight,
    BadgeCheck,
    Boxes,
    ClipboardList,
    PackagePlus,
    ScanBarcode,
    TrendingUp,
    Wallet,
} from 'lucide-react';
import { BarList } from '@/components/charts/bar-list';
import { SalesChart } from '@/components/charts/sales-chart';
import type { SalesPoint } from '@/components/charts/sales-chart';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { ProductImage } from '@/components/product-image';
import { StatCard } from '@/components/stat-card';
import {
    OrderStatusBadge,
    PaymentStatusBadge,
} from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { formatMoney, formatNumber, formatRelative } from '@/lib/format';
import { channelLabel } from '@/lib/labels';
import { dashboard } from '@/routes/admin';
import { index as orders, show as order } from '@/routes/admin/orders';
import { index as pos } from '@/routes/admin/pos';
import {
    create as newProduct,
    index as products,
    show as product,
} from '@/routes/admin/products';
import { create as newPurchaseOrder } from '@/routes/admin/purchase-orders';
import type { Order, Product } from '@/types';

type Props = {
    kpis: {
        today_revenue: number;
        today_orders: number;
        month_revenue: number;
        month_change: number | null;
        pending_orders: number;
        payments_to_verify: number;
        low_stock: number;
        inventory_value: number;
        customers: number;
    };
    salesChart: SalesPoint[];
    topProducts: {
        product_id: number | null;
        name: string;
        units: number;
        revenue: number;
    }[];
    categorySales: { name: string; revenue: number }[];
    recentOrders: Order[];
    lowStock: Product[];
};

export default function AdminDashboard({
    kpis,
    salesChart,
    topProducts,
    categorySales,
    recentOrders,
    lowStock,
}: Props) {
    const { auth } = usePage().props;
    const hour = new Date().getHours();
    const greeting =
        hour < 12
            ? 'Good morning'
            : hour < 18
              ? 'Good afternoon'
              : 'Good evening';
    const change = kpis.month_change;

    return (
        <>
            <Head title="Dashboard" />
            <div className="space-y-6 p-4 md:p-6">
                <PageHeader
                    title={`${greeting}, ${auth.user?.name.split(' ')[0]}`}
                    description="Here’s what’s happening in the store today."
                    actions={
                        <>
                            <Button variant="outline" asChild>
                                <Link href={newProduct()}>
                                    <PackagePlus /> Add product
                                </Link>
                            </Button>
                            <Button asChild>
                                <Link href={pos()}>
                                    <ScanBarcode /> Open POS
                                </Link>
                            </Button>
                        </>
                    }
                />

                {(kpis.pending_orders > 0 ||
                    kpis.payments_to_verify > 0 ||
                    kpis.low_stock > 0) && (
                    <div className="grid gap-3 md:grid-cols-3">
                        <ActionTile
                            show={kpis.pending_orders > 0}
                            icon={ClipboardList}
                            title={`${kpis.pending_orders} order${kpis.pending_orders === 1 ? '' : 's'} to confirm`}
                            href={orders.url({ query: { status: 'pending' } })}
                        />
                        <ActionTile
                            show={kpis.payments_to_verify > 0}
                            icon={BadgeCheck}
                            title={`${kpis.payments_to_verify} payment${kpis.payments_to_verify === 1 ? '' : 's'} to verify`}
                            href={orders.url({
                                query: { status: 'to_verify' },
                            })}
                        />
                        <ActionTile
                            show={kpis.low_stock > 0}
                            icon={AlertTriangle}
                            title={`${kpis.low_stock} product${kpis.low_stock === 1 ? '' : 's'} low on stock`}
                            href={products.url({ query: { stock: 'low' } })}
                        />
                    </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                        label="Revenue today"
                        value={formatMoney(kpis.today_revenue)}
                        hint={`${kpis.today_orders} order${kpis.today_orders === 1 ? '' : 's'}`}
                        icon={Wallet}
                        highlight
                    />
                    <StatCard
                        label="Revenue this month"
                        value={formatMoney(kpis.month_revenue)}
                        hint={
                            change === null ? (
                                'No sales last month to compare'
                            ) : (
                                <span
                                    className={`inline-flex items-center gap-0.5 font-medium ${change >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}
                                >
                                    {change >= 0 ? (
                                        <ArrowUpRight className="size-3.5" />
                                    ) : (
                                        <ArrowDownRight className="size-3.5" />
                                    )}
                                    {change >= 0 ? '+' : ''}
                                    {change}% vs same period last month
                                </span>
                            )
                        }
                        icon={TrendingUp}
                    />
                    <StatCard
                        label="Inventory value (at cost)"
                        value={formatMoney(kpis.inventory_value)}
                        hint={`${kpis.low_stock} items need restocking`}
                        icon={Boxes}
                    />
                    <StatCard
                        label="Registered customers"
                        value={formatNumber(kpis.customers)}
                        hint="Online accounts"
                        icon={BadgeCheck}
                    />
                </div>

                <div className="grid gap-6 xl:grid-cols-3">
                    <Card className="xl:col-span-2">
                        <CardHeader>
                            <CardTitle>Sales, last 30 days</CardTitle>
                            <CardDescription>
                                Daily revenue from online orders and walk-in
                                sales (cancelled orders excluded).
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <SalesChart data={salesChart} />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Sales by category</CardTitle>
                            <CardDescription>Last 30 days</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {categorySales.length ? (
                                <BarList
                                    data={categorySales.map((c) => ({
                                        name: c.name,
                                        value: Number(c.revenue),
                                    }))}
                                />
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    No sales yet.
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-6 xl:grid-cols-3">
                    <Card className="xl:col-span-2">
                        <CardHeader className="flex-row items-center justify-between">
                            <div className="space-y-1.5">
                                <CardTitle>Recent orders</CardTitle>
                                <CardDescription>
                                    The latest online and walk-in sales.
                                </CardDescription>
                            </div>
                            <Button variant="ghost" size="sm" asChild>
                                <Link href={orders()}>
                                    View all <ArrowRight />
                                </Link>
                            </Button>
                        </CardHeader>
                        <CardContent className="divide-y">
                            {recentOrders.map((o) => (
                                <Link
                                    key={o.id}
                                    href={order(o)}
                                    className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0 hover:text-primary"
                                >
                                    <div className="min-w-0">
                                        <p className="font-mono text-sm font-medium">
                                            {o.number}
                                        </p>
                                        <p className="truncate text-xs text-muted-foreground">
                                            {o.customer_name} ·{' '}
                                            {channelLabel[o.channel]} ·{' '}
                                            {formatRelative(o.placed_at)}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {o.payment_status !== 'paid' && (
                                            <PaymentStatusBadge
                                                status={o.payment_status}
                                            />
                                        )}
                                        <OrderStatusBadge status={o.status} />
                                        <span className="w-24 text-right text-sm font-medium tabular-nums">
                                            {formatMoney(o.total)}
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </CardContent>
                    </Card>

                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Top sellers</CardTitle>
                                <CardDescription>
                                    By revenue, last 30 days
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ol className="space-y-3">
                                    {topProducts.map((p, i) => (
                                        <li
                                            key={p.name}
                                            className="flex items-center gap-3 text-sm"
                                        >
                                            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                                                {i + 1}
                                            </span>
                                            <span className="min-w-0 flex-1 truncate">
                                                {p.name}
                                            </span>
                                            <span className="text-xs text-muted-foreground tabular-nums">
                                                {formatNumber(p.units)} sold
                                            </span>
                                            <span className="w-24 text-right font-medium tabular-nums">
                                                {formatMoney(p.revenue)}
                                            </span>
                                        </li>
                                    ))}
                                </ol>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex-row items-center justify-between">
                                <div className="space-y-1.5">
                                    <CardTitle>Low stock</CardTitle>
                                    <CardDescription>
                                        At or below reorder level
                                    </CardDescription>
                                </div>
                                <Button variant="ghost" size="sm" asChild>
                                    <Link href={newPurchaseOrder()}>
                                        Restock
                                    </Link>
                                </Button>
                            </CardHeader>
                            <CardContent>
                                {lowStock.length === 0 ? (
                                    <EmptyState
                                        icon={Boxes}
                                        title="All stocked up"
                                        className="py-6"
                                    />
                                ) : (
                                    <ul className="space-y-3">
                                        {lowStock.map((p) => (
                                            <li key={p.id}>
                                                <Link
                                                    href={product(p.id)}
                                                    className="flex items-center gap-3 text-sm hover:text-primary"
                                                >
                                                    <ProductImage
                                                        src={p.image_url}
                                                        alt={p.name}
                                                        className="size-9 shrink-0"
                                                        iconClassName="size-4"
                                                    />
                                                    <span className="min-w-0 flex-1 truncate">
                                                        {p.name}
                                                    </span>
                                                    <span
                                                        className={`text-xs font-medium tabular-nums ${p.stock === 0 ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}
                                                    >
                                                        {p.stock} /{' '}
                                                        {p.reorder_level}{' '}
                                                        {p.unit}
                                                    </span>
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
}

function ActionTile({
    show,
    icon: Icon,
    title,
    href,
}: {
    show: boolean;
    icon: typeof Wallet;
    title: string;
    href: string;
}) {
    if (!show) {
        return <div className="hidden md:block" />;
    }

    return (
        <Link
            href={href}
            className="group flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm transition-colors hover:border-amber-300 dark:border-amber-500/30 dark:bg-amber-500/10"
        >
            <Icon className="size-5 shrink-0 text-amber-600 dark:text-amber-400" />
            <span className="flex-1 font-medium">{title}</span>
            <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </Link>
    );
}

AdminDashboard.layout = {
    breadcrumbs: [{ title: 'Dashboard', href: dashboard() }],
};
