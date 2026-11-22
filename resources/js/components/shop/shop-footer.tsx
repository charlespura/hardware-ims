import { Link, usePage } from '@inertiajs/react';
import { Clock, Mail, MapPin, Phone } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { formatMoney } from '@/lib/format';
import { index as shop } from '@/routes/shop';

export function ShopFooter() {
    const { store } = usePage().props;

    return (
        <footer className="mt-16 border-t bg-muted/30">
            <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-4">
                <div className="space-y-3 md:col-span-2">
                    <AppLogo />
                    <p className="max-w-sm text-sm text-muted-foreground">
                        {store.tagline}
                    </p>
                    <p className="text-sm text-muted-foreground">
                        Free delivery on orders over{' '}
                        <span className="font-medium text-foreground">
                            {formatMoney(store.free_shipping_threshold)}
                        </span>
                        . Otherwise a flat {formatMoney(store.shipping_fee)}{' '}
                        within Metro Manila.
                    </p>
                </div>
                <div className="space-y-3 text-sm">
                    <h3 className="font-medium">Visit us</h3>
                    <p className="flex gap-2 text-muted-foreground">
                        <MapPin className="mt-0.5 size-4 shrink-0" />
                        {store.address}
                    </p>
                    <p className="flex gap-2 text-muted-foreground">
                        <Clock className="mt-0.5 size-4 shrink-0" />
                        {store.business_hours}
                    </p>
                </div>
                <div className="space-y-3 text-sm">
                    <h3 className="font-medium">Contact</h3>
                    <p className="flex gap-2 text-muted-foreground">
                        <Phone className="mt-0.5 size-4 shrink-0" />
                        {store.phone}
                    </p>
                    <p className="flex gap-2 text-muted-foreground">
                        <Mail className="mt-0.5 size-4 shrink-0" />
                        {store.email}
                    </p>
                    <Link
                        href={shop()}
                        className="inline-block font-medium text-primary hover:underline"
                    >
                        Browse the catalog →
                    </Link>
                </div>
            </div>
            <div className="border-t">
                <p className="mx-auto max-w-7xl px-4 py-4 text-xs text-muted-foreground sm:px-6">
                    © {new Date().getFullYear()} {store.name}. We accept cash on
                    delivery, GCash and bank transfer.
                </p>
            </div>
        </footer>
    );
}
