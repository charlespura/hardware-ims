import type { Auth } from '@/types/auth';
import type { StoreInfo } from '@/types/models';

declare module 'react' {
    interface InputHTMLAttributes<T> {
        passwordrules?: string;
    }
}

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            name: string;
            auth: Auth;
            store: StoreInfo;
            cartCount: number;
            adminBadges: {
                pendingOrders: number;
                paymentsToVerify: number;
                lowStock: number;
            } | null;
            sidebarOpen: boolean;
            [key: string]: unknown;
        };
    }
}
