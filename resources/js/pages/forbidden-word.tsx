import { router, usePage } from '@inertiajs/react';
import { motion, useReducedMotion } from 'framer-motion';
import {
    ArrowRight,
    Ban,
    Check,
    Crown,
    Play,
    Repeat,
    RotateCcw,
    Timer,
    TimerOff,
    Trophy,
    X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import {
    ActionButton,
    CelebrationHeader,
    CountUp,
    GameHeader,
    GameShell,
    Panel,
    PassPhoneGate,
    PhaseTransition,
    Stepper,
    TimerRing,
} from '@/components/game-ui';
import { feel } from '@/hooks/use-game-feel';
import {
    MAX_PLAYERS,
    MIN_PLAYERS,
    pickCard,
    ROUNDS_OPTIONS,
    TURN_SECONDS_OPTIONS,
} from '@/lib/forbidden-word';
import type { ForbiddenCard } from '@/lib/forbidden-word';
import { usePersistedGame } from '@/lib/use-persisted-game';
import { cn } from '@/lib/utils';

type Phase = 'play' | 'turnover' | 'gameover';

interface GameState {
    /** Identifies one game session on the client, across persistence calls. */
    localId: number;
    phase: Phase;
    names: string[];
    scores: number[];
    seconds: number;
    totalRounds: number;
    round: number;
    currentPlayer: number;
    /** Points the current (or just-finished) player earned this turn. */
    turnScore: number;
    currentCard: ForbiddenCard;
}

interface SavedGame {
    id: number;
    state: GameState;
}

interface HistoryEntry {
    id: number;
    state: GameState;
    finished_at: string | null;
}

interface PageProps {
    currentGame: SavedGame | null;
    history: HistoryEntry[];
    [key: string]: unknown;
}

/** One Goed/Fout tap; the id retriggers the card's feedback animation. */
interface TapFeedback {
    kind: 'good' | 'foul';
    id: number;
}

const CARD_FLASH: Record<TapFeedback['kind'], { from: string; to: string }> = {
    good: {
        from: '0 0 0 4px rgba(52, 211, 153, 0.65), 0 0 48px -6px rgba(52, 211, 153, 0.5)',
        to: '0 0 0 0px rgba(52, 211, 153, 0), 0 0 0px 0px rgba(52, 211, 153, 0)',
    },
    foul: {
        from: '0 0 0 4px rgba(244, 63, 94, 0.65), 0 0 48px -6px rgba(244, 63, 94, 0.5)',
        to: '0 0 0 0px rgba(244, 63, 94, 0), 0 0 0px 0px rgba(244, 63, 94, 0)',
    },
};

function defaultNames(count: number): string[] {
    return Array.from({ length: count }, (_, i) => `Speler ${i + 1}`);
}

export default function ForbiddenWord() {
    const { currentGame, history } = usePage<PageProps>().props;

    const [game, setGame] = useState<GameState | null>(null);

    usePersistedGame('forbidden-word', game, {
        serverId: currentGame?.id ?? null,
        localId: currentGame?.state.localId ?? 0,
    });

    const resetToSetup = () => {
        setGame(null);
        router.reload({ only: ['currentGame', 'history'] });
    };

    const phaseKey =
        game === null
            ? 'setup'
            : game.phase === 'play'
              ? `play-${game.round}-${game.currentPlayer}`
              : game.phase;

    return (
        <GameShell title="Verboden Woord" accent="rose">
            <PhaseTransition phaseKey={phaseKey}>
                {game === null ? (
                    <SetupScreen
                        resumable={currentGame}
                        history={history}
                        onResume={(state) => setGame(state)}
                        onStart={setGame}
                    />
                ) : game.phase === 'play' ? (
                    <PlayScreen
                        key={`${game.round}-${game.currentPlayer}`}
                        game={game}
                        setGame={setGame}
                        onReset={resetToSetup}
                    />
                ) : game.phase === 'turnover' ? (
                    <TurnoverScreen game={game} setGame={setGame} />
                ) : (
                    <GameOverScreen
                        game={game}
                        setGame={setGame}
                        onReset={resetToSetup}
                    />
                )}
            </PhaseTransition>
        </GameShell>
    );
}

function startGame(
    names: string[],
    seconds: number,
    totalRounds: number,
): GameState {
    return {
        localId: Date.now(),
        phase: 'play',
        names: names.map((name) => name.trim()),
        scores: names.map(() => 0),
        seconds,
        totalRounds,
        round: 1,
        currentPlayer: 0,
        turnScore: 0,
        currentCard: pickCard(),
    };
}

function SetupScreen({
    resumable,
    history,
    onResume,
    onStart,
}: {
    resumable: SavedGame | null;
    history: HistoryEntry[];
    onResume: (state: GameState) => void;
    onStart: (game: GameState) => void;
}) {
    const [names, setNames] = useState<string[]>(() => defaultNames(4));
    const [seconds, setSeconds] = useState(60);
    const [rounds, setRounds] = useState(2);

    const error = names.some((name) => name.trim() === '')
        ? 'Elke speler heeft een naam nodig.'
        : null;

    const setPlayerCount = (count: number) => {
        const next = Math.min(MAX_PLAYERS, Math.max(MIN_PLAYERS, count));

        setNames((current) => {
            if (next <= current.length) {
                return current.slice(0, next);
            }

            return [...current, ...defaultNames(next).slice(current.length)];
        });
    };

    const updateName = (index: number, value: string) => {
        setNames((current) =>
            current.map((name, i) => (i === index ? value : name)),
        );
    };

    const start = () => {
        if (error) {
            return;
        }

        onStart(startGame(names, seconds, rounds));
    };

    const resumeName =
        resumable?.state.names?.[resumable.state.currentPlayer] ?? null;

    return (
        <div className="flex flex-1 flex-col">
            <GameHeader
                kicker="Raadspel"
                title="Verboden Woord"
                description="Laat de groep het woord raden — maar gebruik nooit de verboden woorden. Hoeveel punten haal je in jouw beurt?"
            />

            {resumable && (
                <motion.button
                    type="button"
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                        feel.tap();
                        onResume(resumable.state);
                    }}
                    className="mb-5 flex w-full items-center gap-3 rounded-2xl bg-emerald-500/10 px-4 py-3 text-left ring-1 ring-emerald-400/30 transition hover:bg-emerald-500/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300">
                        <Play className="size-5" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                        <span className="block text-sm font-bold text-white">
                            Ga verder
                        </span>
                        <span className="block truncate text-xs text-emerald-300/80">
                            Ronde {resumable.state.round ?? 1}
                            {resumeName && ` · ${resumeName} is aan de beurt`}
                        </span>
                    </span>
                    <ArrowRight
                        className="size-5 shrink-0 text-emerald-300"
                        aria-hidden
                    />
                </motion.button>
            )}

            <Panel className="mb-5 space-y-4">
                <Stepper
                    label="Spelers"
                    value={names.length}
                    min={MIN_PLAYERS}
                    max={MAX_PLAYERS}
                    onChange={setPlayerCount}
                />

                <div className="border-t border-white/10 pt-4">
                    <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-300">
                        <Timer
                            className="size-4 text-(--glow-strong)"
                            aria-hidden
                        />
                        Tijd per beurt
                    </h2>
                    <ChoiceChips
                        options={TURN_SECONDS_OPTIONS}
                        value={seconds}
                        onSelect={setSeconds}
                        format={(option) => `${option}s`}
                    />
                </div>

                <div className="border-t border-white/10 pt-4">
                    <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-300">
                        <Repeat
                            className="size-4 text-(--glow-strong)"
                            aria-hidden
                        />
                        Beurten per speler
                    </h2>
                    <ChoiceChips
                        options={ROUNDS_OPTIONS}
                        value={rounds}
                        onSelect={setRounds}
                    />
                </div>
            </Panel>

            <section className="mb-5 space-y-2">
                <h2 className="px-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                    Namen
                </h2>
                {names.map((name, index) => (
                    <input
                        key={index}
                        value={name}
                        onChange={(event) =>
                            updateName(index, event.target.value)
                        }
                        maxLength={20}
                        className={cn(
                            'w-full rounded-xl bg-white/5 px-4 py-3 text-base text-white ring-1 transition placeholder:text-slate-500 focus:ring-2 focus:ring-(--glow) focus:outline-none',
                            name.trim() === ''
                                ? 'ring-rose-500/40'
                                : 'ring-white/10',
                        )}
                        placeholder={`Speler ${index + 1}`}
                    />
                ))}
            </section>

            {history.length > 0 && <HistoryList history={history} />}

            <div className="mt-auto pt-2">
                {error && (
                    <p
                        aria-live="polite"
                        className="mb-3 text-center text-sm text-rose-400"
                    >
                        {error}
                    </p>
                )}
                <ActionButton
                    onClick={start}
                    disabled={Boolean(error)}
                    className="text-lg"
                >
                    Start spel
                    <ArrowRight className="size-5" aria-hidden />
                </ActionButton>
            </div>
        </div>
    );
}

function ChoiceChips({
    options,
    value,
    onSelect,
    format = String,
}: {
    options: readonly number[];
    value: number;
    onSelect: (value: number) => void;
    format?: (value: number) => string;
}) {
    return (
        <div className="grid grid-cols-3 gap-2">
            {options.map((option) => {
                const selected = option === value;

                return (
                    <motion.button
                        key={option}
                        type="button"
                        aria-pressed={selected}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                            if (!selected) {
                                feel.select();
                                onSelect(option);
                            }
                        }}
                        className={cn(
                            'h-12 rounded-xl text-base font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-(--glow)',
                            selected
                                ? 'bg-(--glow) text-slate-950 shadow-[0_8px_24px_-10px_var(--glow)]'
                                : 'bg-white/5 text-white ring-1 ring-white/10 hover:bg-white/10',
                        )}
                    >
                        {format(option)}
                    </motion.button>
                );
            })}
        </div>
    );
}

function HistoryList({ history }: { history: HistoryEntry[] }) {
    const entries = history.filter(
        (entry) => entry.state?.names && entry.state.scores,
    );

    if (entries.length === 0) {
        return null;
    }

    return (
        <section className="mb-5">
            <h2 className="mb-2 px-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                Recente potjes
            </h2>
            <div className="space-y-2">
                {entries.map((entry) => {
                    const winner = winnerOf(
                        entry.state.names,
                        entry.state.scores,
                    );

                    return (
                        <div
                            key={entry.id}
                            className="flex items-center justify-between rounded-xl bg-white/[0.045] px-4 py-3 text-sm ring-1 ring-white/10"
                        >
                            <span className="flex min-w-0 items-center gap-2">
                                <Trophy
                                    className="size-4 shrink-0 text-amber-400"
                                    aria-hidden
                                />
                                <span className="truncate font-medium text-white">
                                    {winner.names.join(' & ')}
                                </span>
                            </span>
                            <span className="shrink-0 text-xs text-slate-500">
                                {winner.score} pt ·{' '}
                                {formatDate(entry.finished_at)}
                            </span>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}

function winnerOf(
    names: string[],
    scores: number[],
): { names: string[]; score: number } {
    const max = scores.length > 0 ? Math.max(...scores) : 0;

    return {
        names: names.filter((_, index) => scores[index] === max),
        score: max,
    };
}

function formatDate(value: string | null): string {
    if (!value) {
        return '';
    }

    return new Date(value).toLocaleDateString('nl-NL', {
        day: 'numeric',
        month: 'short',
    });
}

/**
 * Mid-game reset with a tiny inline confirm: the first tap arms it ("Zeker
 * weten?" for 3 seconds), the second tap actually abandons the game.
 */
function ArmedReset({
    onReset,
    compact = false,
}: {
    onReset: () => void;
    compact?: boolean;
}) {
    const [armed, setArmed] = useState(false);

    useEffect(() => {
        if (!armed) {
            return;
        }

        const id = window.setTimeout(() => setArmed(false), 3000);

        return () => window.clearTimeout(id);
    }, [armed]);

    return (
        <motion.button
            type="button"
            whileTap={{ scale: 0.95 }}
            aria-label={armed ? 'Bevestig: nieuw spel starten' : 'Nieuw spel'}
            onClick={() => {
                if (armed) {
                    feel.tap();
                    onReset();
                } else {
                    feel.select();
                    setArmed(true);
                }
            }}
            className={cn(
                'inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-full text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-(--glow)',
                armed
                    ? 'bg-rose-500/15 px-4 text-rose-300 ring-1 ring-rose-400/40'
                    : 'bg-white/5 text-slate-400 ring-1 ring-white/10 hover:bg-white/10 hover:text-white',
                compact && !armed ? 'w-11' : 'px-4',
            )}
        >
            <RotateCcw className="size-4" aria-hidden />
            {(!compact || armed) && (armed ? 'Zeker weten?' : 'Nieuw spel')}
        </motion.button>
    );
}

function PlayScreen({
    game,
    setGame,
    onReset,
}: {
    game: GameState;
    setGame: (game: GameState) => void;
    onReset: () => void;
}) {
    const reduceMotion = useReducedMotion();
    const [started, setStarted] = useState(false);
    const [secondsLeft, setSecondsLeft] = useState(game.seconds);
    const [turnScore, setTurnScore] = useState(0);
    const [card, setCard] = useState<ForbiddenCard>(game.currentCard);
    const [feedback, setFeedback] = useState<TapFeedback | null>(null);

    const player = game.names[game.currentPlayer];

    // Keep the latest turn result available to the (stale-closure-prone) timer.
    const endTurnRef = useRef<() => void>(() => {});

    useEffect(() => {
        endTurnRef.current = () => {
            const scores = game.scores.map((score, index) =>
                index === game.currentPlayer ? score + turnScore : score,
            );

            setGame({ ...game, scores, turnScore, phase: 'turnover' });
        };
    });

    useEffect(() => {
        if (!started) {
            return;
        }

        const id = window.setInterval(() => {
            setSecondsLeft((value) => {
                if (value <= 1) {
                    window.clearInterval(id);
                    endTurnRef.current();

                    return 0;
                }

                return value - 1;
            });
        }, 1000);

        return () => window.clearInterval(id);
    }, [started]);

    // Tension ticks in the final stretch — pure feedback, never gating logic.
    useEffect(() => {
        if (started && secondsLeft <= 10 && secondsLeft > 0) {
            feel.tick();
        }
    }, [started, secondsLeft]);

    const nextCard = () => setCard((current) => pickCard(current));

    const correct = () => {
        feel.success();
        setTurnScore((value) => value + 1);
        setFeedback((current) => ({
            kind: 'good',
            id: (current?.id ?? 0) + 1,
        }));
        nextCard();
    };

    const foul = () => {
        feel.fail();
        setTurnScore((value) => value - 1);
        setFeedback((current) => ({
            kind: 'foul',
            id: (current?.id ?? 0) + 1,
        }));
        nextCard();
    };

    if (!started) {
        return (
            <div className="flex flex-1 flex-col">
                <div className="mb-4 flex items-center justify-between gap-2">
                    <span className="inline-flex h-11 items-center rounded-full bg-white/5 px-4 text-xs font-semibold tracking-wide text-slate-300 uppercase ring-1 ring-white/10">
                        Ronde {game.round} / {game.totalRounds}
                    </span>
                    <ArmedReset onReset={onReset} />
                </div>

                <PassPhoneGate
                    name={player}
                    instruction="Geef de telefoon aan"
                    buttonLabel={`Start beurt (${game.seconds}s)`}
                    onReady={() => setStarted(true)}
                >
                    <p className="max-w-xs text-sm leading-relaxed text-slate-400">
                        Houd de telefoon zo dat alleen jij hem ziet. Laat de
                        groep het woord raden zonder de verboden woorden te
                        zeggen.
                    </p>
                </PassPhoneGate>
            </div>
        );
    }

    return (
        <div className="flex flex-1 flex-col">
            <div className="mb-3 flex items-center justify-between gap-2">
                <span className="flex h-11 min-w-0 items-center truncate rounded-full bg-(--glow)/12 px-4 text-sm font-semibold text-white ring-1 ring-(--glow)/25">
                    {player}
                </span>
                <div className="flex shrink-0 items-center gap-2">
                    <span
                        aria-live="polite"
                        className="relative flex h-11 items-center gap-1 rounded-full bg-white/5 px-4 text-sm font-bold tabular-nums ring-1 ring-white/10"
                    >
                        <span
                            className={
                                turnScore < 0 ? 'text-rose-300' : 'text-white'
                            }
                        >
                            {turnScore}
                        </span>
                        <span className="font-medium text-slate-400">pt</span>
                        {feedback && (
                            <motion.span
                                key={feedback.id}
                                aria-hidden
                                initial={{
                                    opacity: 0,
                                    y: reduceMotion ? 0 : 8,
                                }}
                                animate={{
                                    opacity: [0, 1, 1, 0],
                                    y: reduceMotion ? 0 : [8, -12, -16, -20],
                                }}
                                transition={{
                                    duration: 0.9,
                                    times: [0, 0.15, 0.6, 1],
                                    ease: 'easeOut',
                                }}
                                className={cn(
                                    'pointer-events-none absolute -top-4 right-3 font-display text-lg',
                                    feedback.kind === 'good'
                                        ? 'text-emerald-400'
                                        : 'text-rose-400',
                                )}
                            >
                                {feedback.kind === 'good' ? '+1' : '-1'}
                            </motion.span>
                        )}
                    </span>
                    <ArmedReset onReset={onReset} compact />
                </div>
            </div>

            <div className="flex flex-1 flex-col items-center justify-center">
                <div
                    role="timer"
                    aria-live="polite"
                    aria-atomic="true"
                    className="mb-4"
                >
                    <div aria-hidden="true">
                        <TimerRing
                            seconds={secondsLeft}
                            total={game.seconds}
                            size={120}
                        />
                    </div>
                    <span className="sr-only">nog {secondsLeft} seconden</span>
                </div>

                <motion.div
                    key={feedback?.id ?? 'deal'}
                    initial={
                        reduceMotion
                            ? { opacity: 1 }
                            : feedback === null
                              ? { opacity: 0, y: 18, scale: 0.97 }
                              : feedback.kind === 'good'
                                ? {
                                      scale: 0.95,
                                      boxShadow: CARD_FLASH.good.from,
                                  }
                                : { boxShadow: CARD_FLASH.foul.from }
                    }
                    animate={
                        feedback && !reduceMotion
                            ? {
                                  opacity: 1,
                                  y: 0,
                                  scale: 1,
                                  boxShadow: CARD_FLASH[feedback.kind].to,
                              }
                            : { opacity: 1, y: 0, scale: 1 }
                    }
                    transition={{
                        type: 'spring',
                        stiffness: 320,
                        damping: 24,
                        boxShadow: { duration: 0.6, ease: 'easeOut' },
                    }}
                    className={cn(
                        'w-full rounded-2xl',
                        feedback?.kind === 'foul' &&
                            !reduceMotion &&
                            'animate-shake',
                    )}
                >
                    <Panel className="p-6 text-center">
                        <p className="text-xs font-semibold tracking-widest text-(--glow-strong) uppercase">
                            Jouw woord
                        </p>
                        <h1 className="mt-2 mb-5 font-display text-4xl break-words text-white">
                            {card.word}
                        </h1>
                        <p className="mb-2 flex items-center justify-center gap-1.5 text-xs font-bold tracking-widest text-rose-400 uppercase">
                            <Ban className="size-3.5" aria-hidden /> Verboden
                        </p>
                        <ul className="space-y-1.5">
                            {card.forbidden.map((word) => (
                                <li
                                    key={word}
                                    className="flex items-center justify-center gap-2 rounded-xl bg-rose-500/10 px-3 py-2 ring-1 ring-rose-500/25"
                                >
                                    <Ban
                                        className="size-3.5 shrink-0 text-rose-400"
                                        aria-hidden
                                    />
                                    <span className="text-base font-semibold text-rose-100">
                                        {word}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </Panel>
                </motion.div>
            </div>

            <div className="mt-auto grid grid-cols-2 gap-3 pt-4">
                <ActionButton
                    variant="danger"
                    silent
                    onClick={foul}
                    className="h-16 text-lg"
                >
                    <X className="size-5" aria-hidden /> Fout
                </ActionButton>
                <ActionButton
                    variant="success"
                    silent
                    onClick={correct}
                    className="h-16 text-lg"
                >
                    <Check className="size-5" aria-hidden /> Goed
                </ActionButton>
            </div>
        </div>
    );
}

function ScoreBoard({
    names,
    scores,
    final = false,
}: {
    names: string[];
    scores: number[];
    final?: boolean;
}) {
    const reduceMotion = useReducedMotion();

    const ranked = names
        .map((name, index) => ({ name, score: scores[index] }))
        .sort((a, b) => b.score - a.score);

    const topScore = ranked.length > 0 ? ranked[0].score : 0;
    const delayBase = final ? 0.35 : 0.2;

    return (
        <ol className="space-y-2">
            {ranked.map((entry, index) => {
                const crowned =
                    entry.score === topScore && (final || topScore > 0);

                return (
                    <motion.li
                        key={entry.name}
                        initial={
                            reduceMotion
                                ? { opacity: 0 }
                                : { opacity: 0, y: 14 }
                        }
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                            delay: delayBase + index * 0.07,
                            type: 'spring',
                            stiffness: 320,
                            damping: 26,
                        }}
                        className={cn(
                            'flex items-center justify-between rounded-xl px-4 ring-1',
                            final && crowned
                                ? 'bg-(--glow)/12 py-4 shadow-[0_0_36px_-12px_var(--glow)] ring-(--glow)/45'
                                : crowned
                                  ? 'bg-white/[0.045] py-3 ring-(--glow)/30'
                                  : 'bg-white/[0.045] py-3 ring-white/10',
                        )}
                    >
                        <span className="flex min-w-0 items-center gap-3">
                            <span className="flex w-6 shrink-0 justify-center">
                                {crowned ? (
                                    <>
                                        <Crown
                                            className="size-4 text-amber-400"
                                            aria-hidden
                                        />
                                        <span className="sr-only">
                                            koploper
                                        </span>
                                    </>
                                ) : (
                                    <span className="text-sm font-bold text-slate-500 tabular-nums">
                                        {index + 1}
                                    </span>
                                )}
                            </span>
                            <span
                                className={cn(
                                    'truncate',
                                    final && crowned
                                        ? 'font-display text-xl text-white'
                                        : 'text-base font-medium text-white',
                                )}
                            >
                                {entry.name}
                            </span>
                        </span>
                        <span
                            className={cn(
                                'shrink-0 text-sm font-bold tabular-nums',
                                crowned
                                    ? 'text-(--glow-strong)'
                                    : 'text-slate-300',
                            )}
                        >
                            <CountUp value={entry.score} /> pt
                        </span>
                    </motion.li>
                );
            })}
        </ol>
    );
}

function TurnoverScreen({
    game,
    setGame,
}: {
    game: GameState;
    setGame: (game: GameState) => void;
}) {
    const player = game.names[game.currentPlayer];

    const advance = () => {
        let nextPlayer = game.currentPlayer + 1;
        let nextRound = game.round;

        if (nextPlayer >= game.names.length) {
            nextPlayer = 0;
            nextRound = game.round + 1;
        }

        if (nextRound > game.totalRounds) {
            setGame({ ...game, phase: 'gameover' });

            return;
        }

        setGame({
            ...game,
            phase: 'play',
            currentPlayer: nextPlayer,
            round: nextRound,
            turnScore: 0,
            currentCard: pickCard(game.currentCard),
        });
    };

    return (
        <div className="flex flex-1 flex-col">
            <CelebrationHeader
                icon={TimerOff}
                tone="lose"
                title="Tijd is om!"
                subtitle={
                    <span>
                        <span className="font-semibold text-slate-200">
                            {player}
                        </span>{' '}
                        haalde deze beurt
                    </span>
                }
                className="mt-4 mb-7"
            >
                <div
                    aria-live="polite"
                    className="flex items-baseline justify-center gap-2"
                >
                    <span
                        className={cn(
                            'font-display text-5xl tabular-nums',
                            game.turnScore > 0
                                ? 'text-emerald-400'
                                : game.turnScore < 0
                                  ? 'text-rose-400'
                                  : 'text-slate-300',
                        )}
                    >
                        {game.turnScore > 0 && '+'}
                        <CountUp value={game.turnScore} />
                    </span>
                    <span className="text-sm text-slate-400">
                        {Math.abs(game.turnScore) === 1 ? 'punt' : 'punten'}
                    </span>
                </div>
            </CelebrationHeader>

            <h2 className="mb-2 px-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                Tussenstand
            </h2>
            <ScoreBoard names={game.names} scores={game.scores} />

            <div className="mt-auto pt-6">
                <ActionButton onClick={advance} className="text-lg">
                    Volgende speler
                    <ArrowRight className="size-5" aria-hidden />
                </ActionButton>
            </div>
        </div>
    );
}

function GameOverScreen({
    game,
    setGame,
    onReset,
}: {
    game: GameState;
    setGame: (game: GameState) => void;
    onReset: () => void;
}) {
    const winner = winnerOf(game.names, game.scores);

    const playAgain = () => {
        setGame(startGame(game.names, game.seconds, game.totalRounds));
    };

    return (
        <div className="flex flex-1 flex-col">
            <CelebrationHeader
                icon={Trophy}
                tone="win"
                title={`${winner.names.join(' & ')} wint!`}
                subtitle={
                    <span>
                        <CountUp
                            value={winner.score}
                            className="font-semibold text-(--glow-strong)"
                        />{' '}
                        punten
                    </span>
                }
                className="mt-4 mb-8"
            />

            <h2 className="mb-2 px-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                Eindstand
            </h2>
            <ScoreBoard names={game.names} scores={game.scores} final />

            <div className="mt-auto space-y-3 pt-6">
                <ActionButton onClick={playAgain} className="text-lg">
                    <RotateCcw className="size-5" aria-hidden /> Opnieuw —
                    zelfde spelers
                </ActionButton>
                <ActionButton
                    variant="neutral"
                    onClick={onReset}
                    className="h-12"
                >
                    Nieuw spel
                </ActionButton>
            </div>
        </div>
    );
}
