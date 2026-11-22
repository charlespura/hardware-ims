import { Head, Link, useForm } from '@inertiajs/react';
import { ImagePlus, Info, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import InputError from '@/components/input-error';
import { PageHeader } from '@/components/page-header';
import { ProductImage } from '@/components/product-image';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { formatMoney } from '@/lib/format';
import { index, show, store, update } from '@/routes/admin/products';
import type { Brand, Category, Product } from '@/types';

type Props = {
    product?: Product;
    categories: Category[];
    brands: Brand[];
    units: string[];
};

export default function ProductForm({
    product,
    categories,
    brands,
    units,
}: Props) {
    const editing = !!product;
    const form = useForm({
        name: product?.name ?? '',
        sku: product?.sku ?? '',
        category_id: product ? String(product.category_id) : '',
        brand_id: product?.brand_id ? String(product.brand_id) : '',
        model: product?.model ?? '',
        description: product?.description ?? '',
        specifications: product?.specifications ?? '',
        unit: product?.unit ?? 'pc',
        cost_price: product ? String(product.cost_price) : '',
        price: product ? String(product.price) : '',
        reorder_level: product ? String(product.reorder_level) : '10',
        opening_stock: '0',
        is_active: product?.is_active ?? true,
        is_featured: product?.is_featured ?? false,
        image: null as File | null,
        remove_image: false,
    });

    const [preview, setPreview] = useState<string | null>(
        product?.image_url ?? null,
    );

    useEffect(() => {
        if (!form.data.image) return;
        const url = URL.createObjectURL(form.data.image);
        setPreview(url);

        return () => URL.revokeObjectURL(url);
    }, [form.data.image]);

    const margin = useMemo(() => {
        const cost = Number(form.data.cost_price);
        const price = Number(form.data.price);

        return price > 0 && cost >= 0
            ? Math.round((1 - cost / price) * 1000) / 10
            : null;
    }, [form.data.cost_price, form.data.price]);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        if (editing) {
            form.transform((data) => {
                const { opening_stock: _ignored, ...rest } = data;
                void _ignored;

                return { ...rest, _method: 'put' };
            });
            form.post(update.url(product.id), {
                forceFormData: true,
                preserveScroll: true,
            });
        } else {
            form.post(store.url(), {
                forceFormData: true,
                preserveScroll: true,
            });
        }
    };

    const text = (
        name: 'name' | 'sku' | 'model',
        label: string,
        props: React.ComponentProps<typeof Input> = {},
    ) => (
        <div className="grid gap-1.5">
            <Label htmlFor={name}>{label}</Label>
            <Input
                id={name}
                value={form.data[name]}
                onChange={(e) => form.setData(name, e.target.value)}
                aria-invalid={!!form.errors[name]}
                {...props}
            />
            <InputError message={form.errors[name]} />
        </div>
    );

    return (
        <>
            <Head title={editing ? `Edit ${product.name}` : 'Add product'} />
            <form onSubmit={submit} className="space-y-6 p-4 md:p-6">
                <PageHeader
                    title={editing ? `Edit ${product.name}` : 'Add a product'}
                    description={
                        editing
                            ? 'Update details and pricing. Use “Adjust stock” on the product page to change quantities.'
                            : 'New products appear in the shop as soon as they’re active and in stock.'
                    }
                    actions={
                        <>
                            <Button variant="outline" asChild>
                                <Link
                                    href={editing ? show(product.id) : index()}
                                >
                                    Cancel
                                </Link>
                            </Button>
                            <Button type="submit" disabled={form.processing}>
                                {form.processing && <Spinner />}{' '}
                                {editing ? 'Save changes' : 'Create product'}
                            </Button>
                        </>
                    }
                />

                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Details</CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-4 sm:grid-cols-2">
                                <div className="sm:col-span-2">
                                    {text('name', 'Product name', {
                                        placeholder: 'e.g. Cordless Drill 18V',
                                    })}
                                </div>
                                {text('sku', 'SKU / item code', {
                                    placeholder: 'Unique code',
                                    className: 'font-mono',
                                })}
                                {text('model', 'Model (optional)')}
                                <div className="grid gap-1.5">
                                    <Label>Category</Label>
                                    <Select
                                        value={form.data.category_id}
                                        onValueChange={(v) =>
                                            form.setData('category_id', v)
                                        }
                                    >
                                        <SelectTrigger
                                            className="w-full"
                                            aria-invalid={
                                                !!form.errors.category_id
                                            }
                                        >
                                            <SelectValue placeholder="Choose a category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.map((c) => (
                                                <SelectItem
                                                    key={c.id}
                                                    value={String(c.id)}
                                                >
                                                    {c.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError
                                        message={form.errors.category_id}
                                    />
                                </div>
                                <div className="grid gap-1.5">
                                    <Label>Brand</Label>
                                    <Select
                                        value={form.data.brand_id || 'none'}
                                        onValueChange={(v) =>
                                            form.setData(
                                                'brand_id',
                                                v === 'none' ? '' : v,
                                            )
                                        }
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">
                                                No brand / generic
                                            </SelectItem>
                                            {brands.map((b) => (
                                                <SelectItem
                                                    key={b.id}
                                                    value={String(b.id)}
                                                >
                                                    {b.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError
                                        message={form.errors.brand_id}
                                    />
                                </div>
                                <div className="grid gap-1.5 sm:col-span-2">
                                    <Label htmlFor="description">
                                        Description
                                    </Label>
                                    <Textarea
                                        id="description"
                                        rows={3}
                                        value={form.data.description}
                                        onChange={(e) =>
                                            form.setData(
                                                'description',
                                                e.target.value,
                                            )
                                        }
                                        placeholder="What it is and what it’s for — shown to customers."
                                    />
                                    <InputError
                                        message={form.errors.description}
                                    />
                                </div>
                                <div className="grid gap-1.5 sm:col-span-2">
                                    <Label htmlFor="specifications">
                                        Specifications
                                    </Label>
                                    <Textarea
                                        id="specifications"
                                        rows={3}
                                        value={form.data.specifications}
                                        onChange={(e) =>
                                            form.setData(
                                                'specifications',
                                                e.target.value,
                                            )
                                        }
                                        placeholder="Size, material, power, capacity…"
                                    />
                                    <InputError
                                        message={form.errors.specifications}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Pricing & stock</CardTitle>
                                <CardDescription>
                                    Cost price is never shown to customers.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-4 sm:grid-cols-3">
                                <div className="grid gap-1.5">
                                    <Label htmlFor="cost_price">
                                        Cost price (₱)
                                    </Label>
                                    <Input
                                        id="cost_price"
                                        inputMode="decimal"
                                        value={form.data.cost_price}
                                        onChange={(e) =>
                                            form.setData(
                                                'cost_price',
                                                e.target.value,
                                            )
                                        }
                                        aria-invalid={!!form.errors.cost_price}
                                    />
                                    <InputError
                                        message={form.errors.cost_price}
                                    />
                                </div>
                                <div className="grid gap-1.5">
                                    <Label htmlFor="price">
                                        Selling price (₱)
                                    </Label>
                                    <Input
                                        id="price"
                                        inputMode="decimal"
                                        value={form.data.price}
                                        onChange={(e) =>
                                            form.setData(
                                                'price',
                                                e.target.value,
                                            )
                                        }
                                        aria-invalid={!!form.errors.price}
                                    />
                                    <InputError message={form.errors.price} />
                                </div>
                                <div className="grid gap-1.5">
                                    <Label>Sold per</Label>
                                    <Select
                                        value={form.data.unit}
                                        onValueChange={(v) =>
                                            form.setData('unit', v)
                                        }
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {units.map((u) => (
                                                <SelectItem key={u} value={u}>
                                                    {u}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                {margin !== null && (
                                    <p className="text-sm text-muted-foreground sm:col-span-3">
                                        Margin:{' '}
                                        <span
                                            className={
                                                margin < 10
                                                    ? 'font-medium text-amber-600'
                                                    : 'font-medium text-foreground'
                                            }
                                        >
                                            {margin}%
                                        </span>{' '}
                                        (
                                        {formatMoney(
                                            Number(form.data.price) -
                                                Number(form.data.cost_price),
                                        )}{' '}
                                        per {form.data.unit})
                                    </p>
                                )}
                                {!editing && (
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="opening_stock">
                                            Opening stock
                                        </Label>
                                        <Input
                                            id="opening_stock"
                                            inputMode="numeric"
                                            value={form.data.opening_stock}
                                            onChange={(e) =>
                                                form.setData(
                                                    'opening_stock',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                        <InputError
                                            message={form.errors.opening_stock}
                                        />
                                    </div>
                                )}
                                <div className="grid gap-1.5">
                                    <Label htmlFor="reorder_level">
                                        Reorder level
                                    </Label>
                                    <Input
                                        id="reorder_level"
                                        inputMode="numeric"
                                        value={form.data.reorder_level}
                                        onChange={(e) =>
                                            form.setData(
                                                'reorder_level',
                                                e.target.value,
                                            )
                                        }
                                    />
                                    <InputError
                                        message={form.errors.reorder_level}
                                    />
                                </div>
                                <p className="flex items-start gap-2 text-xs text-muted-foreground sm:col-span-3">
                                    <Info className="mt-0.5 size-3.5 shrink-0" />
                                    You’ll get a low-stock alert when on-hand
                                    quantity drops to the reorder level.
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Photo</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <ProductImage
                                    src={preview}
                                    alt="Product preview"
                                    className="border"
                                />
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="flex-1"
                                        asChild
                                    >
                                        <label className="cursor-pointer">
                                            <ImagePlus />{' '}
                                            {preview ? 'Replace' : 'Upload'}
                                            <input
                                                type="file"
                                                accept="image/png,image/jpeg,image/webp"
                                                className="sr-only"
                                                onChange={(e) => {
                                                    form.setData((d) => ({
                                                        ...d,
                                                        image:
                                                            e.target
                                                                .files?.[0] ??
                                                            null,
                                                        remove_image: false,
                                                    }));
                                                }}
                                            />
                                        </label>
                                    </Button>
                                    {preview && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            aria-label="Remove photo"
                                            onClick={() => {
                                                form.setData((d) => ({
                                                    ...d,
                                                    image: null,
                                                    remove_image: true,
                                                }));
                                                setPreview(null);
                                            }}
                                        >
                                            <Trash2 />
                                        </Button>
                                    )}
                                </div>
                                <InputError message={form.errors.image} />
                                <p className="text-xs text-muted-foreground">
                                    Square JPG, PNG or WebP up to 4 MB looks
                                    best.
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Visibility</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <ToggleRow
                                    id="is_active"
                                    label="Show in shop"
                                    description="Hidden products stay in inventory and POS."
                                    checked={form.data.is_active}
                                    onChange={(v) =>
                                        form.setData('is_active', v)
                                    }
                                />
                                <ToggleRow
                                    id="is_featured"
                                    label="Feature on home page"
                                    description="Shown first with a “Best seller” tag."
                                    checked={form.data.is_featured}
                                    onChange={(v) =>
                                        form.setData('is_featured', v)
                                    }
                                />
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </form>
        </>
    );
}

function ToggleRow({
    id,
    label,
    description,
    checked,
    onChange,
}: {
    id: string;
    label: string;
    description: string;
    checked: boolean;
    onChange: (v: boolean) => void;
}) {
    return (
        <div className="flex items-start justify-between gap-4">
            <div>
                <Label htmlFor={id}>{label}</Label>
                <p className="text-xs text-muted-foreground">{description}</p>
            </div>
            <Switch id={id} checked={checked} onCheckedChange={onChange} />
        </div>
    );
}

ProductForm.layout = (props: Props) => ({
    breadcrumbs: [
        { title: 'Products', href: index() },
        props.product
            ? {
                  title: `Edit ${props.product.name}`,
                  href: update.url(props.product.id),
              }
            : { title: 'New product', href: index() },
    ],
});
