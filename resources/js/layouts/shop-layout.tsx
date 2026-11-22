import type { ReactNode } from 'react';
import { ShopFooter } from '@/components/shop/shop-footer';
import { ShopHeader } from '@/components/shop/shop-header';

export default function ShopLayout({ children }: { children: ReactNode }) {
    return (
        <div className="flex min-h-svh flex-col bg-background">
            <ShopHeader />
            <main className="flex-1">{children}</main>
            <ShopFooter />
        </div>
    );
}

/** Standard page container used by storefront pages. */
export function ShopContainer({
    children,
    className = '',
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <div
            className={`mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 ${className}`}
        >
            {children}
        </div>
    );
}
