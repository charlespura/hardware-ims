import { Link } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Paginated } from '@/types';

export function Pagination({
    meta,
    className,
}: {
    meta: Paginated<unknown>;
    className?: string;
}) {
    if (meta.last_page <= 1) {
        return null;
    }

    const pages = meta.links.slice(1, -1);

    return (
        <nav
            aria-label="Pagination"
            className={cn(
                'flex flex-col items-center justify-between gap-3 sm:flex-row',
                className,
            )}
        >
            <p className="text-sm text-muted-foreground">
                Showing <span className="font-medium">{meta.from}</span>–
                <span className="font-medium">{meta.to}</span> of{' '}
                <span className="font-medium">{meta.total}</span>
            </p>
            <div className="flex items-center gap-1">
                <PageLink url={meta.prev_page_url} label="Previous">
                    <ChevronLeft className="size-4" />
                </PageLink>
                {pages.map((link, i) =>
                    link.url ? (
                        <PageLink
                            key={i}
                            url={link.url}
                            active={link.active}
                            label={`Page ${link.label}`}
                        >
                            {link.label}
                        </PageLink>
                    ) : (
                        <span
                            key={i}
                            className="px-2 text-sm text-muted-foreground"
                        >
                            …
                        </span>
                    ),
                )}
                <PageLink url={meta.next_page_url} label="Next">
                    <ChevronRight className="size-4" />
                </PageLink>
            </div>
        </nav>
    );
}

function PageLink({
    url,
    active = false,
    label,
    children,
}: {
    url: string | null;
    active?: boolean;
    label: string;
    children: React.ReactNode;
}) {
    const classes = cn(
        'inline-flex h-8 min-w-8 items-center justify-center rounded-md border px-2 text-sm tabular-nums transition-colors',
        active
            ? 'border-primary bg-primary text-primary-foreground'
            : 'bg-background hover:bg-accent',
        !url && 'pointer-events-none opacity-40',
    );

    if (!url) {
        return (
            <span className={classes} aria-disabled>
                {children}
            </span>
        );
    }

    return (
        <Link
            href={url}
            preserveScroll
            preserveState
            className={classes}
            aria-label={label}
            aria-current={active ? 'page' : undefined}
        >
            {children}
        </Link>
    );
}
