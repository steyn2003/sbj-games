import { Head, Link } from '@inertiajs/react';
import { Ban, ChevronRight, Eye, Rabbit, Timer, Users, VenetianMask } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import AppLogoIcon from '@/components/app-logo-icon';
import { dashboard, forbiddenWord, home, horseRace, pimPamPet, spyLocation, wieInDeGroep } from '@/routes';

interface GameLink {
    title: string;
    description: string;
    href: string;
    icon: LucideIcon;
}

const games: GameLink[] = [
    {
        title: 'Undercover',
        description: 'Vind de geheime bedrieger. Iedereen krijgt een woord, behalve de Undercover.',
        href: home().url,
        icon: Eye,
    },
    {
        title: 'Spion',
        description: 'Iedereen kent de geheime locatie — behalve de Spion. Ontmasker hem of bluf je naar de winst.',
        href: spyLocation().url,
        icon: VenetianMask,
    },
    {
        title: 'Verboden Woord',
        description: 'Laat de groep het woord raden zonder de verboden woorden te zeggen.',
        href: forbiddenWord().url,
        icon: Ban,
    },
    {
        title: 'Pim Pam Pet',
        description: 'Categorie + letter. Noem op tijd een passend woord en geef door.',
        href: pimPamPet().url,
        icon: Timer,
    },
    {
        title: 'Wie in de groep…?',
        description: 'Stem op wie de stelling het beste past. De winnaar drinkt!',
        href: wieInDeGroep().url,
        icon: Users,
    },
    {
        title: 'Paardenrace',
        description: 'Twee telefoons: één toont de baan, de ander deelt de kaarten. Zet in op een kleur en race!',
        href: horseRace().url,
        icon: Rabbit,
    },
];

export default function Dashboard() {
    return (
        <>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col items-center p-4">
                <div className="w-full max-w-md">
                    <div className="mb-6 flex flex-col items-center text-center">
                        <div className="mb-3 flex size-16 items-center justify-center rounded-2xl bg-amber-400/15 ring-1 ring-amber-400/30">
                            <AppLogoIcon className="size-11" />
                        </div>
                        <span className="text-xs font-bold tracking-widest text-amber-500 uppercase dark:text-amber-300">
                            Pim Pam Pet
                        </span>
                        <h1 className="mt-1 text-3xl font-black">Kies een spel</h1>
                        <p className="mt-1 text-sm text-muted-foreground">Pass-the-phone spellen voor de hele groep.</p>
                    </div>

                    <div className="space-y-3">
                        {games.map((game) => (
                            <Link
                                key={game.title}
                                href={game.href}
                                className="flex items-center gap-4 rounded-2xl border border-sidebar-border/70 bg-card p-4 shadow-sm transition hover:border-amber-400/50 hover:shadow-md active:scale-[0.99] dark:border-sidebar-border"
                            >
                                <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-amber-400/15 text-amber-600 ring-1 ring-amber-400/30 dark:text-amber-300">
                                    <game.icon className="size-6" />
                                </span>
                                <span className="flex-1">
                                    <span className="block text-base font-bold">{game.title}</span>
                                    <span className="block text-sm text-muted-foreground">{game.description}</span>
                                </span>
                                <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
