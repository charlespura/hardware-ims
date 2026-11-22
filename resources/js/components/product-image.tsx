import { Package } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ProductImage({
    src,
    alt,
    className,
    iconClassName,
}: {
    src: string | null | undefined;
    alt: string;
    className?: string;
    iconClassName?: string;
}) {
    return (
        <div
            className={cn(
                'relative flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-muted',
                className,
            )}
        >
            {src ? (
                <img
                    src={src}
                    alt={alt}
                    loading="lazy"
                    className="size-full object-cover"
                />
            ) : (
                <Package
                    className={cn(
                        'size-1/3 text-muted-foreground/50',
                        iconClassName,
                    )}
                    aria-hidden
                />
            )}
        </div>
    );
}
