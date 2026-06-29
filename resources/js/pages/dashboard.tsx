import { Head, Link } from '@inertiajs/react';
import {
    Ban,
    Beer,
    ChevronRight,
    Eye,
    Rabbit,
    Settings,
    Timer,
    Users,
    VenetianMask,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import AppLogoIcon from '@/components/app-logo-icon';
import {
    forbiddenWord,
    home,
    horseRace,
    pimPamPet,
    spyLocation,
    wieInDeGroep,
} from '@/routes';
import { edit as editProfile } from '@/routes/profile';

type Accent = 'indigo' | 'emerald' | 'rose' | 'amber';

interface GameLink {
    title: string;
    description: string;
    href: string;
    icon: LucideIcon;
    accent: Accent;
}

/** Tailwind classes per accent, kept static so they survive purging. */
const accentChip: Record<Accent, string> = {
    indigo: 'bg-indigo-400/15 text-indigo-700 dark:text-indigo-200 ring-indigo-400/30',
    emerald:
        'bg-emerald-400/15 text-emerald-700 dark:text-emerald-200 ring-emerald-400/30',
    rose: 'bg-rose-400/15 text-rose-700 dark:text-rose-200 ring-rose-400/30',
    amber: 'bg-amber-400/15 text-amber-700 dark:text-amber-200 ring-amber-400/30',
};

const games: GameLink[] = [
    {
        title: 'Undercover',
        description:
            'Vind de geheime bedrieger. Iedereen krijgt een woord, behalve de Undercover.',
        href: home().url,
        icon: Eye,
        accent: 'indigo',
    },
    {
        title: 'Spion',
        description:
            'Iedereen kent de geheime locatie — behalve de Spion. Ontmasker hem of bluf je naar de winst.',
        href: spyLocation().url,
        icon: VenetianMask,
        accent: 'rose',
    },
    {
        title: 'Verboden Woord',
        description:
            'Laat de groep het woord raden zonder de verboden woorden te zeggen.',
        href: forbiddenWord().url,
        icon: Ban,
        accent: 'emerald',
    },
    {
        title: 'Pim Pam Pet',
        description:
            'Categorie + letter. Noem op tijd een passend woord en geef door.',
        href: pimPamPet().url,
        icon: Timer,
        accent: 'amber',
    },
    {
        title: 'Wie in de groep…?',
        description:
            'Stem op wie de stelling het beste past. De winnaar drinkt!',
        href: wieInDeGroep().url,
        icon: Users,
        accent: 'indigo',
    },
    {
        title: 'Paardenrace',
        description:
            'Twee telefoons: één toont de baan, de ander deelt de kaarten. Zet in op een kleur en race!',
        href: horseRace().url,
        icon: Rabbit,
        accent: 'emerald',
    },
];

export default function Dashboard() {
    return (
        <>
            <Head title="Dashboard" />
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
                    <div className="mb-2 flex justify-end">
                        <Link
                            href={editProfile()}
                            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-slate-200 dark:focus-visible:ring-offset-slate-950"
                        >
                            <Settings className="size-4" aria-hidden />{' '}
                            Instellingen
                        </Link>
                    </div>

                    <header className="mb-8 flex flex-col items-center text-center">
                        <div
                            aria-hidden
                            className="mb-3 flex size-16 items-center justify-center rounded-2xl bg-amber-400/15 ring-1 ring-amber-400/30"
                        >
                            <AppLogoIcon className="size-11" />
                        </div>
                        <span className="inline-flex items-center gap-2 rounded-full bg-amber-400/15 px-3 py-1 text-xs font-bold tracking-widest text-amber-600 uppercase ring-1 ring-amber-400/30 dark:text-amber-300">
                            <Beer className="size-3.5" aria-hidden /> Pim Pam
                            Pet
                        </span>
                        <h1 className="mt-3 bg-gradient-to-br from-slate-900 via-amber-700 to-amber-500 bg-clip-text text-4xl font-black tracking-tight text-transparent dark:from-white dark:via-amber-100 dark:to-amber-300">
                            Kies een spel
                        </h1>
                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                            Pass-the-phone spellen voor de hele groep.
                        </p>
                    </header>

                    <div className="space-y-3">
                        {games.map((game) => (
                            <Link
                                key={game.title}
                                href={game.href}
                                className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50 hover:ring-amber-400/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 active:scale-[0.99] dark:bg-white/5 dark:shadow-none dark:ring-white/10 dark:hover:bg-white/[0.07] dark:focus-visible:ring-offset-slate-950"
                            >
                                <span
                                    aria-hidden
                                    className={`flex size-12 shrink-0 items-center justify-center rounded-xl ring-1 ${accentChip[game.accent]}`}
                                >
                                    <game.icon className="size-6" />
                                </span>
                                <span className="flex-1">
                                    <span className="block text-base font-bold text-slate-900 dark:text-white">
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
