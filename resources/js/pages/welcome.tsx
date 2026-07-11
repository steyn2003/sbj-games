import { Head, usePage } from '@inertiajs/react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import AppLogoIcon from '@/components/app-logo-icon';
import { ActionButton, GAMES, Panel } from '@/components/game-ui';
import { cn } from '@/lib/utils';
import { dashboard, login, register } from '@/routes';

export default function Welcome() {
    const { auth } = usePage().props;
    const reduceMotion = useReducedMotion();

    const rise = (delay: number) => ({
        initial: reduceMotion
            ? { opacity: 0 }
            : ({ opacity: 0, y: 16 } as const),
        animate: { opacity: 1, y: 0 },
        transition: {
            delay,
            type: 'spring' as const,
            stiffness: 300,
            damping: 24,
        },
    });

    return (
        <>
            <Head title="Welkom" />
            <div
                data-accent="gold"
                className="relative flex min-h-[100dvh] flex-col bg-background felt text-foreground"
            >
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 lamp-glow"
                />
                <main className="relative mx-auto flex w-full max-w-md flex-1 flex-col px-5 pt-[max(2.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
                    <header className="mt-4 mb-8 flex flex-col items-center text-center">
                        <motion.div
                            initial={
                                reduceMotion
                                    ? { opacity: 0 }
                                    : { opacity: 0, scale: 0, rotate: -12 }
                            }
                            animate={{ opacity: 1, scale: 1, rotate: 0 }}
                            transition={{
                                type: 'spring',
                                stiffness: 300,
                                damping: 18,
                            }}
                        >
                            <span
                                aria-hidden
                                className={cn(
                                    'flex size-20 items-center justify-center rounded-3xl bg-(--glow)/12 shadow-[0_0_50px_-12px_var(--glow)] ring-1 ring-(--glow)/25',
                                    !reduceMotion && 'animate-float',
                                )}
                            >
                                <AppLogoIcon className="size-12" />
                            </span>
                        </motion.div>
                        <motion.p
                            {...rise(0.1)}
                            className="mt-6 text-xs font-semibold tracking-widest text-(--glow-strong) uppercase"
                        >
                            Pass-the-phone partyspellen
                        </motion.p>
                        <motion.h1
                            {...rise(0.16)}
                            className="mt-2 font-display text-5xl text-white"
                        >
                            Speel samen
                        </motion.h1>
                        <motion.p
                            {...rise(0.22)}
                            className="mt-3 text-base leading-relaxed text-slate-400"
                        >
                            Eén telefoon, de hele groep mee. Een avond vol bluf
                            en lol.
                        </motion.p>
                    </header>

                    <motion.div {...rise(0.3)}>
                        <Panel className="mb-8">
                            <h2 className="mb-3 px-1 text-xs font-semibold tracking-widest text-slate-400 uppercase">
                                De spellen
                            </h2>
                            <ul className="space-y-2.5">
                                {GAMES.map((game) => (
                                    <li
                                        key={game.title}
                                        data-accent={game.accent}
                                        className="flex items-center gap-3 px-1"
                                    >
                                        <span
                                            aria-hidden
                                            className="size-2 shrink-0 rounded-full bg-(--glow) shadow-[0_0_10px_var(--glow)]"
                                        />
                                        <span className="text-sm font-semibold text-white">
                                            {game.title}
                                        </span>
                                        <span className="min-w-0 flex-1 truncate text-right text-xs text-slate-500">
                                            {game.tagline}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </Panel>
                    </motion.div>

                    <motion.div
                        {...rise(0.38)}
                        className="mt-auto space-y-3 pt-2"
                    >
                        {auth.user ? (
                            <ActionButton
                                href={dashboard().url}
                                className="text-lg"
                            >
                                Naar de spellen
                                <ArrowRight className="size-5" aria-hidden />
                            </ActionButton>
                        ) : (
                            <>
                                <ActionButton
                                    href={register().url}
                                    className="text-lg"
                                >
                                    Account aanmaken
                                    <ArrowRight
                                        className="size-5"
                                        aria-hidden
                                    />
                                </ActionButton>
                                <ActionButton
                                    href={login().url}
                                    variant="neutral"
                                >
                                    Inloggen
                                </ActionButton>
                            </>
                        )}
                    </motion.div>
                </main>
            </div>
        </>
    );
}
