import { Head, Link, router, useForm } from '@inertiajs/react';
import { Boxes, Mail, Pencil, Phone, Plus, Trash2, Truck } from 'lucide-react';
import { useState } from 'react';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { EmptyState } from '@/components/empty-state';
import InputError from '@/components/input-error';
import { PageHeader } from '@/components/page-header';
import { Pagination } from '@/components/pagination';
import { SearchInput } from '@/components/search-input';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useFilters } from '@/hooks/use-filters';
import { formatMoney } from '@/lib/format';
import { index as purchaseOrders } from '@/routes/admin/purchase-orders';
import { destroy, index, store, update } from '@/routes/admin/suppliers';
import type { Paginated, Supplier } from '@/types';

export default function Suppliers({
    suppliers,
    filters,
}: {
    suppliers: Paginated<Supplier>;
    filters: { search: string };
}) {
    const apply = useFilters(index.url(), filters);

    return (
        <>
            <Head title="Suppliers" />
            <div className="space-y-5 p-4 md:p-6">
                <PageHeader
                    title="Suppliers"
                    description="Who you buy from. Purchase orders are raised against a supplier."
                    actions={
                        <SupplierDialog
                            trigger={
                                <Button>
                                    <Plus /> Add supplier
                                </Button>
                            }
                        />
                    }
                />
                <SearchInput
                    value={filters.search}
                    onSearch={(search) => apply({ search })}
                    placeholder="Search suppliers"
                    className="max-w-md"
                />
                <Card className="py-0">
                    {suppliers.data.length === 0 ? (
                        <EmptyState
                            icon={Boxes}
                            title="No suppliers yet"
                            className="m-4 border-0"
                        />
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="pl-4">
                                        Supplier
                                    </TableHead>
                                    <TableHead>Contact</TableHead>
                                    <TableHead className="text-right">
                                        POs
                                    </TableHead>
                                    <TableHead className="text-right">
                                        Received value
                                    </TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="w-24 pr-4" />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {suppliers.data.map((s) => (
                                    <TableRow key={s.id}>
                                        <TableCell className="pl-4">
                                            <div className="font-medium">
                                                {s.name}
                                            </div>
                                            <div className="max-w-xs truncate text-xs text-muted-foreground">
                                                {s.address}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            <div>{s.contact_person}</div>
                                            <div className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                                                {s.phone && (
                                                    <span className="inline-flex items-center gap-1">
                                                        <Phone className="size-3" />
                                                        {s.phone}
                                                    </span>
                                                )}
                                                {s.email && (
                                                    <a
                                                        href={`mailto:${s.email}`}
                                                        className="inline-flex items-center gap-1 hover:underline"
                                                    >
                                                        <Mail className="size-3" />
                                                        {s.email}
                                                    </a>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right tabular-nums">
                                            <Link
                                                href={purchaseOrders.url({
                                                    query: { supplier: s.id },
                                                })}
                                                className="hover:text-primary"
                                            >
                                                {s.purchase_orders_count}
                                            </Link>
                                        </TableCell>
                                        <TableCell className="text-right tabular-nums">
                                            {formatMoney(s.received_total)}
                                        </TableCell>
                                        <TableCell>
                                            {s.is_active ? (
                                                <StatusBadge tone="success">
                                                    Active
                                                </StatusBadge>
                                            ) : (
                                                <StatusBadge>
                                                    Inactive
                                                </StatusBadge>
                                            )}
                                        </TableCell>
                                        <TableCell className="pr-4">
                                            <div className="flex justify-end gap-1">
                                                <SupplierDialog
                                                    supplier={s}
                                                    trigger={
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            aria-label="Edit"
                                                        >
                                                            <Pencil />
                                                        </Button>
                                                    }
                                                />
                                                <ConfirmDialog
                                                    trigger={
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-destructive"
                                                            aria-label="Delete"
                                                        >
                                                            <Trash2 />
                                                        </Button>
                                                    }
                                                    title={`Remove ${s.name}?`}
                                                    description="Suppliers with purchase orders are deactivated instead of deleted."
                                                    confirmLabel="Remove"
                                                    destructive
                                                    onConfirm={() =>
                                                        router.delete(
                                                            destroy.url(s.id),
                                                            {
                                                                preserveScroll: true,
                                                            },
                                                        )
                                                    }
                                                />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </Card>
                <Pagination meta={suppliers} />
            </div>
        </>
    );
}

function SupplierDialog({
    supplier,
    trigger,
}: {
    supplier?: Supplier;
    trigger: React.ReactNode;
}) {
    const [open, setOpen] = useState(false);
    const form = useForm({
        name: supplier?.name ?? '',
        contact_person: supplier?.contact_person ?? '',
        email: supplier?.email ?? '',
        phone: supplier?.phone ?? '',
        address: supplier?.address ?? '',
        notes: supplier?.notes ?? '',
        is_active: supplier?.is_active ?? true,
    });

    const input = (
        name: 'name' | 'contact_person' | 'email' | 'phone' | 'address',
        label: string,
        type = 'text',
    ) => (
        <div className="grid gap-1.5">
            <Label htmlFor={`sup-${name}`}>{label}</Label>
            <Input
                id={`sup-${name}`}
                type={type}
                value={form.data[name]}
                onChange={(e) => form.setData(name, e.target.value)}
            />
            <InputError message={form.errors[name]} />
        </div>
    );

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent className="sm:max-w-lg">
                <form
                    className="space-y-4"
                    onSubmit={(e) => {
                        e.preventDefault();
                        const options = {
                            preserveScroll: true,
                            onSuccess: () => {
                                setOpen(false);
                                if (!supplier) form.reset();
                            },
                        };
                        if (supplier)
                            form.put(update.url(supplier.id), options);
                        else form.post(store.url(), options);
                    }}
                >
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Truck className="size-5" />{' '}
                            {supplier ? 'Edit supplier' : 'New supplier'}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                            {input('name', 'Company name')}
                        </div>
                        {input('contact_person', 'Contact person')}
                        {input('phone', 'Phone')}
                        {input('email', 'E-mail', 'email')}
                        {input('address', 'Address')}
                        <div className="grid gap-1.5 sm:col-span-2">
                            <Label htmlFor="sup-notes">Notes</Label>
                            <Textarea
                                id="sup-notes"
                                value={form.data.notes}
                                onChange={(e) =>
                                    form.setData('notes', e.target.value)
                                }
                                placeholder="Payment terms, lead time, products supplied…"
                            />
                        </div>
                    </div>
                    <label className="flex items-center justify-between text-sm">
                        Active supplier
                        <Switch
                            checked={form.data.is_active}
                            onCheckedChange={(v) =>
                                form.setData('is_active', v)
                            }
                        />
                    </label>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={form.processing}>
                            Save
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

Suppliers.layout = { breadcrumbs: [{ title: 'Suppliers', href: index() }] };
