import { Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import type { PropsWithChildren } from 'react';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn, toUrl } from '@/lib/utils';
import { dashboard } from '@/routes';
import { edit } from '@/routes/profile';
import { edit as editSecurity } from '@/routes/security';
import type { NavItem } from '@/types';

const settingsNavItems: NavItem[] = [
    {
        title: 'Profiel',
        href: edit(),
        icon: null,
    },
    {
        title: 'Beveiliging',
        href: editSecurity(),
        icon: null,
    },
];

export default function SettingsLayout({ children }: PropsWithChildren) {
    const { isCurrentOrParentUrl } = useCurrentUrl();

    return (
        <div className="relative flex min-h-[100dvh] flex-col bg-background felt text-foreground">
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 lamp-glow"
            />
            <main className="relative mx-auto flex w-full max-w-md flex-1 flex-col px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
                <div className="mb-3">
                    <Link
                        href={dashboard()}
                        className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/5 pr-4 pl-3 text-sm font-medium text-slate-300 ring-1 ring-white/10 transition hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70"
                    >
                        <ArrowLeft className="size-4" aria-hidden /> Spellen
                    </Link>
                </div>

                <header className="mb-6">
                    <h1 className="font-display text-4xl text-white">
                        Instellingen
                    </h1>
                    <p className="mt-2 text-sm text-slate-400">
                        Beheer je profiel en accountvoorkeuren.
                    </p>
                </header>

                <nav
                    aria-label="Instellingen"
                    className="mb-6 flex gap-1 rounded-2xl bg-white/5 p-1 ring-1 ring-white/10"
                >
                    {settingsNavItems.map((item, index) => {
                        const isActive = isCurrentOrParentUrl(item.href);

                        return (
                            <Link
                                key={`${toUrl(item.href)}-${index}`}
                                href={item.href}
                                aria-current={isActive ? 'page' : undefined}
                                className={cn(
                                    'flex-1 rounded-xl px-3 py-2 text-center text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                                    isActive
                                        ? 'bg-amber-400 text-slate-950'
                                        : 'text-slate-400 hover:bg-white/5 hover:text-slate-200',
                                )}
                            >
                                {item.title}
                            </Link>
                        );
                    })}
                </nav>

                <div className="flex-1 space-y-10">{children}</div>
            </main>
        </div>
    );
}
