import { Link, router, usePage } from '@inertiajs/react';
import {
    LayoutDashboard,
    LogOut,
    MapPin,
    Menu,
    Package,
    Search,
    Settings,
    ShoppingCart,
    Store,
} from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import AppLogo from '@/components/app-logo';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { useInitials } from '@/hooks/use-initials';
import { cn } from '@/lib/utils';
import { home, login, logout, register } from '@/routes';
import { dashboard as adminDashboard } from '@/routes/admin';
import { index as addresses } from '@/routes/addresses';
import { index as cart } from '@/routes/cart';
import { index as orders } from '@/routes/orders';
import { edit as profile } from '@/routes/profile';
import { index as shop } from '@/routes/shop';

export function ShopHeader() {
    const { auth, cartCount } = usePage().props;
    const user = auth.user;
    const isCustomer = !user || user.role === 'customer';
    const getInitials = useInitials();
    const { isCurrentOrParentUrl, currentUrl } = useCurrentUrl();
    const [term, setTerm] = useState(
        () =>
            new URLSearchParams(
                typeof window !== 'undefined' ? window.location.search : '',
            ).get('search') ?? '',
    );

    const submitSearch = (e: FormEvent) => {
        e.preventDefault();
        router.get(shop.url({ query: term ? { search: term } : {} }));
    };

    const links = [
        {
            title: 'Shop all',
            href: shop(),
            active: isCurrentOrParentUrl(shop()),
        },
        ...(user && isCustomer
            ? [
                  {
                      title: 'My orders',
                      href: orders(),
                      active: isCurrentOrParentUrl(orders()),
                  },
              ]
            : []),
    ];

    return (
        <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
            <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
                <Sheet>
                    <SheetTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="md:hidden"
                            aria-label="Open menu"
                        >
                            <Menu className="size-5" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-72">
                        <SheetHeader>
                            <SheetTitle asChild>
                                <AppLogo />
                            </SheetTitle>
                        </SheetHeader>
                        <nav className="flex flex-col gap-1 px-4">
                            {links.map((link) => (
                                <Link
                                    key={link.title}
                                    href={link.href}
                                    className={cn(
                                        'rounded-md px-3 py-2 text-sm font-medium hover:bg-accent',
                                        link.active && 'bg-accent',
                                    )}
                                >
                                    {link.title}
                                </Link>
                            ))}
                            {user && !isCustomer && (
                                <Link
                                    href={adminDashboard()}
                                    className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
                                >
                                    Back office
                                </Link>
                            )}
                        </nav>
                    </SheetContent>
                </Sheet>

                <Link href={home()} className="shrink-0" aria-label="Home">
                    <AppLogo />
                </Link>

                <nav className="ml-4 hidden items-center gap-1 md:flex">
                    {links.map((link) => (
                        <Link
                            key={link.title}
                            href={link.href}
                            className={cn(
                                'rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground',
                                link.active && 'text-foreground',
                            )}
                        >
                            {link.title}
                        </Link>
                    ))}
                </nav>

                <form
                    onSubmit={submitSearch}
                    className="relative ml-auto hidden w-full max-w-sm lg:block"
                    role="search"
                >
                    <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        type="search"
                        value={term}
                        onChange={(e) => setTerm(e.target.value)}
                        placeholder="Search tools, materials, SKUs…"
                        className="pl-9"
                        aria-label="Search products"
                    />
                </form>

                <div className="ml-auto flex items-center gap-1 lg:ml-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="lg:hidden"
                        asChild
                    >
                        <Link href={shop()} aria-label="Search products">
                            <Search className="size-5" />
                        </Link>
                    </Button>

                    {isCustomer && (
                        <Button
                            variant="ghost"
                            size="icon"
                            asChild
                            className={cn(
                                'relative',
                                currentUrl === cart.url() && 'bg-accent',
                            )}
                        >
                            <Link
                                href={user ? cart() : login()}
                                aria-label={`Cart, ${cartCount} items`}
                            >
                                <ShoppingCart className="size-5" />
                                {cartCount > 0 && (
                                    <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground tabular-nums">
                                        {cartCount > 99 ? '99+' : cartCount}
                                    </span>
                                )}
                            </Link>
                        </Button>
                    )}

                    {user ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    className="size-10 rounded-full p-1"
                                    aria-label="Account menu"
                                >
                                    <Avatar className="size-8">
                                        <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
                                            {getInitials(user.name)}
                                        </AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel className="font-normal">
                                    <div className="truncate text-sm font-medium">
                                        {user.name}
                                    </div>
                                    <div className="truncate text-xs text-muted-foreground">
                                        {user.email}
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {isCustomer ? (
                                    <>
                                        <MenuLink
                                            href={orders.url()}
                                            icon={Package}
                                        >
                                            My orders
                                        </MenuLink>
                                        <MenuLink
                                            href={addresses.url()}
                                            icon={MapPin}
                                        >
                                            Addresses
                                        </MenuLink>
                                    </>
                                ) : (
                                    <MenuLink
                                        href={adminDashboard.url()}
                                        icon={LayoutDashboard}
                                    >
                                        Back office
                                    </MenuLink>
                                )}
                                <MenuLink href={profile.url()} icon={Settings}>
                                    Settings
                                </MenuLink>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link
                                        href={logout()}
                                        as="button"
                                        className="w-full cursor-pointer"
                                        onClick={() => router.flushAll()}
                                    >
                                        <LogOut />
                                        Log out
                                    </Link>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" asChild>
                                <Link href={login()}>Log in</Link>
                            </Button>
                            <Button
                                size="sm"
                                asChild
                                className="hidden sm:inline-flex"
                            >
                                <Link href={register()}>
                                    <Store />
                                    Create account
                                </Link>
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}

function MenuLink({
    href,
    icon: Icon,
    children,
}: {
    href: string;
    icon: typeof Package;
    children: React.ReactNode;
}) {
    return (
        <DropdownMenuItem asChild>
            <Link href={href} className="w-full cursor-pointer">
                <Icon />
                {children}
            </Link>
        </DropdownMenuItem>
    );
}
