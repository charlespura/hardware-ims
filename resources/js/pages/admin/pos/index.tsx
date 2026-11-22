import { Head, Link, useForm } from '@inertiajs/react';
import {
    Banknote,
    CheckCircle2,
    Minus,
    Plus,
    Printer,
    ScanBarcode,
    ShoppingBasket,
    Smartphone,
    Trash2,
    X,
} from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import InputError from '@/components/input-error';
import { ProductImage } from '@/components/product-image';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { formatMoney, formatRelative } from '@/lib/format';
import { cn } from '@/lib/utils';
import { index, store } from '@/routes/admin/pos';
import { receipt } from '@/routes/orders';
import type { Category, Order, Product } from '@/types';

type Props = {
    products: Product[];
    categories: Category[];
    recentSales: Order[];
    todayTotal: number;
    lastSale: Pick<
        Order,
        | 'id'
        | 'number'
        | 'total'
        | 'amount_tendered'
        | 'change_due'
        | 'payment_method'
    > | null;
};

type Line = { product: Product; quantity: number };

export default function Pos({
    products,
    categories,
    recentSales,
    todayTotal,
    lastSale,
}: Props) {
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState<number | null>(null);
    const [lines, setLines] = useState<Line[]>([]);
    const [receiptOpen, setReceiptOpen] = useState(!!lastSale);
    const searchRef = useRef<HTMLInputElement>(null);

    const form = useForm({
        customer_name: '',
        payment_method: 'cash' as 'cash' | 'gcash',
        payment_reference: '',
        amount_tendered: '',
        items: [] as { product_id: number; quantity: number }[],
    });

    const visible = useMemo(() => {
        const term = search.trim().toLowerCase();

        return products.filter(
            (p) =>
                (category === null || p.category_id === category) &&
                (!term ||
                    p.name.toLowerCase().includes(term) ||
                    p.sku.toLowerCase().includes(term)),
        );
    }, [products, search, category]);

    const total = lines.reduce(
        (sum, l) => sum + Number(l.product.price) * l.quantity,
        0,
    );
    const tendered = Number(form.data.amount_tendered) || 0;
    const change = tendered - total;
    const quickCash = [
        ...new Set([
            Math.ceil(total / 100) * 100,
            Math.ceil(total / 500) * 500,
            Math.ceil(total / 1000) * 1000,
        ]),
    ]
        .filter((v) => v > 0)
        .slice(0, 3);

    const add = (product: Product) => {
        if (product.stock <= 0) return;
        setLines((current) => {
            const existing = current.find((l) => l.product.id === product.id);

            if (existing) {
                return current.map((l) =>
                    l.product.id === product.id
                        ? {
                              ...l,
                              quantity: Math.min(product.stock, l.quantity + 1),
                          }
                        : l,
                );
            }

            return [...current, { product, quantity: 1 }];
        });
    };

    const setQty = (id: number, quantity: number) =>
        setLines((current) =>
            current.flatMap((l) =>
                l.product.id !== id
                    ? [l]
                    : quantity <= 0
                      ? []
                      : [
                            {
                                ...l,
                                quantity: Math.min(l.product.stock, quantity),
                            },
                        ],
            ),
        );

    const onSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
        // Barcode scanners "type" the SKU then press Enter.
        if (e.key === 'Enter') {
            e.preventDefault();
            const exact = products.find(
                (p) => p.sku.toLowerCase() === search.trim().toLowerCase(),
            );
            const target = exact ?? (visible.length === 1 ? visible[0] : null);

            if (target) {
                add(target);
                setSearch('');
            }
        }
    };

    const checkout = () => {
        form.transform((data) => ({
            ...data,
            items: lines.map((l) => ({
                product_id: l.product.id,
                quantity: l.quantity,
            })),
        }));
        form.post(store.url(), {
            preserveScroll: true,
            onSuccess: () => {
                setLines([]);
                form.reset();
                setReceiptOpen(true);
                searchRef.current?.focus();
            },
        });
    };

    const errors = form.errors as Record<string, string | undefined>;

    return (
        <>
            <Head title="Point of sale" />
            <div className="grid h-[calc(100svh-4rem)] min-h-0 lg:grid-cols-[minmax(0,1fr)_380px]">
                {/* Product picker */}
                <section className="flex min-h-0 min-w-0 flex-col gap-4 p-4 md:p-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h1 className="text-xl font-semibold tracking-tight">
                                Point of sale
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                Today’s walk-in sales:{' '}
                                <span className="font-medium text-foreground">
                                    {formatMoney(todayTotal)}
                                </span>
                            </p>
                        </div>
                    </div>
                    <div className="relative">
                        <ScanBarcode className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            ref={searchRef}
                            autoFocus
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={onSearchKey}
                            placeholder="Scan a barcode or search by name / SKU, then press Enter"
                            className="h-11 pl-9 text-base"
                        />
                    </div>
                    <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                        <CategoryChip
                            active={category === null}
                            onClick={() => setCategory(null)}
                        >
                            All
                        </CategoryChip>
                        {categories.map((c) => (
                            <CategoryChip
                                key={c.id}
                                active={category === c.id}
                                onClick={() => setCategory(c.id)}
                            >
                                {c.name}
                            </CategoryChip>
                        ))}
                    </div>
                    <div className="grid min-h-0 flex-1 auto-rows-max grid-cols-2 gap-3 overflow-y-auto pr-1 sm:grid-cols-3 xl:grid-cols-4">
                        {visible.map((p) => {
                            const inCart =
                                lines.find((l) => l.product.id === p.id)
                                    ?.quantity ?? 0;

                            return (
                                <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => add(p)}
                                    disabled={p.stock <= 0 || inCart >= p.stock}
                                    className={cn(
                                        'relative flex flex-col overflow-hidden rounded-xl border bg-card text-left transition-all hover:border-primary hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50',
                                        inCart > 0 &&
                                            'border-primary ring-1 ring-primary',
                                    )}
                                >
                                    <ProductImage
                                        src={p.image_url}
                                        alt=""
                                        className="aspect-[4/3] rounded-none"
                                    />
                                    {inCart > 0 && (
                                        <span className="absolute top-2 right-2 flex size-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                                            {inCart}
                                        </span>
                                    )}
                                    <div className="space-y-0.5 p-3">
                                        <p className="line-clamp-2 text-sm leading-snug font-medium">
                                            {p.name}
                                        </p>
                                        <p className="text-sm font-semibold tabular-nums">
                                            {formatMoney(p.price)}
                                        </p>
                                        <p
                                            className={cn(
                                                'text-xs',
                                                p.stock_status === 'in_stock'
                                                    ? 'text-muted-foreground'
                                                    : 'text-amber-600 dark:text-amber-400',
                                            )}
                                        >
                                            {p.stock > 0
                                                ? `${p.stock} ${p.unit} left`
                                                : 'Out of stock'}
                                        </p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </section>

                {/* Ticket */}
                <aside className="flex min-h-0 flex-col border-t bg-muted/30 lg:border-t-0 lg:border-l">
                    <div className="flex items-center justify-between border-b p-4">
                        <h2 className="flex items-center gap-2 font-medium">
                            <ShoppingBasket className="size-5" /> Current sale
                        </h2>
                        {lines.length > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setLines([])}
                            >
                                <X /> Clear
                            </Button>
                        )}
                    </div>

                    <div className="min-h-32 flex-1 overflow-y-auto p-4">
                        {lines.length === 0 ? (
                            <p className="py-10 text-center text-sm text-muted-foreground">
                                Tap products or scan barcodes to add them.
                            </p>
                        ) : (
                            <ul className="space-y-3">
                                {lines.map((l) => (
                                    <li
                                        key={l.product.id}
                                        className="flex items-center gap-3 rounded-lg bg-background p-2 shadow-xs"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium">
                                                {l.product.name}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {formatMoney(l.product.price)}{' '}
                                                each
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="size-7"
                                                onClick={() =>
                                                    setQty(
                                                        l.product.id,
                                                        l.quantity - 1,
                                                    )
                                                }
                                                aria-label="Decrease"
                                            >
                                                <Minus />
                                            </Button>
                                            <span className="w-7 text-center text-sm tabular-nums">
                                                {l.quantity}
                                            </span>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="size-7"
                                                onClick={() =>
                                                    setQty(
                                                        l.product.id,
                                                        l.quantity + 1,
                                                    )
                                                }
                                                disabled={
                                                    l.quantity >=
                                                    l.product.stock
                                                }
                                                aria-label="Increase"
                                            >
                                                <Plus />
                                            </Button>
                                        </div>
                                        <span className="w-20 text-right text-sm font-medium tabular-nums">
                                            {formatMoney(
                                                Number(l.product.price) *
                                                    l.quantity,
                                            )}
                                        </span>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="size-7 text-muted-foreground"
                                            onClick={() =>
                                                setQty(l.product.id, 0)
                                            }
                                            aria-label="Remove"
                                        >
                                            <Trash2 />
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="space-y-4 border-t bg-background p-4">
                        <div className="flex items-baseline justify-between">
                            <span className="text-sm text-muted-foreground">
                                Total
                            </span>
                            <span className="text-3xl font-semibold">
                                {formatMoney(total)}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <PayButton
                                active={form.data.payment_method === 'cash'}
                                onClick={() =>
                                    form.setData('payment_method', 'cash')
                                }
                                icon={<Banknote />}
                            >
                                Cash
                            </PayButton>
                            <PayButton
                                active={form.data.payment_method === 'gcash'}
                                onClick={() =>
                                    form.setData('payment_method', 'gcash')
                                }
                                icon={<Smartphone />}
                            >
                                GCash
                            </PayButton>
                        </div>

                        {form.data.payment_method === 'cash' ? (
                            <div className="space-y-2">
                                <Label htmlFor="tendered">Cash received</Label>
                                <Input
                                    id="tendered"
                                    inputMode="decimal"
                                    value={form.data.amount_tendered}
                                    onChange={(e) =>
                                        form.setData(
                                            'amount_tendered',
                                            e.target.value,
                                        )
                                    }
                                    className="h-11 text-lg tabular-nums"
                                    placeholder="0.00"
                                />
                                <div className="flex gap-2">
                                    {quickCash.map((v) => (
                                        <Button
                                            key={v}
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="flex-1"
                                            onClick={() =>
                                                form.setData(
                                                    'amount_tendered',
                                                    String(v),
                                                )
                                            }
                                        >
                                            {formatMoney(v)}
                                        </Button>
                                    ))}
                                </div>
                                {tendered > 0 && (
                                    <p
                                        className={cn(
                                            'flex justify-between text-sm font-medium',
                                            change < 0
                                                ? 'text-destructive'
                                                : 'text-emerald-600 dark:text-emerald-400',
                                        )}
                                    >
                                        <span>
                                            {change < 0 ? 'Short by' : 'Change'}
                                        </span>
                                        <span className="tabular-nums">
                                            {formatMoney(Math.abs(change))}
                                        </span>
                                    </p>
                                )}
                                <InputError message={errors.amount_tendered} />
                            </div>
                        ) : (
                            <div className="grid gap-1.5">
                                <Label htmlFor="gcash-ref">
                                    GCash reference no.
                                </Label>
                                <Input
                                    id="gcash-ref"
                                    value={form.data.payment_reference}
                                    onChange={(e) =>
                                        form.setData(
                                            'payment_reference',
                                            e.target.value,
                                        )
                                    }
                                />
                                <InputError
                                    message={errors.payment_reference}
                                />
                            </div>
                        )}

                        <Input
                            value={form.data.customer_name}
                            onChange={(e) =>
                                form.setData('customer_name', e.target.value)
                            }
                            placeholder="Customer name (optional)"
                            aria-label="Customer name"
                        />
                        <InputError message={errors.items} />

                        <Button
                            size="lg"
                            className="h-12 w-full text-base"
                            disabled={
                                lines.length === 0 ||
                                form.processing ||
                                (form.data.payment_method === 'cash' &&
                                    change < 0)
                            }
                            onClick={checkout}
                        >
                            {form.processing ? <Spinner /> : <CheckCircle2 />}{' '}
                            Complete sale
                        </Button>

                        {recentSales.length > 0 && (
                            <div className="space-y-1.5 border-t pt-3">
                                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                    Recent receipts
                                </p>
                                {recentSales.map((s) => (
                                    <a
                                        key={s.id}
                                        href={receipt.url(s)}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex items-center justify-between text-xs hover:text-primary"
                                    >
                                        <span className="font-mono">
                                            {s.number}
                                        </span>
                                        <span className="text-muted-foreground">
                                            {formatRelative(s.placed_at)}
                                        </span>
                                        <span className="tabular-nums">
                                            {formatMoney(s.total)}
                                        </span>
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>
                </aside>
            </div>

            <Dialog
                open={receiptOpen && !!lastSale}
                onOpenChange={setReceiptOpen}
            >
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader className="items-center text-center">
                        <CheckCircle2 className="size-12 text-emerald-500" />
                        <DialogTitle>Sale completed</DialogTitle>
                        <DialogDescription className="font-mono">
                            {lastSale?.number}
                        </DialogDescription>
                    </DialogHeader>
                    {lastSale && (
                        <dl className="space-y-1 text-sm">
                            <div className="flex justify-between">
                                <dt className="text-muted-foreground">Total</dt>
                                <dd className="font-medium">
                                    {formatMoney(lastSale.total)}
                                </dd>
                            </div>
                            {lastSale.payment_method === 'cash' && (
                                <>
                                    <div className="flex justify-between">
                                        <dt className="text-muted-foreground">
                                            Cash received
                                        </dt>
                                        <dd>
                                            {formatMoney(
                                                lastSale.amount_tendered,
                                            )}
                                        </dd>
                                    </div>
                                    <div className="flex justify-between text-lg font-semibold">
                                        <dt>Change</dt>
                                        <dd>
                                            {formatMoney(lastSale.change_due)}
                                        </dd>
                                    </div>
                                </>
                            )}
                        </dl>
                    )}
                    <DialogFooter className="sm:justify-between">
                        <Button variant="outline" asChild>
                            <Link
                                href={index()}
                                onClick={() => setReceiptOpen(false)}
                            >
                                New sale
                            </Link>
                        </Button>
                        {lastSale && (
                            <Button asChild>
                                <a
                                    href={receipt.url(lastSale.number)}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    <Printer /> Print receipt
                                </a>
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

function CategoryChip({
    active,
    onClick,
    children,
}: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                'shrink-0 rounded-full border px-3 py-1 text-sm font-medium transition-colors',
                active
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'bg-background hover:bg-accent',
            )}
        >
            {children}
        </button>
    );
}

function PayButton({
    active,
    onClick,
    icon,
    children,
}: {
    active: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <Button
            type="button"
            variant={active ? 'default' : 'outline'}
            onClick={onClick}
            className="h-11"
        >
            {icon} {children}
        </Button>
    );
}

Pos.layout = { breadcrumbs: [{ title: 'Point of sale', href: index() }] };
