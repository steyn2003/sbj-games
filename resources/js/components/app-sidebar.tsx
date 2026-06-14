import { Link } from '@inertiajs/react';
import { Ban, Beer, LayoutGrid, Timer, Users, VenetianMask } from 'lucide-react';
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
import { dashboard, forbiddenWord, home, pimPamPet, spyLocation, wieInDeGroep } from '@/routes';
import type { NavItem } from '@/types';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
    {
        title: 'Undercover',
        href: home(),
        icon: Beer,
    },
    {
        title: 'Spion',
        href: spyLocation(),
        icon: VenetianMask,
    },
    {
        title: 'Verboden Woord',
        href: forbiddenWord(),
        icon: Ban,
    },
    {
        title: 'Pim Pam Pet',
        href: pimPamPet(),
        icon: Timer,
    },
    {
        title: 'Wie in de groep…?',
        href: wieInDeGroep(),
        icon: Users,
    },
];

const footerNavItems: NavItem[] = [];

export function AppSidebar() {
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
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
