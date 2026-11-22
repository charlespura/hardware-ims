import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowRight,
    ShoppingCart,
    TicketPercent,
    Trash2,
    X,
} from 'lucide-react';
import { EmptyState } from '@/components/empty-state';
import InputError from '@/components/input-error';
import { OrderTotals } from '@/components/orders/order-totals';
import { ProductImage } from '@/components/product-image';
import { QuantityInput } from '@/components/quantity-input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ShopContainer } from '@/layouts/shop-layout';
import { formatMoney } from '@/lib/format';
import { destroy, update } from '@/routes/cart';
import {
    apply as applyVoucher,
    remove as removeVoucher,
} from '@/routes/cart/voucher';
import { create as checkout } from '@/routes/checkout';
import { index as shop, show as product } from '@/routes/shop';
import type { CartLine, Quote } from '@/types';

type Props = {
    items: CartLine[];
    quote: Quote;
    canCheckout: boolean;
};

const issueText: Record<
    NonNullable<CartLine['issue']>,
    (l: CartLine) => string
> = {
    unavailable: () => 'This product is no longer sold. Please remove it.',
    out_of_stock: () => 'Out of stock — remove it to continue.',
    insufficient: (l) =>
        `Only ${l.product.stock} left. Lower the quantity to continue.`,
};

export default function Cart({ items, quote, canCheckout }: Props) {
    const { store } = usePage().props;
    const voucher = useForm({ voucher_code: '' });
    const toFreeShipping = store.free_shipping_threshold - quote.subtotal;

    const setQuantity = (line: CartLine, quantity: number) =>
        router.patch(
            update.url(line.id),
            { quantity },
            {
                preserveScroll: true,
                only: ['items', 'quote', 'canCheckout', 'cartCount'],
            },
        );

    if (items.length === 0) {
        return (
            <ShopContainer className="max-w-3xl">
                <Head title="Your cart" />
                <EmptyState
                    icon={ShoppingCart}
                    title="Your cart is empty"
                    description="Browse the catalog and add the tools and materials you need."
                    action={
                        <Button asChild>
                            <Link href={shop()}>Start shopping</Link>
                        </Button>
                    }
                    className="mt-10"
                />
            </ShopContainer>
        );
    }

    return (
        <ShopContainer>
            <Head title="Your cart" />
            <h1 className="mb-6 text-2xl font-semibold tracking-tight">
                Your cart
            </h1>

            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
                <div className="divide-y rounded-xl border">
                    {items.map((line) => (
                        <div key={line.id} className="flex gap-4 p-4">
                            <Link
                                href={product(line.product)}
                                className="w-20 shrink-0 sm:w-24"
                            >
                                <ProductImage
                                    src={line.product.image_url}
                                    alt={line.product.name}
                                />
                            </Link>
                            <div className="flex min-w-0 flex-1 flex-col gap-2">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <Link
                                            href={product(line.product)}
                                            className="line-clamp-2 font-medium hover:text-primary"
                                        >
                                            {line.product.name}
                                        </Link>
                                        <p className="text-sm text-muted-foreground">
                                            {formatMoney(line.product.price)} /{' '}
                                            {line.product.unit}
                                        </p>
                                    </div>
                                    <p className="font-semibold tabular-nums">
                                        {formatMoney(
                                            Number(line.product.price) *
                                                line.quantity,
                                        )}
                                    </p>
                                </div>
                                {line.issue && (
                                    <p className="flex items-center gap-1.5 text-sm text-amber-700 dark:text-amber-400">
                                        <AlertTriangle className="size-4" />{' '}
                                        {issueText[line.issue](line)}
                                    </p>
                                )}
                                <div className="mt-auto flex items-center justify-between">
                                    <QuantityInput
                                        size="sm"
                                        value={line.quantity}
                                        max={Math.max(1, line.product.stock)}
                                        disabled={
                                            line.issue === 'unavailable' ||
                                            line.issue === 'out_of_stock'
                                        }
                                        onChange={(q) => setQuantity(line, q)}
                                    />
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-muted-foreground hover:text-destructive"
                                        onClick={() =>
                                            router.delete(
                                                destroy.url(line.id),
                                                { preserveScroll: true },
                                            )
                                        }
                                    >
                                        <Trash2 /> Remove
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="space-y-4">
                    <Card className="lg:sticky lg:top-24">
                        <CardHeader>
                            <CardTitle>Order summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            {quote.voucher ? (
                                <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm dark:border-emerald-500/30 dark:bg-emerald-500/10">
                                    <span className="flex items-center gap-2">
                                        <TicketPercent className="size-4 text-emerald-600" />
                                        <span>
                                            <strong>
                                                {quote.voucher.code}
                                            </strong>
                                            <span className="block text-xs text-muted-foreground">
                                                {quote.voucher.summary}
                                            </span>
                                        </span>
                                    </span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="size-7"
                                        aria-label="Remove voucher"
                                        onClick={() =>
                                            router.delete(removeVoucher.url(), {
                                                preserveScroll: true,
                                            })
                                        }
                                    >
                                        <X />
                                    </Button>
                                </div>
                            ) : (
                                <form
                                    className="space-y-1"
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        voucher.post(applyVoucher.url(), {
                                            preserveScroll: true,
                                            onSuccess: () => voucher.reset(),
                                        });
                                    }}
                                >
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="Voucher code"
                                            value={voucher.data.voucher_code}
                                            onChange={(e) =>
                                                voucher.setData(
                                                    'voucher_code',
                                                    e.target.value.toUpperCase(),
                                                )
                                            }
                                            aria-label="Voucher code"
                                        />
                                        <Button
                                            type="submit"
                                            variant="secondary"
                                            disabled={
                                                !voucher.data.voucher_code ||
                                                voucher.processing
                                            }
                                        >
                                            Apply
                                        </Button>
                                    </div>
                                    <InputError
                                        message={voucher.errors.voucher_code}
                                    />
                                </form>
                            )}

                            <OrderTotals
                                subtotal={quote.subtotal}
                                discount={quote.discount}
                                shippingFee={quote.shipping_fee}
                                total={quote.total}
                                voucherCode={quote.voucher?.code}
                            />

                            {toFreeShipping > 0 && quote.shipping_fee > 0 && (
                                <div className="space-y-1.5">
                                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                                        <div
                                            className="h-full rounded-full bg-primary"
                                            style={{
                                                width: `${Math.min(100, (quote.subtotal / store.free_shipping_threshold) * 100)}%`,
                                            }}
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Add{' '}
                                        <strong className="text-foreground">
                                            {formatMoney(toFreeShipping)}
                                        </strong>{' '}
                                        more for free delivery — or choose free
                                        store pickup at checkout.
                                    </p>
                                </div>
                            )}

                            <Button
                                size="lg"
                                className="w-full"
                                disabled={!canCheckout}
                                asChild={canCheckout}
                            >
                                {canCheckout ? (
                                    <Link href={checkout()}>
                                        Checkout <ArrowRight />
                                    </Link>
                                ) : (
                                    <span>
                                        Fix the items above to check out
                                    </span>
                                )}
                            </Button>
                            <Link
                                href={shop()}
                                className="block text-center text-sm text-muted-foreground hover:text-foreground"
                            >
                                Continue shopping
                            </Link>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </ShopContainer>
    );
}
