import { Head, Link, router, useForm } from '@inertiajs/react';
import { Pencil, Plus, Tags, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { EmptyState } from '@/components/empty-state';
import InputError from '@/components/input-error';
import { PageHeader } from '@/components/page-header';
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import * as brandRoutes from '@/routes/admin/brands';
import * as categoryRoutes from '@/routes/admin/categories';
import { index as products } from '@/routes/admin/products';

type Item = {
    id: number;
    name: string;
    slug: string;
    description?: string | null;
    products_count: number;
};
type Resource = 'categories' | 'brands';

const routesFor = { categories: categoryRoutes, brands: brandRoutes };
const singular = { categories: 'category', brands: 'brand' };

export default function Lookups({
    resource,
    items,
}: {
    resource: Resource;
    items: Item[];
}) {
    const title = resource === 'categories' ? 'Categories' : 'Brands';

    return (
        <>
            <Head title={title} />
            <div className="space-y-5 p-4 md:p-6">
                <PageHeader
                    title="Categories & brands"
                    description="Organise the catalog so customers can filter and staff can report by category."
                    actions={
                        <ItemDialog
                            resource={resource}
                            trigger={
                                <Button>
                                    <Plus /> New {singular[resource]}
                                </Button>
                            }
                        />
                    }
                />

                <nav
                    className="inline-flex rounded-lg bg-muted p-1"
                    aria-label="Lookup type"
                >
                    {(['categories', 'brands'] as Resource[]).map((r) => (
                        <Link
                            key={r}
                            href={routesFor[r].index()}
                            className={cn(
                                'rounded-md px-4 py-1.5 text-sm font-medium capitalize',
                                r === resource
                                    ? 'bg-background shadow-sm'
                                    : 'text-muted-foreground',
                            )}
                        >
                            {r}
                        </Link>
                    ))}
                </nav>

                <Card className="py-0">
                    {items.length === 0 ? (
                        <EmptyState
                            icon={Tags}
                            title={`No ${resource} yet`}
                            className="m-4 border-0"
                        />
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="pl-4">Name</TableHead>
                                    {resource === 'categories' && (
                                        <TableHead>Description</TableHead>
                                    )}
                                    <TableHead className="text-right">
                                        Products
                                    </TableHead>
                                    <TableHead className="w-24 pr-4" />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {items.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="pl-4 font-medium">
                                            {item.name}
                                        </TableCell>
                                        {resource === 'categories' && (
                                            <TableCell className="max-w-md truncate text-muted-foreground">
                                                {item.description}
                                            </TableCell>
                                        )}
                                        <TableCell className="text-right tabular-nums">
                                            {resource === 'categories' ? (
                                                <Link
                                                    href={products.url({
                                                        query: {
                                                            category: item.id,
                                                        },
                                                    })}
                                                    className="hover:text-primary"
                                                >
                                                    {item.products_count}
                                                </Link>
                                            ) : (
                                                item.products_count
                                            )}
                                        </TableCell>
                                        <TableCell className="pr-4">
                                            <div className="flex justify-end gap-1">
                                                <ItemDialog
                                                    resource={resource}
                                                    item={item}
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
                                                    title={`Delete ${item.name}?`}
                                                    description={
                                                        resource ===
                                                        'categories'
                                                            ? 'Only empty categories can be deleted.'
                                                            : 'Products of this brand will become unbranded.'
                                                    }
                                                    confirmLabel="Delete"
                                                    destructive
                                                    onConfirm={() =>
                                                        router.delete(
                                                            routesFor[
                                                                resource
                                                            ].destroy.url(
                                                                item.id,
                                                            ),
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
            </div>
        </>
    );
}

function ItemDialog({
    resource,
    item,
    trigger,
}: {
    resource: Resource;
    item?: Item;
    trigger: React.ReactNode;
}) {
    const [open, setOpen] = useState(false);
    const form = useForm({
        name: item?.name ?? '',
        description: item?.description ?? '',
    });

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent>
                <form
                    className="space-y-4"
                    onSubmit={(e) => {
                        e.preventDefault();
                        const options = {
                            preserveScroll: true,
                            onSuccess: () => {
                                setOpen(false);
                                if (!item) form.reset();
                            },
                        };

                        if (item) {
                            form.put(
                                routesFor[resource].update.url(item.id),
                                options,
                            );
                        } else {
                            form.post(routesFor[resource].store.url(), options);
                        }
                    }}
                >
                    <DialogHeader>
                        <DialogTitle>
                            {item
                                ? `Edit ${item.name}`
                                : `New ${singular[resource]}`}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-1.5">
                        <Label htmlFor="lookup-name">Name</Label>
                        <Input
                            id="lookup-name"
                            value={form.data.name}
                            onChange={(e) =>
                                form.setData('name', e.target.value)
                            }
                            autoFocus
                        />
                        <InputError message={form.errors.name} />
                    </div>
                    {resource === 'categories' && (
                        <div className="grid gap-1.5">
                            <Label htmlFor="lookup-desc">
                                Short description
                            </Label>
                            <Input
                                id="lookup-desc"
                                value={form.data.description}
                                onChange={(e) =>
                                    form.setData('description', e.target.value)
                                }
                            />
                            <InputError message={form.errors.description} />
                        </div>
                    )}
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

Lookups.layout = (props: { resource: Resource }) => ({
    breadcrumbs: [
        {
            title: props.resource === 'categories' ? 'Categories' : 'Brands',
            href: routesFor[props.resource].index(),
        },
    ],
});
