import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ChevronRight,
    PackageCheck,
    ShieldCheck,
    ShoppingCart,
    Store,
    Truck,
} from 'lucide-react';
import { useState } from 'react';
import { ProductImage } from '@/components/product-image';
import { QuantityInput } from '@/components/quantity-input';
import { ProductCard } from '@/components/shop/product-card';
import { StockBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import { ShopContainer } from '@/layouts/shop-layout';
import { formatMoney } from '@/lib/format';
import { login } from '@/routes';
import { index as cart, store as addToCart } from '@/routes/cart';
import { index as shop } from '@/routes/shop';
import type { Product } from '@/types';

type Props = {
    product: Product;
    related: Product[];
    inCart: number;
};

export default function ProductShow({ product, related, inCart }: Props) {
    const { auth, store } = usePage().props;
    const available = Math.max(0, product.stock - inCart);
    const [quantity, setQuantity] = useState(available > 0 ? 1 : 0);
    const [adding, setAdding] = useState(false);
    const isStaff = auth.user && auth.user.role !== 'customer';

    const add = (thenCheckout = false) => {
        if (!auth.user) {
            router.visit(login());

            return;
        }

        router.post(
            addToCart.url(),
            { product_id: product.id, quantity },
            {
                preserveScroll: true,
                onStart: () => setAdding(true),
                onFinish: () => setAdding(false),
                onSuccess: () => {
                    setQuantity(1);

                    if (thenCheckout) {
                        router.visit(cart());
                    }
                },
            },
        );
    };

    const specs = [
        ['SKU', product.sku],
        ['Brand', product.brand?.name],
        ['Model', product.model],
        ['Category', product.category?.name],
        ['Sold per', product.unit],
    ].filter(([, v]) => v) as [string, string][];

    return (
        <>
            <Head title={product.name} />
            <ShopContainer>
                <nav
                    className="mb-6 flex items-center gap-1 text-sm text-muted-foreground"
                    aria-label="Breadcrumb"
                >
                    <Link href={shop()} className="hover:text-foreground">
                        Shop
                    </Link>
                    {product.category && (
                        <>
                            <ChevronRight className="size-4" />
                            <Link
                                href={shop.url({
                                    query: { category: product.category.slug },
                                })}
                                className="hover:text-foreground"
                            >
                                {product.category.name}
                            </Link>
                        </>
                    )}
                    <ChevronRight className="size-4" />
                    <span className="truncate text-foreground">
                        {product.name}
                    </span>
                </nav>

                <div className="grid gap-10 lg:grid-cols-2">
                    <ProductImage
                        src={product.image_url}
                        alt={product.name}
                        className="rounded-2xl border"
                    />

                    <div className="space-y-6">
                        <div className="space-y-3">
                            {product.brand && (
                                <Link
                                    href={shop.url({
                                        query: { brand: product.brand.slug },
                                    })}
                                    className="text-sm font-medium text-primary hover:underline"
                                >
                                    {product.brand.name}
                                </Link>
                            )}
                            <h1 className="text-3xl font-semibold tracking-tight">
                                {product.name}
                            </h1>
                            <div className="flex flex-wrap items-center gap-3">
                                <span className="text-3xl font-semibold tabular-nums">
                                    {formatMoney(product.price)}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                    per {product.unit}
                                </span>
                                <StockBadge
                                    status={product.stock_status}
                                    stock={product.stock}
                                    customer
                                />
                            </div>
                        </div>

                        {product.description && (
                            <p className="leading-relaxed text-muted-foreground">
                                {product.description}
                            </p>
                        )}

                        {!isStaff && (
                            <div className="space-y-3 rounded-xl border bg-muted/30 p-4">
                                {available > 0 ? (
                                    <>
                                        <div className="flex flex-wrap items-center gap-3">
                                            <QuantityInput
                                                value={quantity}
                                                onChange={setQuantity}
                                                max={available}
                                            />
                                            <span className="text-sm text-muted-foreground">
                                                {available} available
                                                {inCart > 0 && (
                                                    <>
                                                        {' '}
                                                        · {inCart} already in
                                                        your cart
                                                    </>
                                                )}
                                            </span>
                                        </div>
                                        <div className="grid gap-2 sm:grid-cols-2">
                                            <Button
                                                size="lg"
                                                onClick={() => add()}
                                                disabled={adding}
                                            >
                                                {adding ? (
                                                    <Spinner />
                                                ) : (
                                                    <ShoppingCart />
                                                )}{' '}
                                                Add to cart
                                            </Button>
                                            <Button
                                                size="lg"
                                                variant="outline"
                                                onClick={() => add(true)}
                                                disabled={adding}
                                            >
                                                Buy now
                                            </Button>
                                        </div>
                                    </>
                                ) : (
                                    <p className="text-sm">
                                        {product.stock === 0 ? (
                                            <>
                                                This item is{' '}
                                                <strong>out of stock</strong>.
                                                We restock regularly — check
                                                back soon.
                                            </>
                                        ) : (
                                            <>
                                                You already have all{' '}
                                                {product.stock} available units
                                                in your cart.
                                            </>
                                        )}
                                    </p>
                                )}
                            </div>
                        )}

                        <ul className="grid gap-3 text-sm sm:grid-cols-3">
                            <li className="flex items-center gap-2 text-muted-foreground">
                                <Truck className="size-4 text-primary" /> Free
                                delivery over{' '}
                                {formatMoney(store.free_shipping_threshold)}
                            </li>
                            <li className="flex items-center gap-2 text-muted-foreground">
                                <Store className="size-4 text-primary" /> Free
                                store pickup
                            </li>
                            <li className="flex items-center gap-2 text-muted-foreground">
                                <ShieldCheck className="size-4 text-primary" />{' '}
                                Pay on delivery
                            </li>
                        </ul>

                        <Separator />

                        <div className="space-y-3">
                            <h2 className="font-medium">Specifications</h2>
                            <dl className="grid grid-cols-[120px_minmax(0,1fr)] gap-x-4 gap-y-2 text-sm">
                                {specs.map(([label, value]) => (
                                    <div key={label} className="contents">
                                        <dt className="text-muted-foreground">
                                            {label}
                                        </dt>
                                        <dd className="font-medium">{value}</dd>
                                    </div>
                                ))}
                            </dl>
                            {product.specifications &&
                                product.specifications !==
                                    product.description && (
                                    <p className="text-sm whitespace-pre-line text-muted-foreground">
                                        {product.specifications}
                                    </p>
                                )}
                        </div>
                    </div>
                </div>

                {related.length > 0 && (
                    <section className="mt-16 space-y-6">
                        <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
                            <PackageCheck className="size-5 text-primary" />{' '}
                            More in {product.category?.name}
                        </h2>
                        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                            {related.map((p) => (
                                <ProductCard key={p.id} product={p} />
                            ))}
                        </div>
                    </section>
                )}
            </ShopContainer>
        </>
    );
}
