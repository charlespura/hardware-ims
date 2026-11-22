import { Link, router, usePage } from '@inertiajs/react';
import { ShoppingCart } from 'lucide-react';
import { useState } from 'react';
import { ProductImage } from '@/components/product-image';
import { StockBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { formatMoney } from '@/lib/format';
import { login } from '@/routes';
import { store as addToCart } from '@/routes/cart';
import { show } from '@/routes/shop';
import type { Product } from '@/types';

export function ProductCard({ product }: { product: Product }) {
    const { auth } = usePage().props;
    const [adding, setAdding] = useState(false);
    const isStaff = auth.user && auth.user.role !== 'customer';
    const outOfStock = product.stock <= 0;

    const add = () => {
        if (!auth.user) {
            router.visit(login());

            return;
        }

        router.post(
            addToCart.url(),
            { product_id: product.id, quantity: 1 },
            {
                preserveScroll: true,
                onStart: () => setAdding(true),
                onFinish: () => setAdding(false),
            },
        );
    };

    return (
        <div className="group flex flex-col overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-md">
            <Link href={show(product)} className="relative block" prefetch>
                <ProductImage
                    src={product.image_url}
                    alt={product.name}
                    className="rounded-none transition-transform duration-300 group-hover:scale-[1.02]"
                />
                {product.is_featured && (
                    <span className="absolute top-2 left-2 rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground shadow-sm">
                        Best seller
                    </span>
                )}
            </Link>
            <div className="flex flex-1 flex-col gap-2 p-4">
                <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span className="hidden truncate sm:inline">
                        {product.brand?.name ?? product.category?.name ?? ' '}
                    </span>
                    <StockBadge
                        status={product.stock_status}
                        stock={product.stock}
                        customer
                    />
                </div>
                <Link
                    href={show(product)}
                    className="line-clamp-2 min-h-10 leading-snug font-medium hover:text-primary"
                >
                    {product.name}
                </Link>
                <div className="mt-auto flex flex-col gap-2 pt-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <div className="text-lg font-semibold tabular-nums">
                            {formatMoney(product.price)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            per {product.unit}
                        </div>
                    </div>
                    {!isStaff && (
                        <Button
                            size="sm"
                            className="w-full sm:w-auto"
                            onClick={add}
                            disabled={outOfStock || adding}
                            aria-label={`Add ${product.name} to cart`}
                        >
                            {adding ? <Spinner /> : <ShoppingCart />}
                            {outOfStock ? 'Sold out' : 'Add'}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
