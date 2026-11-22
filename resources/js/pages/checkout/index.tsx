import { Head, Link, useForm } from '@inertiajs/react';
import {
    Banknote,
    Building2,
    CalendarDays,
    Lock,
    MapPin,
    Plus,
    Smartphone,
    Store,
    Truck,
    Upload,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { AddressFormDialog } from '@/components/address-form-dialog';
import { ChoiceCard } from '@/components/choice-card';
import InputError from '@/components/input-error';
import { OrderTotals } from '@/components/orders/order-totals';
import { ProductImage } from '@/components/product-image';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup } from '@/components/ui/radio-group';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { ShopContainer } from '@/layouts/shop-layout';
import { formatMoney } from '@/lib/format';
import { index as cart } from '@/routes/cart';
import { store } from '@/routes/checkout';
import type { Address, Fulfillment, PaymentAccount, Quote } from '@/types';

type Props = {
    items: {
        id: number;
        quantity: number;
        name: string;
        price: string;
        unit: string;
        image_url: string | null;
    }[];
    quotes: Record<Fulfillment, Quote>;
    addresses: Address[];
    paymentAccounts: Record<'gcash' | 'bank_transfer', PaymentAccount>;
    scheduleWindow: { min: string; max: string };
};

type Form = {
    fulfillment: Fulfillment;
    address_id: number | null;
    preferred_date: string;
    notes: string;
    payment_method: 'cod' | 'gcash' | 'bank_transfer';
    payment_reference: string;
    payment_proof: File | null;
};

export default function Checkout({
    items,
    quotes,
    addresses,
    paymentAccounts,
    scheduleWindow,
}: Props) {
    const form = useForm<Form>({
        fulfillment: 'delivery',
        address_id:
            addresses.find((a) => a.is_default)?.id ?? addresses[0]?.id ?? null,
        preferred_date: scheduleWindow.min,
        notes: '',
        payment_method: 'cod',
        payment_reference: '',
        payment_proof: null,
    });

    const quote = quotes[form.data.fulfillment];
    const needsProof = form.data.payment_method !== 'cod';
    const account = needsProof
        ? paymentAccounts[form.data.payment_method as 'gcash' | 'bank_transfer']
        : null;

    const errors = form.errors as Record<string, string | undefined>;
    const blockingError = errors.stock ?? errors.cart ?? errors.voucher_code;

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post(store.url(), { forceFormData: true, preserveScroll: true });
    };

    return (
        <ShopContainer>
            <Head title="Checkout" />
            <div className="mb-6 flex items-center justify-between gap-4">
                <h1 className="text-2xl font-semibold tracking-tight">
                    Checkout
                </h1>
                <Link
                    href={cart()}
                    className="text-sm text-muted-foreground hover:text-foreground"
                >
                    ← Back to cart
                </Link>
            </div>

            {blockingError && (
                <Alert variant="destructive" className="mb-6">
                    <AlertDescription>
                        {blockingError}{' '}
                        <Link href={cart()} className="font-medium underline">
                            Review your cart
                        </Link>
                    </AlertDescription>
                </Alert>
            )}

            <form
                onSubmit={submit}
                className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]"
            >
                <div className="space-y-6">
                    <Step number={1} title="How do you want to receive it?">
                        <RadioGroup
                            value={form.data.fulfillment}
                            onValueChange={(v) =>
                                form.setData('fulfillment', v as Fulfillment)
                            }
                            className="grid gap-3 sm:grid-cols-2"
                        >
                            <ChoiceCard
                                id="f-delivery"
                                value="delivery"
                                checked={form.data.fulfillment === 'delivery'}
                                icon={<Truck className="size-5" />}
                                title="Home delivery"
                                description="Delivered to your address on your chosen date."
                                aside={
                                    quotes.delivery.shipping_fee > 0
                                        ? formatMoney(
                                              quotes.delivery.shipping_fee,
                                          )
                                        : 'Free'
                                }
                            />
                            <ChoiceCard
                                id="f-pickup"
                                value="pickup"
                                checked={form.data.fulfillment === 'pickup'}
                                icon={<Store className="size-5" />}
                                title="Store pickup"
                                description="We’ll tell you when it’s ready to collect."
                                aside="Free"
                            />
                        </RadioGroup>
                    </Step>

                    {form.data.fulfillment === 'delivery' && (
                        <Step number={2} title="Delivery address">
                            {addresses.length > 0 ? (
                                <RadioGroup
                                    value={String(form.data.address_id ?? '')}
                                    onValueChange={(v) =>
                                        form.setData('address_id', Number(v))
                                    }
                                    className="grid gap-3 sm:grid-cols-2"
                                >
                                    {addresses.map((a) => (
                                        <ChoiceCard
                                            key={a.id}
                                            id={`addr-${a.id}`}
                                            value={String(a.id)}
                                            checked={
                                                form.data.address_id === a.id
                                            }
                                            icon={<MapPin className="size-5" />}
                                            title={
                                                <>
                                                    {a.label}
                                                    {a.is_default && (
                                                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                                                            Default
                                                        </span>
                                                    )}
                                                </>
                                            }
                                            description={
                                                <>
                                                    {a.recipient_name} ·{' '}
                                                    {a.phone}
                                                    <br />
                                                    {[
                                                        a.street,
                                                        a.barangay,
                                                        a.city,
                                                        a.province,
                                                    ]
                                                        .filter(Boolean)
                                                        .join(', ')}
                                                </>
                                            }
                                        />
                                    ))}
                                </RadioGroup>
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    You don’t have a saved address yet.
                                </p>
                            )}
                            <InputError
                                message={form.errors.address_id}
                                className="mt-2"
                            />
                            <AddressFormDialog
                                trigger={
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="mt-3"
                                    >
                                        <Plus /> Add new address
                                    </Button>
                                }
                            />
                        </Step>
                    )}

                    <Step
                        number={form.data.fulfillment === 'delivery' ? 3 : 2}
                        title="Schedule & notes"
                    >
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="grid gap-1.5">
                                <Label
                                    htmlFor="preferred_date"
                                    className="flex items-center gap-1.5"
                                >
                                    <CalendarDays className="size-4 text-muted-foreground" />
                                    Preferred{' '}
                                    {form.data.fulfillment === 'delivery'
                                        ? 'delivery'
                                        : 'pickup'}{' '}
                                    date
                                </Label>
                                <Input
                                    id="preferred_date"
                                    type="date"
                                    min={scheduleWindow.min}
                                    max={scheduleWindow.max}
                                    value={form.data.preferred_date}
                                    onChange={(e) =>
                                        form.setData(
                                            'preferred_date',
                                            e.target.value,
                                        )
                                    }
                                />
                                <InputError
                                    message={form.errors.preferred_date}
                                />
                            </div>
                            <div className="grid gap-1.5 sm:col-span-2">
                                <Label htmlFor="notes">
                                    Notes for the store (optional)
                                </Label>
                                <Textarea
                                    id="notes"
                                    placeholder="Landmarks, gate code, preferred time…"
                                    value={form.data.notes}
                                    onChange={(e) =>
                                        form.setData('notes', e.target.value)
                                    }
                                />
                                <InputError message={form.errors.notes} />
                            </div>
                        </div>
                    </Step>

                    <Step
                        number={form.data.fulfillment === 'delivery' ? 4 : 3}
                        title="Payment"
                    >
                        <RadioGroup
                            value={form.data.payment_method}
                            onValueChange={(v) =>
                                form.setData(
                                    'payment_method',
                                    v as Form['payment_method'],
                                )
                            }
                            className="grid gap-3"
                        >
                            <ChoiceCard
                                id="pm-cod"
                                value="cod"
                                checked={form.data.payment_method === 'cod'}
                                icon={<Banknote className="size-5" />}
                                title={
                                    form.data.fulfillment === 'delivery'
                                        ? 'Cash on delivery'
                                        : 'Pay at the store'
                                }
                                description="Pay in cash when you receive your items."
                            />
                            <ChoiceCard
                                id="pm-gcash"
                                value="gcash"
                                checked={form.data.payment_method === 'gcash'}
                                icon={<Smartphone className="size-5" />}
                                title="GCash"
                                description="Send to our GCash number, then upload the receipt."
                            />
                            <ChoiceCard
                                id="pm-bank"
                                value="bank_transfer"
                                checked={
                                    form.data.payment_method === 'bank_transfer'
                                }
                                icon={<Building2 className="size-5" />}
                                title="Bank transfer"
                                description="Transfer to our bank account, then upload the deposit slip."
                            />
                        </RadioGroup>
                        <InputError
                            message={form.errors.payment_method}
                            className="mt-2"
                        />

                        {account && (
                            <div className="mt-4 space-y-4 rounded-xl border bg-muted/30 p-4">
                                <div className="grid gap-1 text-sm">
                                    <span className="text-muted-foreground">
                                        Send exactly{' '}
                                        <strong className="text-foreground">
                                            {formatMoney(quote.total)}
                                        </strong>{' '}
                                        to:
                                    </span>
                                    <span className="font-medium">
                                        {account.label} · {account.account_name}
                                    </span>
                                    <span className="font-mono text-base tracking-wide">
                                        {account.account_number}
                                    </span>
                                </div>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="payment_reference">
                                            Reference number
                                        </Label>
                                        <Input
                                            id="payment_reference"
                                            value={form.data.payment_reference}
                                            onChange={(e) =>
                                                form.setData(
                                                    'payment_reference',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="e.g. 1234 567 890"
                                        />
                                        <InputError
                                            message={
                                                form.errors.payment_reference
                                            }
                                        />
                                    </div>
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="payment_proof">
                                            Receipt screenshot
                                        </Label>
                                        <Input
                                            id="payment_proof"
                                            type="file"
                                            accept="image/png,image/jpeg,image/webp"
                                            onChange={(e) =>
                                                form.setData(
                                                    'payment_proof',
                                                    e.target.files?.[0] ?? null,
                                                )
                                            }
                                        />
                                        <InputError
                                            message={form.errors.payment_proof}
                                        />
                                    </div>
                                </div>
                                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <Upload className="size-3.5" /> You can also
                                    pay and upload later from your order page.
                                    We confirm the order once payment is
                                    verified.
                                </p>
                            </div>
                        )}
                    </Step>
                </div>

                <div>
                    <Card className="lg:sticky lg:top-24">
                        <CardHeader>
                            <CardTitle>Your order</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            <ul className="max-h-72 space-y-3 overflow-y-auto pr-1">
                                {items.map((item) => (
                                    <li
                                        key={item.id}
                                        className="flex items-center gap-3"
                                    >
                                        <div className="relative w-12 shrink-0">
                                            <ProductImage
                                                src={item.image_url}
                                                alt={item.name}
                                            />
                                            <span className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-foreground text-[10px] font-semibold text-background">
                                                {item.quantity}
                                            </span>
                                        </div>
                                        <span className="line-clamp-2 flex-1 text-sm">
                                            {item.name}
                                        </span>
                                        <span className="text-sm tabular-nums">
                                            {formatMoney(
                                                Number(item.price) *
                                                    item.quantity,
                                            )}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                            <OrderTotals
                                subtotal={quote.subtotal}
                                discount={quote.discount}
                                shippingFee={quote.shipping_fee}
                                total={quote.total}
                                voucherCode={quote.voucher?.code}
                                showShipping={
                                    form.data.fulfillment === 'delivery'
                                }
                            />
                            {quote.voucher_error && (
                                <p className="text-xs text-amber-700 dark:text-amber-400">
                                    {quote.voucher_error}
                                </p>
                            )}
                            <Button
                                type="submit"
                                size="lg"
                                className="w-full"
                                disabled={form.processing}
                            >
                                {form.processing ? <Spinner /> : <Lock />} Place
                                order · {formatMoney(quote.total)}
                            </Button>
                            <p className="text-center text-xs text-muted-foreground">
                                Items are reserved for you as soon as you place
                                the order.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </form>
        </ShopContainer>
    );
}

function Step({
    number,
    title,
    children,
}: {
    number: number;
    title: string;
    children: ReactNode;
}) {
    return (
        <section className="rounded-xl border p-5">
            <h2 className="mb-4 flex items-center gap-3 font-medium">
                <span className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                    {number}
                </span>
                {title}
            </h2>
            {children}
        </section>
    );
}
