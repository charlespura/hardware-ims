import { usePage } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import { cn } from '@/lib/utils';

export default function AppLogo({ className }: { className?: string }) {
    const { name } = usePage().props;
    const [brand, ...rest] = name.split(' ');

    return (
        <span className={cn('flex items-center gap-2', className)}>
            <span className="flex aspect-square size-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <AppLogoIcon className="size-5" />
            </span>
            <span className="truncate text-base leading-tight font-semibold tracking-tight">
                {brand}
                {rest.length > 0 && (
                    <span className="ml-1 font-normal text-muted-foreground">
                        {rest.join(' ')}
                    </span>
                )}
            </span>
        </span>
    );
}
