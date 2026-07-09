import { Head, Link } from '@inertiajs/react';
import { ChevronRight, Settings } from 'lucide-react';
import AppLogoIcon from '@/components/app-logo-icon';
import { GAMES } from '@/components/game-ui';
import { edit as editProfile } from '@/routes/profile';

export default function Dashboard() {
    return (
        <>
            <Head title="Dashboard" />
            <div className="flex min-h-[100dvh] flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
                <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
                    <div className="mb-6 flex items-center justify-between">
                        <span
                            aria-hidden
                            className="flex size-10 items-center justify-center rounded-xl bg-amber-500/15 ring-1 ring-amber-500/25"
                        >
                            <AppLogoIcon className="size-7" />
                        </span>
                        <Link
                            href={editProfile()}
                            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-slate-200"
                        >
                            <Settings className="size-4" aria-hidden />
                            Instellingen
                        </Link>
                    </div>

                    <header className="mb-8">
                        <p className="text-xs font-semibold tracking-widest text-amber-600 uppercase dark:text-amber-400">
                            Pass-the-phone
                        </p>
                        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                            Kies een spel
                        </h1>
                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                            Eén telefoon, de hele groep speelt mee.
                        </p>
                    </header>

                    <div className="space-y-3">
                        {GAMES.map((game) => (
                            <Link
                                key={game.title}
                                href={game.href}
                                className="group flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 transition hover:ring-amber-500/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 active:scale-[0.99] dark:bg-white/5 dark:shadow-none dark:ring-white/10 dark:hover:bg-white/[0.07]"
                            >
                                <span
                                    aria-hidden
                                    className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 ring-1 ring-slate-200 transition group-hover:text-amber-600 dark:bg-white/10 dark:text-slate-300 dark:ring-white/10 dark:group-hover:text-amber-400"
                                >
                                    <game.icon className="size-6" />
                                </span>
                                <span className="flex-1">
                                    <span className="block text-base font-semibold text-slate-900 dark:text-white">
                                        {game.title}
                                    </span>
                                    <span className="block text-sm text-slate-500 dark:text-slate-400">
                                        {game.description}
                                    </span>
                                </span>
                                <ChevronRight
                                    className="size-5 shrink-0 text-slate-400 dark:text-slate-500"
                                    aria-hidden
                                />
                            </Link>
                        ))}
                    </div>
                </main>
            </div>
        </>
    );
}
