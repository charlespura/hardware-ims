import { Head, router } from '@inertiajs/react';
import { PackageSearch, SlidersHorizontal, X } from 'lucide-react';
import { useState } from 'react';
import { Pagination } from '@/components/pagination';
import { SearchInput } from '@/components/search-input';
import { EmptyState } from '@/components/empty-state';
import { ProductCard } from '@/components/shop/product-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { useFilters } from '@/hooks/use-filters';
import { ShopContainer } from '@/layouts/shop-layout';
import { cn } from '@/lib/utils';
import { index as shop } from '@/routes/shop';
import type { Brand, Category, Paginated, Product } from '@/types';

type Filters = {
    search: string;
    category: string;
    brand: string;
    min_price: string | number;
    max_price: string | number;
    in_stock: boolean;
    sort: string;
};

type Props = {
    products: Paginated<Product>;
    categories: Category[];
    brands: Brand[];
    filters: Filters;
};

const sorts = [
    { value: 'featured', label: 'Featured' },
    { value: 'popular', label: 'Best selling' },
    { value: 'newest', label: 'Newest' },
    { value: 'price_asc', label: 'Price: low to high' },
    { value: 'price_desc', label: 'Price: high to low' },
    { value: 'name', label: 'Name A–Z' },
];

export default function ShopIndex({
    products,
    categories,
    brands,
    filters,
}: Props) {
    const apply = useFilters(shop.url(), filters);
    const activeCategory = categories.find((c) => c.slug === filters.category);
    const activeBrand = brands.find((b) => b.slug === filters.brand);

    const chips = [
        filters.search && {
            label: `“${filters.search}”`,
            clear: { search: '' },
        },
        activeCategory && {
            label: activeCategory.name,
            clear: { category: '' },
        },
        activeBrand && { label: activeBrand.name, clear: { brand: '' } },
        (filters.min_price || filters.max_price) && {
            label: `₱${filters.min_price || 0} – ${filters.max_price ? `₱${filters.max_price}` : 'any'}`,
            clear: { min_price: '', max_price: '' },
        },
        filters.in_stock && { label: 'In stock', clear: { in_stock: false } },
    ].filter(Boolean) as { label: string; clear: Partial<Filters> }[];

    const sidebar = (
        <FilterPanel
            filters={filters}
            categories={categories}
            brands={brands}
            apply={apply}
        />
    );

    return (
        <>
            <Head title={activeCategory?.name ?? 'Shop'} />
            <ShopContainer>
                <div className="mb-6 space-y-1">
                    <h1 className="text-2xl font-semibold tracking-tight">
                        {activeCategory?.name ?? 'All products'}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {products.total}{' '}
                        {products.total === 1 ? 'item' : 'items'}
                        {filters.search && <> matching “{filters.search}”</>}
                    </p>
                </div>

                <div className="grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
                    <aside className="hidden lg:block">{sidebar}</aside>

                    <div className="min-w-0 space-y-5">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                            <SearchInput
                                value={filters.search}
                                onSearch={(search) => apply({ search })}
                                placeholder="Search by name, model or SKU"
                                className="flex-1"
                            />
                            <div className="flex gap-2">
                                <Sheet>
                                    <SheetTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="lg:hidden"
                                        >
                                            <SlidersHorizontal /> Filters
                                        </Button>
                                    </SheetTrigger>
                                    <SheetContent
                                        side="left"
                                        className="w-80 overflow-y-auto"
                                    >
                                        <SheetHeader>
                                            <SheetTitle>Filters</SheetTitle>
                                        </SheetHeader>
                                        <div className="px-4 pb-6">
                                            {sidebar}
                                        </div>
                                    </SheetContent>
                                </Sheet>
                                <Select
                                    value={filters.sort}
                                    onValueChange={(sort) => apply({ sort })}
                                >
                                    <SelectTrigger
                                        className="w-full sm:w-48"
                                        aria-label="Sort products"
                                    >
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {sorts.map((s) => (
                                            <SelectItem
                                                key={s.value}
                                                value={s.value}
                                            >
                                                {s.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {chips.length > 0 && (
                            <div className="flex flex-wrap items-center gap-2">
                                {chips.map((chip) => (
                                    <button
                                        key={chip.label}
                                        type="button"
                                        onClick={() => apply(chip.clear)}
                                        className="inline-flex items-center gap-1 rounded-full border bg-muted/50 px-3 py-1 text-xs font-medium hover:bg-muted"
                                    >
                                        {chip.label}
                                        <X className="size-3" />
                                    </button>
                                ))}
                                <button
                                    type="button"
                                    onClick={() => router.get(shop.url())}
                                    className="text-xs font-medium text-primary hover:underline"
                                >
                                    Clear all
                                </button>
                            </div>
                        )}

                        {products.data.length > 0 ? (
                            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
                                {products.data.map((product) => (
                                    <ProductCard
                                        key={product.id}
                                        product={product}
                                    />
                                ))}
                            </div>
                        ) : (
                            <EmptyState
                                icon={PackageSearch}
                                title="No products found"
                                description="Try a different search term or remove some filters."
                                action={
                                    <Button
                                        variant="outline"
                                        onClick={() => router.get(shop.url())}
                                    >
                                        Reset filters
                                    </Button>
                                }
                            />
                        )}

                        <Pagination meta={products} className="pt-4" />
                    </div>
                </div>
            </ShopContainer>
        </>
    );
}

function FilterPanel({
    filters,
    categories,
    brands,
    apply,
}: {
    filters: Filters;
    categories: Category[];
    brands: Brand[];
    apply: (changes: Partial<Filters>) => void;
}) {
    const [min, setMin] = useState(String(filters.min_price ?? ''));
    const [max, setMax] = useState(String(filters.max_price ?? ''));

    return (
        <div className="space-y-8">
            <FilterSection title="Category">
                <FilterOption
                    active={!filters.category}
                    onClick={() => apply({ category: '' })}
                >
                    All categories
                </FilterOption>
                {categories.map((c) => (
                    <FilterOption
                        key={c.id}
                        active={filters.category === c.slug}
                        onClick={() => apply({ category: c.slug })}
                        count={c.products_count}
                    >
                        {c.name}
                    </FilterOption>
                ))}
            </FilterSection>

            <FilterSection title="Brand">
                <FilterOption
                    active={!filters.brand}
                    onClick={() => apply({ brand: '' })}
                >
                    All brands
                </FilterOption>
                {brands.map((b) => (
                    <FilterOption
                        key={b.id}
                        active={filters.brand === b.slug}
                        onClick={() => apply({ brand: b.slug })}
                    >
                        {b.name}
                    </FilterOption>
                ))}
            </FilterSection>

            <FilterSection title="Price (₱)">
                <form
                    className="flex items-center gap-2"
                    onSubmit={(e) => {
                        e.preventDefault();
                        apply({ min_price: min, max_price: max });
                    }}
                >
                    <Input
                        inputMode="numeric"
                        placeholder="Min"
                        value={min}
                        onChange={(e) => setMin(e.target.value)}
                        aria-label="Minimum price"
                    />
                    <span className="text-muted-foreground">–</span>
                    <Input
                        inputMode="numeric"
                        placeholder="Max"
                        value={max}
                        onChange={(e) => setMax(e.target.value)}
                        aria-label="Maximum price"
                    />
                    <Button type="submit" size="sm" variant="secondary">
                        Go
                    </Button>
                </form>
            </FilterSection>

            <div className="flex items-center justify-between">
                <Label htmlFor="in-stock">In stock only</Label>
                <Switch
                    id="in-stock"
                    checked={filters.in_stock}
                    onCheckedChange={(in_stock) => apply({ in_stock })}
                />
            </div>
        </div>
    );
}

function FilterSection({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-2">
            <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                {title}
            </h3>
            <div className="space-y-0.5">{children}</div>
        </div>
    );
}

function FilterOption({
    active,
    onClick,
    count,
    children,
}: {
    active: boolean;
    onClick: () => void;
    count?: number;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                'flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent',
                active &&
                    'bg-primary/10 font-medium text-primary hover:bg-primary/15',
            )}
        >
            <span className="truncate">{children}</span>
            {count !== undefined && (
                <span className="text-xs text-muted-foreground tabular-nums">
                    {count}
                </span>
            )}
        </button>
    );
}
