import { useForm } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Spinner } from '@/components/ui/spinner';
import { store, update } from '@/routes/addresses';
import type { Address } from '@/types';

export function AddressFormDialog({
    address,
    trigger,
    onSaved,
}: {
    address?: Address;
    trigger: ReactNode;
    onSaved?: () => void;
}) {
    const [open, setOpen] = useState(false);
    const form = useForm({
        label: address?.label ?? 'Home',
        recipient_name: address?.recipient_name ?? '',
        phone: address?.phone ?? '',
        street: address?.street ?? '',
        barangay: address?.barangay ?? '',
        city: address?.city ?? '',
        province: address?.province ?? 'Metro Manila',
        postal_code: address?.postal_code ?? '',
        is_default: address?.is_default ?? false,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        // The dialog is portalled, but React still bubbles the submit event to
        // any parent <form> (e.g. checkout) — don't let it submit that too.
        e.stopPropagation();
        const options = {
            preserveScroll: true,
            onSuccess: () => {
                setOpen(false);
                if (!address) form.reset();
                onSaved?.();
            },
        };

        if (address) {
            form.put(update.url(address.id), options);
        } else {
            form.post(store.url(), options);
        }
    };

    const field = (
        name: Exclude<keyof typeof form.data, 'is_default'>,
        label: string,
        props: React.ComponentProps<typeof Input> = {},
    ) => (
        <div className="grid gap-1.5">
            <Label htmlFor={`addr-${name}`}>{label}</Label>
            <Input
                id={`addr-${name}`}
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
                <form onSubmit={submit} className="space-y-5">
                    <DialogHeader>
                        <DialogTitle>
                            {address ? 'Edit address' : 'New delivery address'}
                        </DialogTitle>
                        <DialogDescription>
                            We deliver within Metro Manila and nearby provinces.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 sm:grid-cols-2">
                        {field('label', 'Label', {
                            placeholder: 'Home, Office, Site…',
                        })}
                        {field('recipient_name', 'Recipient name', {
                            autoComplete: 'name',
                        })}
                        {field('phone', 'Mobile number', {
                            placeholder: '09171234567',
                            inputMode: 'tel',
                            autoComplete: 'tel',
                        })}
                        {field('postal_code', 'Postal code', {
                            inputMode: 'numeric',
                            autoComplete: 'postal-code',
                        })}
                        <div className="sm:col-span-2">
                            {field('street', 'House no. / street', {
                                autoComplete: 'address-line1',
                            })}
                        </div>
                        {field('barangay', 'Barangay')}
                        {field('city', 'City / municipality', {
                            autoComplete: 'address-level2',
                        })}
                        <div className="sm:col-span-2">
                            {field('province', 'Province', {
                                autoComplete: 'address-level1',
                            })}
                        </div>
                    </div>
                    <label className="flex items-center gap-2 text-sm">
                        <Checkbox
                            checked={form.data.is_default}
                            onCheckedChange={(v) =>
                                form.setData('is_default', v === true)
                            }
                        />
                        Use as my default address
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
                            {form.processing && <Spinner />} Save address
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
