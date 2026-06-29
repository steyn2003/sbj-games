import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Beer, RotateCcw, Timer } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAppearance } from '@/hooks/use-appearance';
import {
    CATEGORIES,
    LETTERS,
    pickRandom,
    TURN_SECONDS_OPTIONS,
} from '@/lib/pimpampet';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';

type Phase = 'setup' | 'play' | 'timeout';

export default function PimPamPet() {
    const [phase, setPhase] = useState<Phase>('setup');
    const [seconds, setSeconds] = useState(10);
    const [category, setCategory] = useState('');
    const [letter, setLetter] = useState('');
    const [secondsLeft, setSecondsLeft] = useState(10);
    // Bumping the turn restarts the countdown for the next player.
    const [turn, setTurn] = useState(0);

    useEffect(() => {
        if (phase !== 'play') {
            return;
        }

        const id = window.setInterval(() => {
            setSecondsLeft((value) => {
                if (value <= 1) {
                    window.clearInterval(id);
                    setPhase('timeout');

                    return 0;
                }

                return value - 1;
            });
        }, 1000);

        return () => window.clearInterval(id);
    }, [phase, turn]);

    const beginTurn = () => {
        setSecondsLeft(seconds);
        setTurn((value) => value + 1);
        setPhase('play');
    };

    const startRound = () => {
        setCategory(pickRandom(CATEGORIES));
        setLetter(pickRandom(LETTERS));
        beginTurn();
    };

    const newRound = () => {
        setCategory((current) => pickRandom(CATEGORIES, current));
        setLetter((current) => pickRandom(LETTERS, current));
        beginTurn();
    };

    // Same category and letter, fresh timer for the next player.
    const pass = () => beginTurn();

    return (
        <>
            <Head title="Pim Pam Pet" />
            <div className="relative flex min-h-[100dvh] flex-col overflow-hidden bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
                <div className="pointer-events-none absolute -top-32 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-amber-300/40 blur-3xl dark:bg-amber-500/25" />
                <div className="pointer-events-none absolute -bottom-40 -left-24 h-80 w-80 rounded-full bg-rose-300/40 blur-3xl dark:bg-rose-500/15" />
                <main className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
                    <div className="mb-2">
                        <Link
                            href={dashboard()}
                            className="inline-flex items-center gap-1 text-sm text-slate-500 transition hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                        >
                            <ArrowLeft className="size-4" /> Dashboard
                        </Link>
                    </div>
                    {phase === 'setup' && (
                        <SetupScreen
                            seconds={seconds}
                            onSelectSeconds={setSeconds}
                            onStart={startRound}
                        />
                    )}
                    {phase === 'play' && (
                        <PlayScreen
                            category={category}
                            letter={letter}
                            secondsLeft={secondsLeft}
                            seconds={seconds}
                            onPass={pass}
                        />
                    )}
                    {phase === 'timeout' && (
                        <TimeoutScreen
                            category={category}
                            letter={letter}
                            onNewRound={newRound}
                        />
                    )}
                </main>
            </div>
        </>
    );
}

function SetupScreen({
    seconds,
    onSelectSeconds,
    onStart,
}: {
    seconds: number;
    onSelectSeconds: (value: number) => void;
    onStart: () => void;
}) {
    return (
        <div className="flex flex-1 flex-col">
            <header className="mb-6 text-center">
                <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-amber-400/15 px-3 py-1 text-xs font-bold tracking-widest text-amber-600 uppercase ring-1 ring-amber-400/30 dark:text-amber-300">
                    <Beer className="size-3.5" /> Pim Pam Pet
                </span>
                <h1 className="bg-gradient-to-br from-slate-900 via-amber-700 to-amber-500 bg-clip-text text-5xl font-black tracking-tight text-transparent dark:from-white dark:via-amber-100 dark:to-amber-300">
                    Pim Pam Pet
                </h1>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    Een categorie en een letter. Noem om de beurt een nieuw
                    woord dat erbij past — vóór de tijd om is. Geef daarna de
                    telefoon door. Wie te laat is, drinkt!
                </p>
            </header>

            <section className="mb-6 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-white/5 dark:shadow-none dark:ring-white/10">
                <h2 className="mb-3 flex items-center gap-2 text-sm font-medium">
                    <Timer className="size-4" /> Tijd per beurt
                </h2>
                <div className="grid grid-cols-3 gap-3">
                    {TURN_SECONDS_OPTIONS.map((option) => (
                        <button
                            key={option}
                            type="button"
                            onClick={() => onSelectSeconds(option)}
                            className={cn(
                                'rounded-xl py-3 text-base font-bold ring-1 transition focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none active:scale-[0.97]',
                                seconds === option
                                    ? 'bg-amber-500 text-white ring-amber-300'
                                    : 'bg-white text-slate-900 ring-slate-200 hover:bg-slate-200 dark:bg-white/5 dark:text-white dark:ring-white/10 dark:hover:bg-white/10',
                            )}
                        >
                            {option}s
                        </button>
                    ))}
                </div>
            </section>

            <div className="mt-auto pt-2">
                <Button
                    onClick={onStart}
                    className="h-14 w-full rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-lg font-bold text-white shadow-lg shadow-amber-900/40 transition hover:from-amber-400 hover:to-orange-400 active:scale-[0.99]"
                >
                    Start ronde
                </Button>
            </div>
        </div>
    );
}

function PlayScreen({
    category,
    letter,
    secondsLeft,
    seconds,
    onPass,
}: {
    category: string;
    letter: string;
    secondsLeft: number;
    seconds: number;
    onPass: () => void;
}) {
    const urgent = secondsLeft <= 3;
    const { resolvedAppearance } = useAppearance();
    const ringTrackColor =
        resolvedAppearance === 'dark'
            ? 'rgba(255,255,255,0.1)'
            : 'rgba(15,23,42,0.1)';

    return (
        <div className="flex flex-1 flex-col">
            <div className="mb-4 text-center">
                <span className="text-xs font-semibold tracking-widest text-amber-600 uppercase dark:text-amber-300">
                    Categorie
                </span>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {category}
                </p>
            </div>

            <div className="flex flex-1 flex-col items-center justify-center gap-8">
                <div className="flex size-44 items-center justify-center rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-2xl ring-1 ring-slate-300 dark:ring-white/20">
                    <span className="text-8xl font-black text-white">
                        {letter}
                    </span>
                </div>

                <div className="flex flex-col items-center gap-2">
                    <div
                        role="timer"
                        aria-live="assertive"
                        aria-atomic="true"
                        aria-label={`Nog ${secondsLeft} seconden`}
                        className="flex size-24 items-center justify-center rounded-full p-1.5 transition"
                        style={{
                            background: `conic-gradient(${urgent ? 'var(--color-rose-400)' : 'var(--color-amber-400)'} ${(secondsLeft / seconds) * 360}deg, ${ringTrackColor} 0deg)`,
                        }}
                    >
                        <div
                            className={cn(
                                'flex size-full items-center justify-center rounded-full text-3xl font-black tabular-nums transition',
                                urgent
                                    ? 'bg-rose-500/15 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300'
                                    : 'bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white',
                            )}
                        >
                            {secondsLeft}
                        </div>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Noem iets in{' '}
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {category}
                        </span>{' '}
                        met de letter{' '}
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {letter}
                        </span>
                    </p>
                </div>
            </div>

            <div className="mt-auto pt-4">
                <Button
                    onClick={onPass}
                    className="h-14 w-full rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-lg font-bold text-white transition hover:from-amber-400 hover:to-orange-400 active:scale-[0.99]"
                >
                    Gehaald → geef door
                </Button>
                <p className="mt-2 text-center text-xs text-slate-400 dark:text-slate-500">
                    Reset de tijd voor de volgende speler ({seconds}s)
                </p>
            </div>
        </div>
    );
}

function TimeoutScreen({
    category,
    letter,
    onNewRound,
}: {
    category: string;
    letter: string;
    onNewRound: () => void;
}) {
    // Buzz the phone on timeout for the "drink!" payoff.
    useEffect(() => {
        navigator.vibrate?.(400);
    }, []);

    return (
        <div className="flex flex-1 flex-col">
            <div className="flex flex-1 flex-col items-center justify-center text-center">
                <span className="animate-pulse text-6xl drop-shadow-lg">
                    💥
                </span>
                <h1
                    aria-live="assertive"
                    className="mt-4 text-3xl font-black text-slate-900 dark:text-white"
                >
                    Tijd voorbij!
                </h1>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    Wie de telefoon vasthoudt, verliest deze ronde. 🍺
                </p>
                <p className="mt-6 text-sm text-slate-400 dark:text-slate-500">
                    Categorie was{' '}
                    <span className="font-semibold text-slate-600 dark:text-slate-300">
                        {category}
                    </span>{' '}
                    · letter{' '}
                    <span className="font-semibold text-slate-600 dark:text-slate-300">
                        {letter}
                    </span>
                </p>
            </div>

            <div className="mt-auto pt-4">
                <Button
                    onClick={onNewRound}
                    className="h-14 w-full rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-lg font-bold text-white transition hover:from-amber-400 hover:to-orange-400 active:scale-[0.99]"
                >
                    <RotateCcw className="size-5" /> Nieuwe ronde
                </Button>
            </div>
        </div>
    );
}
