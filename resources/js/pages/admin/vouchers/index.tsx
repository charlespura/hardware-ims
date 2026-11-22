import { Head, router, useForm } from '@inertiajs/react';
import { Pencil, Plus, TicketPercent, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { EmptyState } from '@/components/empty-state';
import InputError from '@/components/input-error';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { formatDate } from '@/lib/format';
import { voucherTypeLabel } from '@/lib/labels';
import { destroy, index, store, update } from '@/routes/admin/vouchers';
import type { Voucher, VoucherType } from '@/types';

const voucherState = (v: Voucher) => {
    const now = Date.now();

    if (!v.is_active) return { tone: 'neutral' as const, label: 'Inactive' };
    if (v.expires_at && new Date(v.expires_at).getTime() < now)
        return { tone: 'danger' as const, label: 'Expired' };
    if (v.starts_at && new Date(v.starts_at).getTime() > now)
        return { tone: 'info' as const, label: 'Scheduled' };
    if (v.usage_limit !== null && v.times_used >= v.usage_limit)
        return { tone: 'warning' as const, label: 'Used up' };

    return { tone: 'success' as const, label: 'Live' };
};

export default function Vouchers({ vouchers }: { vouchers: Voucher[] }) {
    return (
        <>
            <Head title="Vouchers" />
            <div className="space-y-5 p-4 md:p-6">
                <PageHeader
                    title="Vouchers"
                    description="Discount codes customers can apply in their cart. Each customer can use a code once."
                    actions={
                        <VoucherDialog
                            trigger={
                                <Button>
                                    <Plus /> New voucher
                                </Button>
                            }
                        />
                    }
                />
                <Card className="py-0">
                    {vouchers.length === 0 ? (
                        <EmptyState
                            icon={TicketPercent}
                            title="No vouchers yet"
                            className="m-4 border-0"
                        />
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="pl-4">Code</TableHead>
                                    <TableHead>Offer</TableHead>
                                    <TableHead>Valid</TableHead>
                                    <TableHead className="text-right">
                                        Redeemed
                                    </TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="w-24 pr-4" />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {vouchers.map((v) => {
                                    const state = voucherState(v);

                                    return (
                                        <TableRow key={v.id}>
                                            <TableCell className="pl-4">
                                                <span className="rounded-md border border-dashed px-2 py-0.5 font-mono font-semibold">
                                                    {v.code}
                                                </span>
                                                {v.description && (
                                                    <div className="mt-1 text-xs text-muted-foreground">
                                                        {v.description}
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell>{v.summary}</TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {v.starts_at || v.expires_at
                                                    ? `${v.starts_at ? formatDate(v.starts_at) : 'Now'} – ${v.expires_at ? formatDate(v.expires_at) : 'no end'}`
                                                    : 'Always'}
                                            </TableCell>
                                            <TableCell className="text-right tabular-nums">
                                                {v.times_used}
                                                {v.usage_limit !== null &&
                                                    ` / ${v.usage_limit}`}
                                            </TableCell>
                                            <TableCell>
                                                <StatusBadge tone={state.tone}>
                                                    {state.label}
                                                </StatusBadge>
                                            </TableCell>
                                            <TableCell className="pr-4">
                                                <div className="flex justify-end gap-1">
                                                    <VoucherDialog
                                                        voucher={v}
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
                                                        title={`Delete ${v.code}?`}
                                                        description="Vouchers that were already used are deactivated instead."
                                                        confirmLabel="Delete"
                                                        destructive
                                                        onConfirm={() =>
                                                            router.delete(
                                                                destroy.url(
                                                                    v.id,
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
                                    );
                                })}
                            </TableBody>
                        </Table>
                    )}
                </Card>
            </div>
        </>
    );
}

function VoucherDialog({
    voucher,
    trigger,
}: {
    voucher?: Voucher;
    trigger: React.ReactNode;
}) {
    const [open, setOpen] = useState(false);
    const form = useForm({
        code: voucher?.code ?? '',
        description: voucher?.description ?? '',
        type: (voucher?.type ?? 'percentage') as VoucherType,
        value: voucher ? String(Number(voucher.value)) : '',
        min_spend: voucher ? String(Number(voucher.min_spend)) : '0',
        max_discount: voucher?.max_discount
            ? String(Number(voucher.max_discount))
            : '',
        usage_limit: voucher?.usage_limit ? String(voucher.usage_limit) : '',
        starts_at: voucher?.starts_at?.slice(0, 10) ?? '',
        expires_at: voucher?.expires_at?.slice(0, 10) ?? '',
        is_active: voucher?.is_active ?? true,
    });

    const field = (
        name:
            | 'code'
            | 'description'
            | 'value'
            | 'min_spend'
            | 'max_discount'
            | 'usage_limit'
            | 'starts_at'
            | 'expires_at',
        label: string,
        props: React.ComponentProps<typeof Input> = {},
    ) => (
        <div className="grid gap-1.5">
            <Label htmlFor={`v-${name}`}>{label}</Label>
            <Input
                id={`v-${name}`}
                value={form.data[name]}
                onChange={(e) => form.setData(name, e.target.value)}
                aria-invalid={!!form.errors[name]}
                {...props}
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
                                if (!voucher) form.reset();
                            },
                        };
                        if (voucher) form.put(update.url(voucher.id), options);
                        else form.post(store.url(), options);
                    }}
                >
                    <DialogHeader>
                        <DialogTitle>
                            {voucher ? `Edit ${voucher.code}` : 'New voucher'}
                        </DialogTitle>
                        <DialogDescription>
                            Codes are case-insensitive and saved in upper case.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 sm:grid-cols-2">
                        {field('code', 'Code', {
                            className: 'font-mono uppercase',
                            placeholder: 'SUMMER15',
                        })}
                        <div className="grid gap-1.5">
                            <Label>Type</Label>
                            <Select
                                value={form.data.type}
                                onValueChange={(v) =>
                                    form.setData('type', v as VoucherType)
                                }
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {(
                                        Object.keys(
                                            voucherTypeLabel,
                                        ) as VoucherType[]
                                    ).map((t) => (
                                        <SelectItem key={t} value={t}>
                                            {voucherTypeLabel[t]}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="sm:col-span-2">
                            {field('description', 'Description (internal)')}
                        </div>
                        {form.data.type !== 'free_shipping' &&
                            field(
                                'value',
                                form.data.type === 'percentage'
                                    ? 'Percent off'
                                    : 'Amount off (₱)',
                                { inputMode: 'decimal' },
                            )}
                        {form.data.type === 'percentage' &&
                            field(
                                'max_discount',
                                'Max discount (₱, optional)',
                                { inputMode: 'decimal' },
                            )}
                        {field('min_spend', 'Minimum spend (₱)', {
                            inputMode: 'decimal',
                        })}
                        {field(
                            'usage_limit',
                            'Total uses (blank = unlimited)',
                            { inputMode: 'numeric' },
                        )}
                        {field('starts_at', 'Starts', { type: 'date' })}
                        {field('expires_at', 'Expires', { type: 'date' })}
                    </div>
                    <label className="flex items-center justify-between text-sm">
                        Active
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
                            Save voucher
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

Vouchers.layout = { breadcrumbs: [{ title: 'Vouchers', href: index() }] };
