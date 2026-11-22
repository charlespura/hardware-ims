import { router } from '@inertiajs/react';
import { useCallback } from 'react';

type FilterValue = string | number | boolean | null | undefined;

/**
 * Push a page's filter state into the query string (and reload its props)
 * while keeping scroll position and component state.
 */
export function useFilters<T extends Record<string, FilterValue>>(
    url: string,
    current: T,
    only?: string[],
) {
    return useCallback(
        (changes: Partial<T>, { resetPage = true } = {}) => {
            const next: Record<string, FilterValue> = {
                ...current,
                ...changes,
            };

            if (resetPage) {
                delete next.page;
            }

            const query = Object.fromEntries(
                Object.entries(next).filter(
                    ([, v]) =>
                        v !== '' &&
                        v !== null &&
                        v !== undefined &&
                        v !== false,
                ),
            ) as Record<string, string | number | boolean>;

            router.get(url, query, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                only,
            });
        },
        [url, current, only],
    );
}
