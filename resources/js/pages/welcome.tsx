import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    Ban,
    Beer,
    Eye,
    Timer,
    Users,
    VenetianMask,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import AppLogoIcon from '@/components/app-logo-icon';
import { dashboard, login, register } from '@/routes';

type Accent = 'indigo' | 'emerald' | 'rose' | 'amber';

interface GameTeaser {
    title: string;
    icon: LucideIcon;
    accent: Accent;
}

const accentChip: Record<Accent, string> = {
    indigo: 'bg-indigo-400/15 text-indigo-700 dark:text-indigo-200 ring-indigo-400/30',
    emerald:
        'bg-emerald-400/15 text-emerald-700 dark:text-emerald-200 ring-emerald-400/30',
    rose: 'bg-rose-400/15 text-rose-700 dark:text-rose-200 ring-rose-400/30',
    amber: 'bg-amber-400/15 text-amber-700 dark:text-amber-200 ring-amber-400/30',
};

const teasers: GameTeaser[] = [
    { title: 'Undercover', icon: Eye, accent: 'indigo' },
    { title: 'Spion', icon: VenetianMask, accent: 'rose' },
    { title: 'Verboden Woord', icon: Ban, accent: 'emerald' },
    { title: 'Pim Pam Pet', icon: Timer, accent: 'amber' },
    { title: 'Wie in de groep…?', icon: Users, accent: 'indigo' },
];

export default function Welcome() {
    const { auth } = usePage().props;

    return (
        <>
            <Head title="Welkom" />
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
                    <header className="mt-6 mb-8 flex flex-col items-center text-center">
                        <div
                            aria-hidden
                            className="mb-3 flex size-20 items-center justify-center rounded-3xl bg-amber-400/15 ring-1 ring-amber-400/30"
                        >
                            <AppLogoIcon className="size-14" />
                        </div>
                        <span className="inline-flex items-center gap-2 rounded-full bg-amber-400/15 px-3 py-1 text-xs font-bold tracking-widest text-amber-600 uppercase ring-1 ring-amber-400/30 dark:text-amber-300">
                            <Beer className="size-3.5" aria-hidden /> Pim Pam
                            Pet
                        </span>
                        <h1 className="mt-3 bg-gradient-to-br from-slate-900 via-amber-700 to-amber-500 bg-clip-text text-5xl font-black tracking-tight text-transparent dark:from-white dark:via-amber-100 dark:to-amber-300">
                            Speel samen
                        </h1>
                        <p className="mt-3 text-base text-slate-500 dark:text-slate-400">
                            Eén telefoon, de hele groep mee. Pass-the-phone
                            partyspellen voor een avond vol bluf en lol.
                        </p>
                    </header>

                    <section className="mb-8 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-white/5 dark:shadow-none dark:ring-white/10">
                        <h2 className="mb-3 px-1 text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
                            De spellen
                        </h2>
                        <div className="space-y-2">
                            {teasers.map((teaser) => (
                                <div
                                    key={teaser.title}
                                    className="flex items-center gap-3"
                                >
                                    <span
                                        aria-hidden
                                        className={`flex size-10 shrink-0 items-center justify-center rounded-xl ring-1 ${accentChip[teaser.accent]}`}
                                    >
                                        <teaser.icon className="size-5" />
                                    </span>
                                    <span className="text-sm font-semibold text-slate-900 dark:text-white">
                                        {teaser.title}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </section>

                    <div className="mt-auto space-y-3 pt-2">
                        {auth.user ? (
                            <Link
                                href={dashboard()}
                                className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-lg font-bold text-white shadow-lg shadow-amber-900/40 transition hover:from-amber-400 hover:to-orange-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 active:scale-[0.99] dark:focus-visible:ring-offset-slate-950"
                            >
                                Naar de spellen
                                <ArrowRight className="size-5" aria-hidden />
                            </Link>
                        ) : (
                            <>
                                <Link
                                    href={register()}
                                    className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-lg font-bold text-white shadow-lg shadow-amber-900/40 transition hover:from-amber-400 hover:to-orange-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 active:scale-[0.99] dark:focus-visible:ring-offset-slate-950"
                                >
                                    Account aanmaken
                                    <ArrowRight
                                        className="size-5"
                                        aria-hidden
                                    />
                                </Link>
                                <Link
                                    href={login()}
                                    className="flex h-14 w-full items-center justify-center rounded-2xl bg-white text-base font-bold text-slate-800 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50 hover:ring-amber-400/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 active:scale-[0.99] dark:bg-white/5 dark:text-slate-200 dark:shadow-none dark:ring-white/10 dark:hover:bg-white/[0.07] dark:focus-visible:ring-offset-slate-950"
                                >
                                    Inloggen
                                </Link>
                            </>
                        )}
                    </div>
                </main>
            </div>
        </>
    );
}
