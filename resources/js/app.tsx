import { createInertiaApp } from '@inertiajs/react';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { initializeTheme } from '@/hooks/use-appearance';
import AccountLayout from '@/layouts/account-layout';
import AppLayout from '@/layouts/app-layout';
import AuthLayout from '@/layouts/auth-layout';
import SettingsLayout from '@/layouts/settings/layout';
import ShopLayout from '@/layouts/shop-layout';

const appName = import.meta.env.VITE_APP_NAME || 'HardwareHub IMS';

/** Pages that render without any app chrome. */
const BARE_PAGES = ['error', 'orders/receipt'];

/** Customer-facing pages that use the storefront header + footer. */
const SHOP_PREFIXES = ['home', 'shop/', 'cart/', 'checkout/', 'orders/'];

void createInertiaApp({
    title: (title) => (title ? `${title} · ${appName}` : appName),
    layout: (name) => {
        switch (true) {
            case BARE_PAGES.includes(name):
                return null;
            case name.startsWith('auth/'):
                return AuthLayout;
            case name.startsWith('settings/'):
                return [AccountLayout, SettingsLayout];
            case name.startsWith('admin/'):
                return AppLayout;
            case SHOP_PREFIXES.some((prefix) => name.startsWith(prefix)):
                return ShopLayout;
            default:
                return AppLayout;
        }
    },
    strictMode: true,
    withApp(app) {
        return (
            <TooltipProvider delayDuration={0}>
                {app}
                <Toaster />
            </TooltipProvider>
        );
    },
    progress: {
        color: '#ea6a1b',
    },
});

// This will set light / dark mode on load...
initializeTheme();
