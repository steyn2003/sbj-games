import { Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import type { PropsWithChildren } from 'react';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn, toUrl } from '@/lib/utils';
import { dashboard } from '@/routes';
import { edit as editAppearance } from '@/routes/appearance';
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
    {
        title: 'Weergave',
        href: editAppearance(),
        icon: null,
    },
];

export default function SettingsLayout({ children }: PropsWithChildren) {
    const { isCurrentOrParentUrl } = useCurrentUrl();

    return (
        <div className="relative flex min-h-[100dvh] flex-col overflow-hidden bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
            <div
                aria-hidden
                className="pointer-events-none absolute -top-32 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-indigo-300/40 blur-3xl dark:bg-indigo-600/30"
            />
            <div
                aria-hidden
                className="pointer-events-none absolute -right-24 -bottom-40 h-80 w-80 rounded-full bg-amber-300/40 blur-3xl dark:bg-amber-500/20"
            />

            <main className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
                <div className="mb-2">
                    <Link
                        href={dashboard()}
                        className="inline-flex items-center gap-1 rounded-full px-1 py-1 text-sm text-slate-500 transition hover:text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 dark:text-slate-400 dark:hover:text-slate-200 dark:focus-visible:ring-offset-slate-950"
                    >
                        <ArrowLeft className="size-4" aria-hidden /> Dashboard
                    </Link>
                </div>

                <header className="mb-6">
                    <h1 className="bg-gradient-to-br from-slate-900 via-amber-700 to-amber-500 bg-clip-text text-4xl font-black tracking-tight text-transparent dark:from-white dark:via-amber-100 dark:to-amber-300">
                        Instellingen
                    </h1>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                        Beheer je profiel en accountvoorkeuren.
                    </p>
                </header>

                <nav
                    aria-label="Instellingen"
                    className="mb-6 flex gap-1 rounded-2xl bg-white p-1 shadow-sm ring-1 ring-slate-200 dark:bg-white/5 dark:shadow-none dark:ring-white/10"
                >
                    {settingsNavItems.map((item, index) => {
                        const isActive = isCurrentOrParentUrl(item.href);

                        return (
                            <Link
                                key={`${toUrl(item.href)}-${index}`}
                                href={item.href}
                                aria-current={isActive ? 'page' : undefined}
                                className={cn(
                                    'flex-1 rounded-xl px-3 py-2 text-center text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 dark:focus-visible:ring-offset-slate-950',
                                    isActive
                                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-900/30'
                                        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-slate-200',
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
