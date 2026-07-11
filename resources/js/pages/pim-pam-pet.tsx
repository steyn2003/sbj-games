import { motion, useReducedMotion } from 'framer-motion';
import { RotateCcw, Timer, TimerOff } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
    ActionButton,
    CelebrationHeader,
    GameHeader,
    GameShell,
    Panel,
    PhaseTransition,
} from '@/components/game-ui';
import { feel } from '@/hooks/use-game-feel';
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
        <GameShell title="Pim Pam Pet" accent="orange">
            <PhaseTransition phaseKey={phase}>
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
            </PhaseTransition>
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
                <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-300">
                    <Timer
                        className="size-4 text-(--glow-strong)"
                        aria-hidden
                    />
                    Tijd per beurt
                </h2>
                <div className="grid grid-cols-3 gap-3">
                    {TURN_SECONDS_OPTIONS.map((option) => (
                        <motion.button
                            key={option}
                            type="button"
                            aria-pressed={seconds === option}
                            whileTap={{ scale: 0.95 }}
                            transition={{
                                type: 'spring',
                                stiffness: 500,
                                damping: 25,
                            }}
                            onClick={() => {
                                feel.select();
                                onSelectSeconds(option);
                            }}
                            className={cn(
                                'h-12 rounded-xl text-base font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-(--glow)',
                                seconds === option
                                    ? 'bg-(--glow) text-slate-950 shadow-[0_0_28px_-8px_var(--glow)]'
                                    : 'bg-white/5 text-white ring-1 ring-white/10 hover:bg-white/10',
                            )}
                        >
                            {option}s
                        </motion.button>
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

/**
 * Cumulative delays for the letter-wheel flicks: fast at first, then an
 * ease-out deceleration into the landing.
 */
const WHEEL_TICKS_MS = [
    0, 70, 140, 215, 300, 395, 505, 635, 790, 975, 1195,
] as const;
const WHEEL_LANDING_MS = 1450;

/**
 * The signature Pim Pam Pet moment: a letter wheel that flicks through
 * random letters, decelerates, and lands on the drawn letter with a pop.
 * Purely visual — the letter is already decided when this mounts.
 */
function LetterWheel({ letter }: { letter: string }) {
    const reduceMotion = useReducedMotion();
    const [shown, setShown] = useState(letter);
    const [spinDone, setSpinDone] = useState(false);

    useEffect(() => {
        if (reduceMotion) {
            return;
        }

        const timers = WHEEL_TICKS_MS.map((at) =>
            window.setTimeout(() => {
                feel.tick();
                setShown((current) => pickRandom(LETTERS, current));
            }, at),
        );

        timers.push(
            window.setTimeout(() => {
                setShown(letter);
                setSpinDone(true);
                feel.success();
            }, WHEEL_LANDING_MS),
        );

        return () => timers.forEach((id) => window.clearTimeout(id));
    }, [letter, reduceMotion]);

    // Under reduced motion the wheel skips straight to the drawn letter.
    const landed = reduceMotion || spinDone;
    const shownLetter = reduceMotion ? letter : shown;

    return (
        <div className="relative">
            <motion.div
                animate={
                    landed
                        ? { scale: 1, opacity: 1 }
                        : { scale: 0.92, opacity: 0.85 }
                }
                transition={
                    landed
                        ? { type: 'spring', stiffness: 300, damping: 15 }
                        : { duration: 0.15 }
                }
                className={cn(
                    'flex size-40 items-center justify-center rounded-3xl bg-(--glow) text-slate-950 transition-shadow duration-500',
                    landed
                        ? 'shadow-[0_0_60px_-12px_var(--glow)]'
                        : 'shadow-[0_0_36px_-18px_var(--glow)]',
                )}
            >
                <span
                    aria-hidden
                    className="font-display text-8xl leading-none"
                >
                    {shownLetter}
                </span>
            </motion.div>
            <span aria-live="polite" className="sr-only">
                {landed ? `De letter is ${letter}` : 'Het letterwiel draait'}
            </span>
        </div>
    );
}

/**
 * Sprint-sized countdown ring: same visual language as the kit's TimerRing
 * but tuned for 5-15 second turns (bare seconds, urgent at 3s or less).
 */
function SprintRing({
    secondsLeft,
    total,
}: {
    secondsLeft: number;
    total: number;
}) {
    const size = 120;
    const stroke = 8;
    const radius = (size - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    const fraction = total > 0 ? Math.max(0, secondsLeft / total) : 0;
    const urgent = secondsLeft <= 3;

    return (
        <div
            className="relative inline-flex items-center justify-center"
            style={{ width: size, height: size }}
        >
            <svg width={size} height={size} className="-rotate-90">
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    strokeWidth={stroke}
                    className="stroke-white/10"
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    strokeWidth={stroke}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference * (1 - fraction)}
                    className={cn(
                        'transition-[stroke-dashoffset,stroke] duration-1000 ease-linear',
                        urgent ? 'stroke-rose-400' : 'stroke-(--glow)',
                    )}
                />
            </svg>
            <span
                aria-hidden
                className={cn(
                    'absolute font-display text-5xl tabular-nums',
                    urgent ? 'animate-pulse text-rose-300' : 'text-white',
                )}
            >
                {secondsLeft}
            </span>
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

    // Heartbeat ticks in the final stretch — decoration only, never gates.
    useEffect(() => {
        if (secondsLeft <= 3 && secondsLeft > 0) {
            feel.tick();
        }
    }, [secondsLeft]);

    return (
        <div className="flex flex-1 flex-col">
            <div className="flex flex-1 flex-col items-center justify-center gap-6">
                <Panel className="flex w-full flex-col items-center gap-5 px-4 py-6 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                    >
                        <p className="text-xs font-semibold tracking-widest text-(--glow-strong) uppercase">
                            Categorie
                        </p>
                        <p className="mt-1 text-2xl leading-tight font-bold text-white">
                            {category}
                        </p>
                    </motion.div>

                    <LetterWheel letter={letter} />

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.3 }}
                        className="text-sm text-slate-400"
                    >
                        Noem iets in{' '}
                        <span className="font-semibold text-slate-200">
                            {category}
                        </span>{' '}
                        met de letter{' '}
                        <span className="font-semibold text-slate-200">
                            {letter}
                        </span>
                    </motion.p>
                </Panel>

                <div role="timer" aria-live="polite" aria-atomic="true">
                    <span className="sr-only">
                        {urgent ? 'Nog 3 seconden' : `Nog ${seconds} seconden`}
                    </span>
                    <SprintRing secondsLeft={secondsLeft} total={seconds} />
                </div>
            </div>

            <div className="mt-auto pt-4">
                <ActionButton
                    variant="success"
                    silent
                    onClick={() => {
                        feel.success();
                        onPass();
                    }}
                    className="text-lg"
                >
                    Gehaald, geef door
                </ActionButton>
                <p className="mt-2 text-center text-xs text-slate-500">
                    De tijd start opnieuw voor de volgende speler ({seconds}s)
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
    const reduceMotion = useReducedMotion();

    // Buzz the phone on timeout for the "drink!" payoff. Runs after
    // CelebrationHeader's fail feedback, so the long buzz wins.
    useEffect(() => {
        navigator.vibrate?.(400);
    }, []);

    return (
        <div className="flex flex-1 flex-col">
            <div
                className={cn(
                    'flex flex-1 flex-col items-center justify-center',
                    !reduceMotion && 'animate-shake',
                )}
            >
                <div aria-live="assertive">
                    <CelebrationHeader
                        icon={TimerOff}
                        tone="lose"
                        title="Tijd is om!"
                        subtitle="Wie de telefoon vasthoudt, verliest deze ronde en drinkt."
                    >
                        <p className="text-sm text-slate-500">
                            Categorie was{' '}
                            <span className="font-semibold text-slate-300">
                                {category}
                            </span>{' '}
                            · letter{' '}
                            <span className="font-semibold text-slate-300">
                                {letter}
                            </span>
                        </p>
                    </CelebrationHeader>
                </div>
            </div>

            <div className="mt-auto pt-4">
                <ActionButton onClick={onNewRound} className="text-lg">
                    <RotateCcw className="size-5" aria-hidden /> Nieuwe ronde
                </ActionButton>
            </div>
        </div>
    );
}
