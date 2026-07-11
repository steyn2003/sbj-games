import { Head, Link } from '@inertiajs/react';
import { motion, useReducedMotion } from 'framer-motion';
import { ChevronRight, Settings } from 'lucide-react';
import AppLogoIcon from '@/components/app-logo-icon';
import { GAMES, SoundToggle } from '@/components/game-ui';
import { feel } from '@/hooks/use-game-feel';
import { edit as editProfile } from '@/routes/profile';

export default function Dashboard() {
    const reduceMotion = useReducedMotion();

    return (
        <>
            <Head title="Kies een spel" />
            <div
                data-accent="gold"
                className="relative flex min-h-[100dvh] flex-col bg-background felt text-foreground"
            >
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 lamp-glow"
                />
                <main className="relative mx-auto flex w-full max-w-md flex-1 flex-col px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))]">
                    <div className="mb-6 flex items-center justify-between gap-2">
                        <span
                            aria-hidden
                            className="flex size-11 items-center justify-center rounded-2xl bg-(--glow)/12 ring-1 ring-(--glow)/25"
                        >
                            <AppLogoIcon className="size-8" />
                        </span>
                        <div className="flex items-center gap-2">
                            <Link
                                href={editProfile()}
                                className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/5 px-3.5 text-sm font-medium text-slate-300 ring-1 ring-white/10 transition hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-(--glow)"
                            >
                                <Settings className="size-4" aria-hidden />
                                Instellingen
                            </Link>
                            <SoundToggle />
                        </div>
                    </div>

                    <header className="mb-6">
                        <p className="text-xs font-semibold tracking-widest text-(--glow-strong) uppercase">
                            Pass-the-phone
                        </p>
                        <h1 className="mt-1 font-display text-4xl text-white">
                            Kies een spel
                        </h1>
                        <p className="mt-2 text-sm text-slate-400">
                            Eén telefoon, de hele groep speelt mee.
                        </p>
                    </header>

                    <div className="space-y-3">
                        {GAMES.map((game, index) => (
                            <motion.div
                                key={game.title}
                                data-accent={game.accent}
                                initial={
                                    reduceMotion
                                        ? { opacity: 0 }
                                        : { opacity: 0, y: 18 }
                                }
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                    delay: 0.05 + index * 0.04,
                                    type: 'spring',
                                    stiffness: 300,
                                    damping: 24,
                                }}
                                whileTap={
                                    reduceMotion ? undefined : { scale: 0.97 }
                                }
                            >
                                <Link
                                    href={game.href}
                                    onClick={() => feel.tap()}
                                    className="group flex items-center gap-4 rounded-2xl bg-white/[0.045] p-4 ring-1 ring-white/10 backdrop-blur-sm transition hover:bg-white/[0.07] hover:ring-(--glow)/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-(--glow) active:shadow-[0_0_40px_-10px_var(--glow)] active:ring-(--glow)/40"
                                >
                                    <span
                                        aria-hidden
                                        className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-(--glow)/12 text-(--glow-strong) ring-1 ring-(--glow)/25 transition group-active:shadow-[0_0_24px_-6px_var(--glow)]"
                                    >
                                        <game.icon className="size-7" />
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="block font-display text-xl leading-tight text-white">
                                            {game.title}
                                        </span>
                                        <span className="mt-0.5 block text-[13px] font-medium text-(--glow-strong)">
                                            {game.tagline}
                                        </span>
                                        <span className="mt-0.5 block truncate text-xs text-slate-500">
                                            {game.description}
                                        </span>
                                    </span>
                                    <ChevronRight
                                        className="size-5 shrink-0 text-slate-500 transition group-hover:text-(--glow-strong)"
                                        aria-hidden
                                    />
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </main>
            </div>
        </>
    );
}
