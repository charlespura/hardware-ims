import { router } from '@inertiajs/react';
import { useEffect } from 'react';
import { toast } from 'sonner';
import type { FlashToast } from '@/types/ui';

/**
 * Validation errors that aren't tied to a visible form field — business
 * rules such as stock limits or order workflow — are shown as toasts.
 */
const WORKFLOW_ERROR_KEYS = ['stock', 'status', 'payment', 'cart', 'quantity'];

export function useFlashToast(): void {
    useEffect(() => {
        const offFlash = router.on('flash', (event) => {
            const flash = (event as CustomEvent).detail?.flash;
            const data = flash?.toast as FlashToast | undefined;

            if (!data) {
                return;
            }

            toast[data.type](data.message);
        });

        const offError = router.on('error', (event) => {
            const errors = (event as CustomEvent).detail?.errors as
                | Record<string, string>
                | undefined;

            WORKFLOW_ERROR_KEYS.forEach((key) => {
                if (errors?.[key]) {
                    toast.error(errors[key]);
                }
            });
        });

        return () => {
            offFlash();
            offError();
        };
    }, []);
}
