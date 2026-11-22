import { Link, usePage } from '@inertiajs/react';
import {
    BarChart3,
    Boxes,
    ClipboardList,
    LayoutGrid,
    Package,
    ScanBarcode,
    Store,
    Tags,
    TicketPercent,
    Truck,
    Users,
    Warehouse,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes/admin';
import { index as categories } from '@/routes/admin/categories';
import { index as inventory } from '@/routes/admin/inventory';
import { index as orders } from '@/routes/admin/orders';
import { index as pos } from '@/routes/admin/pos';
import { index as products } from '@/routes/admin/products';
import { index as purchaseOrders } from '@/routes/admin/purchase-orders';
import { index as reports } from '@/routes/admin/reports';
import { index as suppliers } from '@/routes/admin/suppliers';
import { index as users } from '@/routes/admin/users';
import { index as vouchers } from '@/routes/admin/vouchers';
import { index as shop } from '@/routes/shop';
import type { NavGroup, NavItem } from '@/types';

export function AppSidebar() {
    const { auth, adminBadges } = usePage().props;
    const isAdmin = auth.user?.role === 'admin';

    const groups: NavGroup[] = [
        {
            label: 'Overview',
            items: [
                { title: 'Dashboard', href: dashboard(), icon: LayoutGrid },
            ],
        },
        {
            label: 'Sales',
            items: [
                {
                    title: 'Orders',
                    href: orders(),
                    icon: ClipboardList,
                    matchChildren: true,
                    badge:
                        (adminBadges?.pendingOrders ?? 0) +
                        (adminBadges?.paymentsToVerify ?? 0),
                },
                { title: 'Point of sale', href: pos(), icon: ScanBarcode },
                { title: 'Reports', href: reports(), icon: BarChart3 },
            ],
        },
        {
            label: 'Inventory',
            items: [
                {
                    title: 'Products',
                    href: products(),
                    icon: Package,
                    matchChildren: true,
                    badge: adminBadges?.lowStock,
                },
                { title: 'Stock ledger', href: inventory(), icon: Warehouse },
                {
                    title: 'Categories & brands',
                    href: categories(),
                    icon: Tags,
                    matchChildren: true,
                },
            ],
        },
        {
            label: 'Purchasing',
            items: [
                {
                    title: 'Purchase orders',
                    href: purchaseOrders(),
                    icon: Truck,
                    matchChildren: true,
                },
                { title: 'Suppliers', href: suppliers(), icon: Boxes },
            ],
        },
        ...(isAdmin
            ? [
                  {
                      label: 'Administration',
                      items: [
                          {
                              title: 'Vouchers',
                              href: vouchers(),
                              icon: TicketPercent,
                          },
                          {
                              title: 'Users & roles',
                              href: users(),
                              icon: Users,
                          },
                      ],
                  },
              ]
            : []),
    ];

    const footerNavItems: NavItem[] = [
        { title: 'View storefront', href: shop(), icon: Store },
    ];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain groups={groups} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
