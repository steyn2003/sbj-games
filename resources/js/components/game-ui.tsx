import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    Ban,
    Dice5,
    Eye,
    Rabbit,
    Timer,
    Users,
    VenetianMask,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import {
    forbiddenWord,
    dashboard,
    home,
    horseRace,
    mexen,
    pimPamPet,
    spyLocation,
    wieInDeGroep,
} from '@/routes';

/**
 * House style for all game screens.
 *
 * One accent (amber), slate neutrals, solid colors only.
 * No gradients, no gradient text, no blur blobs, no emoji — lucide icons only.
 */

export interface GameInfo {
    title: string;
    description: string;
    href: string;
    icon: LucideIcon;
}

export const GAMES: GameInfo[] = [
    {
        title: 'Undercover',
        description:
            'Vind de geheime bedrieger. Iedereen krijgt een woord, behalve de Undercover.',
        href: home().url,
        icon: Eye,
    },
    {
        title: 'Spion',
        description:
            'Iedereen kent de geheime locatie — behalve de Spion. Ontmasker hem of bluf je naar de winst.',
        href: spyLocation().url,
        icon: VenetianMask,
    },
    {
        title: 'Verboden Woord',
        description:
            'Laat de groep het woord raden zonder de verboden woorden te zeggen.',
        href: forbiddenWord().url,
        icon: Ban,
    },
    {
        title: 'Pim Pam Pet',
        description:
            'Categorie + letter. Noem op tijd een passend woord en geef door.',
        href: pimPamPet().url,
        icon: Timer,
    },
    {
        title: 'Wie in de groep…?',
        description:
            'Stem op wie de stelling het beste past. De winnaar drinkt!',
        href: wieInDeGroep().url,
        icon: Users,
    },
    {
        title: 'Paardenrace',
        description:
            'Twee telefoons: één toont de baan, de ander deelt de kaarten. Zet in op een kleur en race!',
        href: horseRace().url,
        icon: Rabbit,
    },
    {
        title: 'Mexen',
        description:
            'Twee dobbelstenen, twee varianten: rol open en de laagste drinkt, of bluf stiekem en betrap de leugenaar.',
        href: mexen().url,
        icon: Dice5,
    },
];

export function GameShell({
    title,
    back = true,
    children,
    className,
}: {
    title: string;
    back?: boolean;
    children: ReactNode;
    className?: string;
}) {
    return (
        <>
            <Head title={title} />
            <div className="flex min-h-[100dvh] flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
                <main
                    className={cn(
                        'mx-auto flex w-full max-w-md flex-1 flex-col px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]',
                        className,
                    )}
                >
                    {back && (
                        <div className="mb-3">
                            <Link
                                href={dashboard()}
                                className="inline-flex items-center gap-1.5 text-sm text-slate-500 transition hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 dark:text-slate-400 dark:hover:text-slate-100"
                            >
                                <ArrowLeft className="size-4" aria-hidden />
                                Alle spellen
                            </Link>
                        </div>
                    )}
                    {children}
                </main>
            </div>
        </>
    );
}

export function GameHeader({
    kicker,
    title,
    description,
    className,
}: {
    kicker?: string;
    title: string;
    description?: string;
    className?: string;
}) {
    return (
        <header className={cn('mb-6', className)}>
            {kicker && (
                <p className="text-xs font-semibold tracking-widest text-amber-600 uppercase dark:text-amber-400">
                    {kicker}
                </p>
            )}
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                {title}
            </h1>
            {description && (
                <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                    {description}
                </p>
            )}
        </header>
    );
}

export function Panel({
    children,
    className,
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <section
            className={cn(
                'rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-white/5 dark:shadow-none dark:ring-white/10',
                className,
            )}
        >
            {children}
        </section>
    );
}

type ActionVariant = 'primary' | 'neutral' | 'danger';

const actionVariants: Record<ActionVariant, string> = {
    primary: 'bg-amber-500 text-slate-950 hover:bg-amber-400',
    neutral:
        'bg-white text-slate-900 ring-1 ring-slate-200 hover:bg-slate-100 dark:bg-white/5 dark:text-white dark:ring-white/10 dark:hover:bg-white/10',
    danger: 'bg-rose-600 text-white hover:bg-rose-500',
};

const actionBase =
    'flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-base font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 dark:focus-visible:ring-offset-slate-950';

export function ActionButton({
    variant = 'primary',
    href,
    className,
    children,
    ...props
}: {
    variant?: ActionVariant;
    href?: string;
    className?: string;
    children: ReactNode;
} & Omit<React.ComponentPropsWithoutRef<'button'>, 'className' | 'children'>) {
    const classes = cn(actionBase, actionVariants[variant], className);

    if (href) {
        return (
            <Link href={href} className={classes}>
                {children}
            </Link>
        );
    }

    return (
        <button type="button" className={classes} {...props}>
            {children}
        </button>
    );
}
