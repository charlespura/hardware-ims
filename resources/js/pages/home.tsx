import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    ClipboardCheck,
    PackageCheck,
    ShieldCheck,
    ShoppingBag,
    Store,
    Truck,
    Wallet,
} from 'lucide-react';
import { ProductImage } from '@/components/product-image';
import { categoryIcon } from '@/components/shop/category-icon';
import { ProductCard } from '@/components/shop/product-card';
import { Button } from '@/components/ui/button';
import { ShopContainer } from '@/layouts/shop-layout';
import { formatMoney, formatNumber } from '@/lib/format';
import { register } from '@/routes';
import { index as orders } from '@/routes/orders';
import { index as shop } from '@/routes/shop';
import type { Category, Product } from '@/types';

type Props = {
    featured: Product[];
    categories: Category[];
    stats: { products: number; categories: number };
};

export default function Home({ featured, categories, stats }: Props) {
    const { auth, store } = usePage().props;
    const heroImages = featured.filter((p) => p.image_url).slice(0, 4);

    const perks = [
        {
            icon: Truck,
            title: 'Delivery or pickup',
            text: `Free delivery over ${formatMoney(store.free_shipping_threshold)}, or pick up in store at no charge.`,
        },
        {
            icon: Wallet,
            title: 'Pay your way',
            text: 'Cash on delivery, GCash or bank transfer — verified by our team.',
        },
        {
            icon: PackageCheck,
            title: 'Live stock levels',
            text: 'What you see is what we have on the shelf, updated with every sale.',
        },
        {
            icon: ShieldCheck,
            title: 'Track every step',
            text: 'Follow your order from confirmation to your doorstep.',
        },
    ];

    const steps = [
        {
            icon: ShoppingBag,
            title: 'Add to cart',
            text: 'Browse by category or search by name, brand or SKU.',
        },
        {
            icon: ClipboardCheck,
            title: 'Check out',
            text: 'Choose delivery or pickup, a schedule, and how you’ll pay.',
        },
        {
            icon: Store,
            title: 'We prepare it',
            text: 'Our staff confirm your order and get your items ready.',
        },
        {
            icon: Truck,
            title: 'Delivered',
            text: 'Receive it at home or collect it — you’ll get e-mail updates.',
        },
    ];

    return (
        <>
            <Head title="Hardware & construction supplies" />

            {/* Hero */}
            <section className="relative overflow-hidden border-b bg-gradient-to-b from-primary/10 via-background to-background">
                <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 md:py-20 lg:grid-cols-2">
                    <div className="space-y-6">
                        <span className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
                            <span className="size-1.5 rounded-full bg-emerald-500" />
                            {formatNumber(stats.products)} products in{' '}
                            {stats.categories} categories
                        </span>
                        <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
                            Everything you need to{' '}
                            <span className="text-primary">build, fix</span> and
                            finish.
                        </h1>
                        <p className="max-w-lg text-lg text-muted-foreground">
                            {store.tagline} Order online and track it from our
                            shelf to your site.
                        </p>
                        <div className="flex flex-wrap gap-3">
                            <Button size="lg" asChild>
                                <Link href={shop()}>
                                    Shop the catalog <ArrowRight />
                                </Link>
                            </Button>
                            {auth.user ? (
                                auth.user.role === 'customer' && (
                                    <Button size="lg" variant="outline" asChild>
                                        <Link href={orders()}>
                                            Track my orders
                                        </Link>
                                    </Button>
                                )
                            ) : (
                                <Button size="lg" variant="outline" asChild>
                                    <Link href={register()}>
                                        Create a free account
                                    </Link>
                                </Button>
                            )}
                        </div>
                    </div>

                    {heroImages.length > 0 && (
                        <div className="grid grid-cols-2 gap-3 sm:gap-4">
                            {heroImages.map((product, i) => (
                                <Link
                                    key={product.id}
                                    href={shop.url({
                                        query: { search: product.name },
                                    })}
                                    className={`group relative overflow-hidden rounded-2xl border bg-card shadow-sm ${i % 2 === 1 ? 'translate-y-6' : ''}`}
                                >
                                    <ProductImage
                                        src={product.image_url}
                                        alt={product.name}
                                        className="rounded-none transition-transform duration-500 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 text-white">
                                        <div className="truncate text-sm font-medium">
                                            {product.name}
                                        </div>
                                        <div className="text-xs opacity-90">
                                            {formatMoney(product.price)}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* Perks */}
            <section className="border-b">
                <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
                    {perks.map((perk) => (
                        <div key={perk.title} className="flex gap-3">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <perk.icon className="size-5" />
                            </div>
                            <div>
                                <h3 className="text-sm font-medium">
                                    {perk.title}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    {perk.text}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <ShopContainer className="space-y-16 py-14">
                {/* Categories */}
                <section className="space-y-6">
                    <SectionHeading
                        title="Shop by category"
                        action={<Link href={shop()}>View all products</Link>}
                    />
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {categories.map((category) => {
                            const Icon = categoryIcon(category.slug);

                            return (
                                <Link
                                    key={category.id}
                                    href={shop.url({
                                        query: { category: category.slug },
                                    })}
                                    className="group flex items-center gap-3 rounded-xl border bg-card p-4 transition-colors hover:border-primary/50 hover:bg-primary/5"
                                >
                                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                                        <Icon className="size-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="truncate text-sm font-medium">
                                            {category.name}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {category.products_count} items
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </section>

                {/* Featured */}
                <section className="space-y-6">
                    <SectionHeading
                        title="Popular right now"
                        action={
                            <Link
                                href={shop.url({ query: { sort: 'popular' } })}
                            >
                                See best sellers
                            </Link>
                        }
                    />
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                        {featured.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                </section>

                {/* How it works */}
                <section className="rounded-2xl border bg-muted/30 p-6 sm:p-10">
                    <h2 className="text-xl font-semibold tracking-tight">
                        How ordering works
                    </h2>
                    <ol className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {steps.map((step, i) => (
                            <li key={step.title} className="relative space-y-2">
                                <div className="flex items-center gap-3">
                                    <span className="flex size-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                                        {i + 1}
                                    </span>
                                    <step.icon className="size-5 text-muted-foreground" />
                                </div>
                                <h3 className="font-medium">{step.title}</h3>
                                <p className="text-sm text-muted-foreground">
                                    {step.text}
                                </p>
                            </li>
                        ))}
                    </ol>
                </section>
            </ShopContainer>
        </>
    );
}

function SectionHeading({
    title,
    action,
}: {
    title: string;
    action?: React.ReactNode;
}) {
    return (
        <div className="flex items-end justify-between gap-4">
            <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
            {action && (
                <span className="text-sm font-medium text-primary hover:underline">
                    {action}
                </span>
            )}
        </div>
    );
}
