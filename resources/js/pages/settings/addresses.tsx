import { Head, router } from '@inertiajs/react';
import { MapPin, Pencil, Plus, Star, Trash2 } from 'lucide-react';
import { AddressFormDialog } from '@/components/address-form-dialog';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { EmptyState } from '@/components/empty-state';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { destroy, index, makeDefault } from '@/routes/addresses';
import type { Address } from '@/types';

export default function Addresses({ addresses }: { addresses: Address[] }) {
    return (
        <>
            <Head title="Addresses" />
            <div className="space-y-6">
                <div className="flex items-start justify-between gap-4">
                    <Heading
                        variant="small"
                        title="Delivery addresses"
                        description="Saved addresses appear at checkout."
                    />
                    <AddressFormDialog
                        trigger={
                            <Button size="sm">
                                <Plus /> Add address
                            </Button>
                        }
                    />
                </div>

                {addresses.length === 0 ? (
                    <EmptyState
                        icon={MapPin}
                        title="No saved addresses"
                        description="Add one now to speed up checkout."
                    />
                ) : (
                    <ul className="space-y-3">
                        {addresses.map((a) => (
                            <li
                                key={a.id}
                                className="flex items-start justify-between gap-4 rounded-xl border p-4"
                            >
                                <div className="text-sm">
                                    <p className="flex items-center gap-2 font-medium">
                                        {a.label}
                                        {a.is_default && (
                                            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                                                Default
                                            </span>
                                        )}
                                    </p>
                                    <p className="text-muted-foreground">
                                        {a.recipient_name} · {a.phone}
                                    </p>
                                    <p className="text-muted-foreground">
                                        {[
                                            a.street,
                                            a.barangay,
                                            a.city,
                                            a.province,
                                            a.postal_code,
                                        ]
                                            .filter(Boolean)
                                            .join(', ')}
                                    </p>
                                </div>
                                <div className="flex shrink-0 gap-1">
                                    {!a.is_default && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            aria-label="Make default"
                                            title="Make default"
                                            onClick={() =>
                                                router.post(
                                                    makeDefault.url(a.id),
                                                    {},
                                                    { preserveScroll: true },
                                                )
                                            }
                                        >
                                            <Star />
                                        </Button>
                                    )}
                                    <AddressFormDialog
                                        address={a}
                                        trigger={
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                aria-label="Edit address"
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
                                                aria-label="Delete address"
                                                className="text-destructive"
                                            >
                                                <Trash2 />
                                            </Button>
                                        }
                                        title="Delete this address?"
                                        description={`“${a.label}” will be removed from your address book.`}
                                        confirmLabel="Delete"
                                        destructive
                                        onConfirm={() =>
                                            router.delete(destroy.url(a.id), {
                                                preserveScroll: true,
                                            })
                                        }
                                    />
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </>
    );
}

Addresses.layout = {
    breadcrumbs: [{ title: 'Addresses', href: index() }],
};
