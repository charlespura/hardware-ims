import { usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import AppLayout from '@/layouts/app-layout';
import ShopLayout, { ShopContainer } from '@/layouts/shop-layout';
import type { BreadcrumbItem } from '@/types';

/**
 * Settings pages live inside the back office for staff and inside the
 * storefront for customers, so each role keeps its own navigation.
 */
export default function AccountLayout({
    children,
    breadcrumbs = [],
}: {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
}) {
    const { auth } = usePage().props;

    if (auth.user && auth.user.role !== 'customer') {
        return <AppLayout breadcrumbs={breadcrumbs}>{children}</AppLayout>;
    }

    return (
        <ShopLayout>
            <ShopContainer className="py-4">{children}</ShopContainer>
        </ShopLayout>
    );
}
