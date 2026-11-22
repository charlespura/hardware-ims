import { Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

/**
 * Text input that reports its value after the user stops typing.
 */
export function SearchInput({
    value,
    onSearch,
    placeholder = 'Search…',
    delay = 350,
    className,
}: {
    value: string;
    onSearch: (value: string) => void;
    placeholder?: string;
    delay?: number;
    className?: string;
}) {
    const [term, setTerm] = useState(value);
    const first = useRef(true);
    const latest = useRef(onSearch);
    latest.current = onSearch;

    useEffect(() => {
        if (first.current) {
            first.current = false;

            return;
        }

        const id = setTimeout(() => latest.current(term), delay);

        return () => clearTimeout(id);
    }, [term, delay]);

    return (
        <div className={cn('relative', className)}>
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
                type="search"
                value={term}
                placeholder={placeholder}
                onChange={(e) => setTerm(e.target.value)}
                className="pr-8 pl-9 [&::-webkit-search-cancel-button]:hidden"
                aria-label={placeholder}
            />
            {term && (
                <button
                    type="button"
                    onClick={() => setTerm('')}
                    className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
                    aria-label="Clear search"
                >
                    <X className="size-4" />
                </button>
            )}
        </div>
    );
}
