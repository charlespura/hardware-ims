import { Head, Link, router } from '@inertiajs/react';
import {
    ArchiveRestore,
    Download,
    PackagePlus,
    PackageSearch,
} from 'lucide-react';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { Pagination } from '@/components/pagination';
import { ProductImage } from '@/components/product-image';
import { SearchInput } from '@/components/search-input';
import { StatusBadge, StockBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useFilters } from '@/hooks/use-filters';
import { formatMoney } from '@/lib/format';
import { create, index, restore, show } from '@/routes/admin/products';
import { inventory as exportInventory } from '@/routes/admin/reports';
import type { Category, Paginated, Product } from '@/types';

type Filters = {
    search: string;
    category: string;
    stock: string;
    status: string;
    sort: string;
};

export default function AdminProducts({
    products,
    categories,
    filters,
}: {
    products: Paginated<Product>;
    categories: Category[];
    filters: Filters;
}) {
    const apply = useFilters(index.url(), filters);
    const pick = (key: keyof Filters) => (v: string) =>
        apply({ [key]: v === 'all' ? '' : v });

    return (
        <>
            <Head title="Products" />
            <div className="space-y-5 p-4 md:p-6">
                <PageHeader
                    title="Products"
                    description="Your catalog, prices and stock levels. Stock changes are recorded in the ledger."
                    actions={
                        <>
                            <Button variant="outline" asChild>
                                <a href={exportInventory.url()}>
                                    <Download /> Export CSV
                                </a>
                            </Button>
                            <Button asChild>
                                <Link href={create()}>
                                    <PackagePlus /> Add product
                                </Link>
                            </Button>
                        </>
                    }
                />

                <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_repeat(4,minmax(0,10rem))]">
                    <SearchInput
                        value={filters.search}
                        onSearch={(search) => apply({ search })}
                        placeholder="Search name, SKU or model"
                    />
                    <Select
                        value={filters.category || 'all'}
                        onValueChange={pick('category')}
                    >
                        <SelectTrigger aria-label="Category">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All categories</SelectItem>
                            {categories.map((c) => (
                                <SelectItem key={c.id} value={String(c.id)}>
                                    {c.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select
                        value={filters.stock || 'all'}
                        onValueChange={pick('stock')}
                    >
                        <SelectTrigger aria-label="Stock level">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Any stock level</SelectItem>
                            <SelectItem value="in">In stock</SelectItem>
                            <SelectItem value="low">Low stock</SelectItem>
                            <SelectItem value="out">Out of stock</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select
                        value={filters.status || 'all'}
                        onValueChange={pick('status')}
                    >
                        <SelectTrigger aria-label="Status">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Active + hidden</SelectItem>
                            <SelectItem value="active">Active only</SelectItem>
                            <SelectItem value="inactive">
                                Hidden from shop
                            </SelectItem>
                            <SelectItem value="archived">Archived</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select
                        value={filters.sort}
                        onValueChange={(sort) => apply({ sort })}
                    >
                        <SelectTrigger aria-label="Sort">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="name">Sort: Name</SelectItem>
                            <SelectItem value="stock">
                                Sort: Lowest stock
                            </SelectItem>
                            <SelectItem value="price">
                                Sort: Highest price
                            </SelectItem>
                            <SelectItem value="newest">Sort: Newest</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <Card className="py-0">
                    {products.data.length === 0 ? (
                        <EmptyState
                            icon={PackageSearch}
                            title="No products found"
                            description="Adjust the filters or add a new product."
                            className="m-4 border-0"
                        />
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="pl-4">
                                        Product
                                    </TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead className="text-right">
                                        Cost
                                    </TableHead>
                                    <TableHead className="text-right">
                                        Price
                                    </TableHead>
                                    <TableHead>Stock</TableHead>
                                    <TableHead className="pr-4">
                                        Status
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {products.data.map((p) => (
                                    <TableRow key={p.id}>
                                        <TableCell className="pl-4">
                                            <div className="flex items-center gap-3">
                                                <ProductImage
                                                    src={p.image_url}
                                                    alt={p.name}
                                                    className="size-10 shrink-0"
                                                    iconClassName="size-4"
                                                />
                                                <div className="min-w-0">
                                                    {p.deleted_at ? (
                                                        <span className="font-medium">
                                                            {p.name}
                                                        </span>
                                                    ) : (
                                                        <Link
                                                            href={show(p.id)}
                                                            className="font-medium hover:text-primary"
                                                        >
                                                            {p.name}
                                                        </Link>
                                                    )}
                                                    <div className="font-mono text-xs text-muted-foreground">
                                                        {p.sku}
                                                        {p.brand && (
                                                            <>
                                                                {' '}
                                                                · {p.brand.name}
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {p.category?.name}
                                        </TableCell>
                                        <TableCell className="text-right text-muted-foreground tabular-nums">
                                            {formatMoney(p.cost_price)}
                                        </TableCell>
                                        <TableCell className="text-right font-medium tabular-nums">
                                            {formatMoney(p.price)}
                                        </TableCell>
                                        <TableCell>
                                            <StockBadge
                                                status={p.stock_status}
                                                stock={p.stock}
                                                unit={p.unit}
                                            />
                                            <div className="mt-0.5 text-xs text-muted-foreground">
                                                reorder at {p.reorder_level}
                                            </div>
                                        </TableCell>
                                        <TableCell className="pr-4">
                                            {p.deleted_at ? (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() =>
                                                        router.post(
                                                            restore.url(p.id),
                                                            {},
                                                            {
                                                                preserveScroll: true,
                                                            },
                                                        )
                                                    }
                                                >
                                                    <ArchiveRestore /> Restore
                                                </Button>
                                            ) : p.is_active ? (
                                                <StatusBadge tone="success">
                                                    Active
                                                </StatusBadge>
                                            ) : (
                                                <StatusBadge>
                                                    Hidden
                                                </StatusBadge>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </Card>
                <Pagination meta={products} />
            </div>
        </>
    );
}

AdminProducts.layout = { breadcrumbs: [{ title: 'Products', href: index() }] };
