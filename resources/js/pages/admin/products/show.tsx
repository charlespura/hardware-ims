import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    Archive,
    ExternalLink,
    PackageMinus,
    PackagePlus,
    Pencil,
    Scale,
} from 'lucide-react';
import { useState } from 'react';
import { ConfirmDialog } from '@/components/confirm-dialog';
import InputError from '@/components/input-error';
import { PageHeader } from '@/components/page-header';
import { Pagination } from '@/components/pagination';
import { ProductImage } from '@/components/product-image';
import { StatCard } from '@/components/stat-card';
import { StatusBadge, StockBadge } from '@/components/status-badge';
import { StockMovementRow } from '@/components/stock-movement-row';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Table,
    TableBody,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { formatMoney, formatNumber } from '@/lib/format';
import { cn } from '@/lib/utils';
import {
    adjustStock,
    destroy,
    edit,
    index,
    show,
} from '@/routes/admin/products';
import { show as shopPage } from '@/routes/shop';
import type { Paginated, Product, StockMovement } from '@/types';

type Props = {
    product: Product;
    movements: Paginated<StockMovement>;
    stats: {
        units_30d: number;
        revenue_30d: number;
        stock_value: number;
        margin: number;
    };
};

export default function AdminProductShow({ product, movements, stats }: Props) {
    return (
        <>
            <Head title={product.name} />
            <div className="space-y-6 p-4 md:p-6">
                <PageHeader
                    title={product.name}
                    description={
                        <span className="font-mono">{product.sku}</span>
                    }
                    actions={
                        <>
                            {product.is_active && (
                                <Button variant="ghost" asChild>
                                    <a
                                        href={shopPage.url(product)}
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        <ExternalLink /> View in shop
                                    </a>
                                </Button>
                            )}
                            <Button variant="outline" asChild>
                                <Link href={edit(product.id)}>
                                    <Pencil /> Edit
                                </Link>
                            </Button>
                            <AdjustStockDialog product={product} />
                        </>
                    }
                />

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                        label="On hand"
                        value={`${formatNumber(product.stock)} ${product.unit}`}
                        hint={`Reorder at ${product.reorder_level}`}
                        icon={Scale}
                        highlight={product.stock_status !== 'in_stock'}
                    />
                    <StatCard
                        label="Sold (30 days)"
                        value={formatNumber(stats.units_30d)}
                        hint={formatMoney(stats.revenue_30d)}
                        icon={PackageMinus}
                    />
                    <StatCard
                        label="Stock value (cost)"
                        value={formatMoney(stats.stock_value)}
                        hint={`${formatMoney(product.cost_price)} each`}
                        icon={PackagePlus}
                    />
                    <StatCard
                        label="Gross margin"
                        value={`${stats.margin}%`}
                        hint={`Sells for ${formatMoney(product.price)}`}
                        icon={Scale}
                    />
                </div>

                <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
                    <Card>
                        <CardContent className="space-y-4">
                            <ProductImage
                                src={product.image_url}
                                alt={product.name}
                                className="border"
                            />
                            <div className="flex flex-wrap gap-2">
                                <StockBadge
                                    status={product.stock_status}
                                    stock={product.stock}
                                    unit={product.unit}
                                />
                                {product.is_active ? (
                                    <StatusBadge tone="success">
                                        Visible in shop
                                    </StatusBadge>
                                ) : (
                                    <StatusBadge>Hidden</StatusBadge>
                                )}
                                {product.is_featured && (
                                    <StatusBadge tone="brand">
                                        Featured
                                    </StatusBadge>
                                )}
                            </div>
                            <dl className="grid grid-cols-[90px_minmax(0,1fr)] gap-y-2 text-sm">
                                <dt className="text-muted-foreground">
                                    Category
                                </dt>
                                <dd>{product.category?.name}</dd>
                                <dt className="text-muted-foreground">Brand</dt>
                                <dd>{product.brand?.name ?? '—'}</dd>
                                <dt className="text-muted-foreground">Model</dt>
                                <dd>{product.model ?? '—'}</dd>
                            </dl>
                            {product.description && (
                                <p className="text-sm text-muted-foreground">
                                    {product.description}
                                </p>
                            )}
                            <ConfirmDialog
                                trigger={
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="w-full text-destructive"
                                    >
                                        <Archive /> Archive product
                                    </Button>
                                }
                                title={`Archive ${product.name}?`}
                                description="It disappears from the shop and POS but its sales history is kept. You can restore it later."
                                confirmLabel="Archive"
                                destructive
                                onConfirm={() =>
                                    router.delete(destroy.url(product.id))
                                }
                            />
                        </CardContent>
                    </Card>

                    <Card className="pb-0">
                        <CardHeader>
                            <CardTitle>Stock history</CardTitle>
                        </CardHeader>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="pl-4">When</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Reference</TableHead>
                                    <TableHead className="text-right">
                                        Change
                                    </TableHead>
                                    <TableHead className="text-right">
                                        Balance
                                    </TableHead>
                                    <TableHead className="pr-4">By</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {movements.data.map((m) => (
                                    <StockMovementRow key={m.id} movement={m} />
                                ))}
                            </TableBody>
                        </Table>
                        <div className="border-t p-4">
                            <Pagination meta={movements} />
                        </div>
                    </Card>
                </div>
            </div>
        </>
    );
}

function AdjustStockDialog({ product }: { product: Product }) {
    const [open, setOpen] = useState(false);
    const form = useForm({
        mode: 'add' as 'add' | 'remove' | 'set',
        quantity: '',
        note: '',
    });
    const qty = Number(form.data.quantity) || 0;
    const result =
        form.data.mode === 'add'
            ? product.stock + qty
            : form.data.mode === 'remove'
              ? product.stock - qty
              : qty;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Scale /> Adjust stock
                </Button>
            </DialogTrigger>
            <DialogContent>
                <form
                    className="space-y-5"
                    onSubmit={(e) => {
                        e.preventDefault();
                        form.post(adjustStock.url(product.id), {
                            preserveScroll: true,
                            onSuccess: () => {
                                setOpen(false);
                                form.reset();
                            },
                        });
                    }}
                >
                    <DialogHeader>
                        <DialogTitle>Adjust stock</DialogTitle>
                        <DialogDescription>
                            For deliveries from suppliers, receive a purchase
                            order instead so costs are tracked.
                        </DialogDescription>
                    </DialogHeader>
                    <ToggleGroup
                        type="single"
                        variant="outline"
                        value={form.data.mode}
                        onValueChange={(v) =>
                            v &&
                            form.setData('mode', v as typeof form.data.mode)
                        }
                        className="w-full"
                    >
                        <ToggleGroupItem value="add" className="flex-1">
                            Add
                        </ToggleGroupItem>
                        <ToggleGroupItem value="remove" className="flex-1">
                            Remove
                        </ToggleGroupItem>
                        <ToggleGroupItem value="set" className="flex-1">
                            Set count
                        </ToggleGroupItem>
                    </ToggleGroup>
                    <div className="grid gap-1.5">
                        <Label htmlFor="adj-qty">
                            {form.data.mode === 'set'
                                ? 'Counted quantity'
                                : 'Quantity'}
                        </Label>
                        <Input
                            id="adj-qty"
                            inputMode="numeric"
                            value={form.data.quantity}
                            onChange={(e) =>
                                form.setData(
                                    'quantity',
                                    e.target.value.replace(/\D/g, ''),
                                )
                            }
                            autoFocus
                        />
                        <InputError message={form.errors.quantity} />
                        <p
                            className={cn(
                                'text-sm',
                                result < 0
                                    ? 'text-destructive'
                                    : 'text-muted-foreground',
                            )}
                        >
                            {product.stock} → <strong>{result}</strong>{' '}
                            {product.unit}
                        </p>
                    </div>
                    <div className="grid gap-1.5">
                        <Label htmlFor="adj-note">Reason</Label>
                        <Input
                            id="adj-note"
                            value={form.data.note}
                            onChange={(e) =>
                                form.setData('note', e.target.value)
                            }
                            placeholder="e.g. Damaged in storage, physical count"
                        />
                        <InputError message={form.errors.note} />
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={
                                form.processing ||
                                !form.data.quantity ||
                                result < 0
                            }
                        >
                            Save adjustment
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

AdminProductShow.layout = (props: Props) => ({
    breadcrumbs: [
        { title: 'Products', href: index() },
        { title: props.product.name, href: show(props.product.id) },
    ],
});
