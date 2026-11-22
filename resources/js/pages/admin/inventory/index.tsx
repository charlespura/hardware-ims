import { Head, Link } from '@inertiajs/react';
import {
    Boxes,
    Download,
    PackageX,
    TriangleAlert,
    Warehouse,
} from 'lucide-react';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { Pagination } from '@/components/pagination';
import { SearchInput } from '@/components/search-input';
import { StatCard } from '@/components/stat-card';
import { StockMovementRow } from '@/components/stock-movement-row';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useFilters } from '@/hooks/use-filters';
import { formatNumber } from '@/lib/format';
import { movementLabel } from '@/lib/labels';
import { index } from '@/routes/admin/inventory';
import { index as products } from '@/routes/admin/products';
import { inventory as exportInventory } from '@/routes/admin/reports';
import type { Paginated, StockMovement, StockMovementType } from '@/types';

type Props = {
    movements: Paginated<StockMovement>;
    summary: { skus: number; units: number; low: number; out: number };
    filters: { search: string; type: string; from: string; to: string };
};

export default function Inventory({ movements, summary, filters }: Props) {
    const apply = useFilters(index.url(), filters);

    return (
        <>
            <Head title="Stock ledger" />
            <div className="space-y-5 p-4 md:p-6">
                <PageHeader
                    title="Stock ledger"
                    description="Every change to stock — sales, cancellations, deliveries and adjustments — with who did it."
                    actions={
                        <Button variant="outline" asChild>
                            <a href={exportInventory.url()}>
                                <Download /> Inventory CSV
                            </a>
                        </Button>
                    }
                />

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                        label="Active SKUs"
                        value={formatNumber(summary.skus)}
                        icon={Boxes}
                    />
                    <StatCard
                        label="Units on hand"
                        value={formatNumber(summary.units)}
                        icon={Warehouse}
                    />
                    <Link href={products.url({ query: { stock: 'low' } })}>
                        <StatCard
                            label="Low stock"
                            value={summary.low}
                            hint="View products →"
                            icon={TriangleAlert}
                            highlight={summary.low > 0}
                        />
                    </Link>
                    <Link href={products.url({ query: { stock: 'out' } })}>
                        <StatCard
                            label="Out of stock"
                            value={summary.out}
                            hint="View products →"
                            icon={PackageX}
                            highlight={summary.out > 0}
                        />
                    </Link>
                </div>

                <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_12rem_10rem_10rem]">
                    <SearchInput
                        value={filters.search}
                        onSearch={(search) => apply({ search })}
                        placeholder="Filter by product name or SKU"
                    />
                    <Select
                        value={filters.type || 'all'}
                        onValueChange={(v) =>
                            apply({ type: v === 'all' ? '' : v })
                        }
                    >
                        <SelectTrigger aria-label="Movement type">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">
                                All movement types
                            </SelectItem>
                            {(
                                Object.keys(
                                    movementLabel,
                                ) as StockMovementType[]
                            ).map((t) => (
                                <SelectItem key={t} value={t}>
                                    {movementLabel[t]}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Input
                        type="date"
                        value={filters.from}
                        onChange={(e) => apply({ from: e.target.value })}
                        aria-label="From date"
                    />
                    <Input
                        type="date"
                        value={filters.to}
                        onChange={(e) => apply({ to: e.target.value })}
                        aria-label="To date"
                    />
                </div>

                <Card className="py-0">
                    {movements.data.length === 0 ? (
                        <EmptyState
                            icon={Warehouse}
                            title="No stock movements"
                            description="Nothing matches these filters."
                            className="m-4 border-0"
                        />
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="pl-4">When</TableHead>
                                    <TableHead>Product</TableHead>
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
                                    <StockMovementRow
                                        key={m.id}
                                        movement={m}
                                        showProduct
                                    />
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </Card>
                <Pagination meta={movements} />
            </div>
        </>
    );
}

Inventory.layout = { breadcrumbs: [{ title: 'Stock ledger', href: index() }] };
