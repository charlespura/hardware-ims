import { Head, Link, useForm } from '@inertiajs/react';
import { Plus, Sparkles, Trash2 } from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { formatMoney } from '@/lib/format';
import { create, index, store } from '@/routes/admin/purchase-orders';
import type { Product, Supplier } from '@/types';

type Props = {
    suppliers: Pick<Supplier, 'id' | 'name'>[];
    products: Pick<
        Product,
        | 'id'
        | 'name'
        | 'sku'
        | 'unit'
        | 'cost_price'
        | 'stock'
        | 'reorder_level'
    >[];
};

type Line = { product_id: number; quantity: string; unit_cost: string };

export default function CreatePurchaseOrder({ suppliers, products }: Props) {
    const [picker, setPicker] = useState('');
    const form = useForm({
        supplier_id: '',
        expected_at: '',
        notes: '',
        items: [] as Line[],
    });

    const productById = (id: number) => products.find((p) => p.id === id)!;
    const chosen = new Set(form.data.items.map((i) => i.product_id));
    const lowStock = products.filter(
        (p) => p.stock <= p.reorder_level && !chosen.has(p.id),
    );
    const total = form.data.items.reduce(
        (sum, i) =>
            sum + (Number(i.quantity) || 0) * (Number(i.unit_cost) || 0),
        0,
    );
    const errors = form.errors as Record<string, string | undefined>;

    const lineFor = (product: Props['products'][number]): Line => ({
        product_id: product.id,
        // Suggest enough to bring stock back to twice the reorder level.
        quantity: String(
            Math.max(1, product.reorder_level * 2 - product.stock),
        ),
        unit_cost: String(product.cost_price ?? '0'),
    });

    // A single setData per click: calling it in a loop would read stale items.
    const addLines = (list: Props['products']) =>
        form.setData('items', [...form.data.items, ...list.map(lineFor)]);

    const updateLine = (index: number, changes: Partial<Line>) =>
        form.setData(
            'items',
            form.data.items.map((l, i) =>
                i === index ? { ...l, ...changes } : l,
            ),
        );

    return (
        <>
            <Head title="New purchase order" />
            <form
                className="space-y-6 p-4 md:p-6"
                onSubmit={(e) => {
                    e.preventDefault();
                    form.post(store.url());
                }}
            >
                <PageHeader
                    title="New purchase order"
                    description="Order stock from a supplier. Quantities are added to inventory when you receive the delivery."
                    actions={
                        <>
                            <Button variant="outline" asChild>
                                <Link href={index()}>Cancel</Link>
                            </Button>
                            <Button
                                type="submit"
                                disabled={
                                    form.processing ||
                                    form.data.items.length === 0
                                }
                            >
                                {form.processing && <Spinner />} Create PO ·{' '}
                                {formatMoney(total)}
                            </Button>
                        </>
                    }
                />

                <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
                    <Card>
                        <CardContent className="space-y-4">
                            <div className="grid gap-1.5">
                                <Label>Supplier</Label>
                                <Select
                                    value={form.data.supplier_id}
                                    onValueChange={(v) =>
                                        form.setData('supplier_id', v)
                                    }
                                >
                                    <SelectTrigger
                                        className="w-full"
                                        aria-invalid={!!form.errors.supplier_id}
                                    >
                                        <SelectValue placeholder="Choose a supplier" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {suppliers.map((s) => (
                                            <SelectItem
                                                key={s.id}
                                                value={String(s.id)}
                                            >
                                                {s.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={form.errors.supplier_id} />
                            </div>
                            <div className="grid gap-1.5">
                                <Label htmlFor="expected_at">
                                    Expected delivery
                                </Label>
                                <Input
                                    id="expected_at"
                                    type="date"
                                    value={form.data.expected_at}
                                    onChange={(e) =>
                                        form.setData(
                                            'expected_at',
                                            e.target.value,
                                        )
                                    }
                                />
                                <InputError message={form.errors.expected_at} />
                            </div>
                            <div className="grid gap-1.5">
                                <Label htmlFor="po-notes">Notes</Label>
                                <Textarea
                                    id="po-notes"
                                    value={form.data.notes}
                                    onChange={(e) =>
                                        form.setData('notes', e.target.value)
                                    }
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="pb-0">
                        <CardHeader className="flex-row flex-wrap items-center justify-between gap-3">
                            <CardTitle>Items</CardTitle>
                            <div className="flex flex-wrap gap-2">
                                {lowStock.length > 0 && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => addLines(lowStock)}
                                    >
                                        <Sparkles /> Add {lowStock.length}{' '}
                                        low-stock item(s)
                                    </Button>
                                )}
                                <Select
                                    value={picker}
                                    onValueChange={(v) => {
                                        addLines([productById(Number(v))]);
                                        setPicker('');
                                    }}
                                >
                                    <SelectTrigger
                                        className="w-64"
                                        aria-label="Add product"
                                    >
                                        <Plus className="size-4" />
                                        <SelectValue placeholder="Add a product…" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {products
                                            .filter((p) => !chosen.has(p.id))
                                            .map((p) => (
                                                <SelectItem
                                                    key={p.id}
                                                    value={String(p.id)}
                                                >
                                                    {p.name} ({p.stock} on hand)
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardHeader>
                        {errors.items && (
                            <p className="px-6 text-sm text-destructive">
                                {errors.items}
                            </p>
                        )}
                        {form.data.items.length === 0 ? (
                            <p className="px-6 py-10 text-center text-sm text-muted-foreground">
                                No items yet — add products or pull in
                                everything that’s low on stock.
                            </p>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="pl-6">
                                            Product
                                        </TableHead>
                                        <TableHead className="text-right">
                                            On hand
                                        </TableHead>
                                        <TableHead className="w-28">
                                            Qty
                                        </TableHead>
                                        <TableHead className="w-32">
                                            Unit cost
                                        </TableHead>
                                        <TableHead className="text-right">
                                            Line total
                                        </TableHead>
                                        <TableHead className="w-12 pr-6" />
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {form.data.items.map((line, i) => {
                                        const p = productById(line.product_id);

                                        return (
                                            <TableRow key={line.product_id}>
                                                <TableCell className="pl-6">
                                                    <div className="font-medium">
                                                        {p.name}
                                                    </div>
                                                    <div className="font-mono text-xs text-muted-foreground">
                                                        {p.sku}
                                                    </div>
                                                    <InputError
                                                        message={
                                                            errors[
                                                                `items.${i}.quantity`
                                                            ] ??
                                                            errors[
                                                                `items.${i}.unit_cost`
                                                            ]
                                                        }
                                                    />
                                                </TableCell>
                                                <TableCell
                                                    className={`text-right tabular-nums ${p.stock <= p.reorder_level ? 'text-amber-600 dark:text-amber-400' : ''}`}
                                                >
                                                    {p.stock} {p.unit}
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        inputMode="numeric"
                                                        value={line.quantity}
                                                        onChange={(e) =>
                                                            updateLine(i, {
                                                                quantity:
                                                                    e.target.value.replace(
                                                                        /\D/g,
                                                                        '',
                                                                    ),
                                                            })
                                                        }
                                                        aria-label="Quantity"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        inputMode="decimal"
                                                        value={line.unit_cost}
                                                        onChange={(e) =>
                                                            updateLine(i, {
                                                                unit_cost:
                                                                    e.target
                                                                        .value,
                                                            })
                                                        }
                                                        aria-label="Unit cost"
                                                    />
                                                </TableCell>
                                                <TableCell className="text-right font-medium tabular-nums">
                                                    {formatMoney(
                                                        (Number(
                                                            line.quantity,
                                                        ) || 0) *
                                                            (Number(
                                                                line.unit_cost,
                                                            ) || 0),
                                                    )}
                                                </TableCell>
                                                <TableCell className="pr-6">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        aria-label="Remove line"
                                                        onClick={() =>
                                                            form.setData(
                                                                'items',
                                                                form.data.items.filter(
                                                                    (_, j) =>
                                                                        j !== i,
                                                                ),
                                                            )
                                                        }
                                                    >
                                                        <Trash2 />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        )}
                    </Card>
                </div>
            </form>
        </>
    );
}

CreatePurchaseOrder.layout = {
    breadcrumbs: [
        { title: 'Purchase orders', href: index() },
        { title: 'New', href: create() },
    ],
};
