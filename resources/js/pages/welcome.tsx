import { Head, usePage } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import AppLogoIcon from '@/components/app-logo-icon';
import { ActionButton, GAMES } from '@/components/game-ui';
import { dashboard, login, register } from '@/routes';

export default function Welcome() {
    const { auth } = usePage().props;

    return (
        <>
            <Head title="Welkom" />
            <div className="flex min-h-[100dvh] flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
                <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
                    <header className="mt-8 mb-8">
                        <span
                            aria-hidden
                            className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-amber-500/15 ring-1 ring-amber-500/25"
                        >
                            <AppLogoIcon className="size-10" />
                        </span>
                        <p className="text-xs font-semibold tracking-widest text-amber-600 uppercase dark:text-amber-400">
                            Pass-the-phone partyspellen
                        </p>
                        <h1 className="mt-1 text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
                            Speel samen
                        </h1>
                        <p className="mt-3 text-base leading-relaxed text-slate-500 dark:text-slate-400">
                            Eén telefoon, de hele groep mee. Een avond vol bluf
                            en lol.
                        </p>
                    </header>

                    <section className="mb-8 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-white/5 dark:shadow-none dark:ring-white/10">
                        <h2 className="mb-3 px-1 text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
                            De spellen
                        </h2>
                        <div className="space-y-2">
                            {GAMES.map((game) => (
                                <div
                                    key={game.title}
                                    className="flex items-center gap-3"
                                >
                                    <span
                                        aria-hidden
                                        className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 ring-1 ring-slate-200 dark:bg-white/10 dark:text-slate-300 dark:ring-white/10"
                                    >
                                        <game.icon className="size-5" />
                                    </span>
                                    <span className="text-sm font-semibold text-slate-900 dark:text-white">
                                        {game.title}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </section>

                    <div className="mt-auto space-y-3 pt-2">
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
                    </div>
                </main>
            </div>
        </>
    );
}
