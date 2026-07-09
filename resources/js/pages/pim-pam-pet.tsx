import { RotateCcw, Timer, TimerOff } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
    ActionButton,
    GameHeader,
    GameShell,
    Panel,
} from '@/components/game-ui';
import { useAppearance } from '@/hooks/use-appearance';
import {
    CATEGORIES,
    LETTERS,
    pickRandom,
    TURN_SECONDS_OPTIONS,
} from '@/lib/pimpampet';
import { cn } from '@/lib/utils';

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
        <GameShell title="Pim Pam Pet">
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
        </GameShell>
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
            <GameHeader
                kicker="Partyspel"
                title="Pim Pam Pet"
                description="Een categorie en een letter. Noem om de beurt een nieuw woord dat erbij past — vóór de tijd om is. Geef daarna de telefoon door. Wie te laat is, drinkt!"
            />

            <Panel className="mb-6">
                <h2 className="mb-3 flex items-center gap-2 text-sm font-medium">
                    <Timer className="size-4" aria-hidden /> Tijd per beurt
                </h2>
                <div className="grid grid-cols-3 gap-3">
                    {TURN_SECONDS_OPTIONS.map((option) => (
                        <button
                            key={option}
                            type="button"
                            onClick={() => onSelectSeconds(option)}
                            className={cn(
                                'rounded-xl py-3 text-base font-semibold ring-1 transition focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none active:scale-[0.97]',
                                seconds === option
                                    ? 'bg-amber-500 text-slate-950 ring-amber-500'
                                    : 'bg-white text-slate-900 ring-slate-200 hover:bg-slate-100 dark:bg-white/5 dark:text-white dark:ring-white/10 dark:hover:bg-white/10',
                            )}
                        >
                            {option}s
                        </button>
                    ))}
                </div>
            </Panel>

            <div className="mt-auto pt-2">
                <ActionButton onClick={onStart} className="text-lg">
                    Start ronde
                </ActionButton>
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
                <span className="text-xs font-semibold tracking-widest text-amber-600 uppercase dark:text-amber-400">
                    Categorie
                </span>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {category}
                </p>
            </div>

            <div className="flex flex-1 flex-col items-center justify-center gap-8">
                <div className="flex size-44 items-center justify-center rounded-3xl bg-amber-500 shadow-sm ring-1 ring-amber-600/20">
                    <span className="text-8xl font-bold text-slate-950">
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
                            background: `conic-gradient(${urgent ? 'var(--color-rose-500)' : 'var(--color-amber-500)'} ${(secondsLeft / seconds) * 360}deg, ${ringTrackColor} 0deg)`,
                        }}
                    >
                        <div
                            className={cn(
                                'flex size-full items-center justify-center rounded-full text-3xl font-bold tabular-nums transition',
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
                <ActionButton onClick={onPass} className="text-lg">
                    Gehaald, geef door
                </ActionButton>
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
                <span className="flex size-20 items-center justify-center rounded-full bg-rose-500/15 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300">
                    <TimerOff className="size-10" aria-hidden />
                </span>
                <h1
                    aria-live="assertive"
                    className="mt-4 text-3xl font-bold text-slate-900 dark:text-white"
                >
                    Tijd voorbij!
                </h1>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    Wie de telefoon vasthoudt, verliest deze ronde en drinkt.
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
                <ActionButton onClick={onNewRound} className="text-lg">
                    <RotateCcw className="size-5" aria-hidden /> Nieuwe ronde
                </ActionButton>
            </div>
        </div>
    );
}
