import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    ArrowRight,
    Ban,
    Check,
    Minus,
    Play,
    Plus,
    RotateCcw,
    Timer,
    Trophy,
    Users,
    X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
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
import { dashboard } from '@/routes';

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

    return (
        <>
            <Head title="Verboden Woord" />
            <div className="relative flex min-h-[100dvh] flex-col overflow-hidden bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
                <div className="pointer-events-none absolute -top-32 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-indigo-300/40 blur-3xl dark:bg-indigo-600/30" />
                <div className="pointer-events-none absolute -bottom-40 -left-24 h-80 w-80 rounded-full bg-amber-300/40 blur-3xl dark:bg-amber-500/20" />
                <main className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
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
                </main>
            </div>
        </>
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

    return (
        <div className="flex flex-1 flex-col">
            <div className="mb-2">
                <Link
                    href={dashboard()}
                    className="inline-flex items-center gap-1 text-sm text-slate-500 transition hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                >
                    <ArrowLeft className="size-4" /> Dashboard
                </Link>
            </div>

            <header className="mb-6 text-center">
                <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-indigo-400/15 px-3 py-1 text-xs font-bold tracking-widest text-indigo-600 uppercase ring-1 ring-indigo-400/30 dark:text-indigo-300">
                    <Ban className="size-3.5" /> Pim Pam Pet
                </span>
                <h1 className="bg-gradient-to-br from-slate-900 via-indigo-700 to-amber-500 bg-clip-text text-4xl font-black tracking-tight text-transparent sm:text-5xl dark:from-white dark:via-indigo-200 dark:to-amber-200">
                    Verboden Woord
                </h1>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    Laat de groep het woord raden — maar gebruik nooit de
                    verboden woorden. Hoeveel haal je in jouw beurt?
                </p>
            </header>

            {resumable && (
                <button
                    type="button"
                    onClick={() => onResume(resumable.state)}
                    className="mb-4 flex w-full items-center gap-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3 text-left ring-1 ring-emerald-400/40 transition active:scale-[0.99] dark:from-emerald-500/20 dark:to-teal-500/20"
                >
                    <span className="flex size-10 items-center justify-center rounded-full bg-emerald-500/30">
                        <Play className="size-5 text-emerald-200" />
                    </span>
                    <span className="flex-1">
                        <span className="block text-sm font-bold text-white">
                            Ga verder
                        </span>
                        <span className="block text-xs text-emerald-200/80">
                            Ronde {resumable.state.round ?? 1}
                        </span>
                    </span>
                    <ArrowRight className="size-5 text-emerald-200" />
                </button>
            )}

            <section className="mb-5 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 backdrop-blur-sm dark:bg-white/5 dark:shadow-none dark:ring-white/10">
                <Stepper
                    label="Spelers"
                    icon={<Users className="size-4" />}
                    value={names.length}
                    min={MIN_PLAYERS}
                    max={MAX_PLAYERS}
                    onChange={setPlayerCount}
                />
            </section>

            <section className="mb-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-white/5 dark:shadow-none dark:ring-white/10">
                <h2 className="mb-3 flex items-center gap-2 text-sm font-medium">
                    <Timer className="size-4" /> Tijd per beurt
                </h2>
                <div className="grid grid-cols-3 gap-3">
                    {TURN_SECONDS_OPTIONS.map((option) => (
                        <button
                            key={option}
                            type="button"
                            onClick={() => setSeconds(option)}
                            className={cn(
                                'rounded-xl py-3 text-base font-bold ring-1 transition',
                                seconds === option
                                    ? 'bg-indigo-500 text-white ring-indigo-300'
                                    : 'bg-white text-slate-900 ring-slate-200 hover:bg-slate-200 dark:bg-white/5 dark:text-white dark:ring-white/10 dark:hover:bg-white/10',
                            )}
                        >
                            {option}s
                        </button>
                    ))}
                </div>
            </section>

            <section className="mb-5 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-white/5 dark:shadow-none dark:ring-white/10">
                <h2 className="mb-3 flex items-center gap-2 text-sm font-medium">
                    <RotateCcw className="size-4" /> Beurten per speler
                </h2>
                <div className="grid grid-cols-3 gap-3">
                    {ROUNDS_OPTIONS.map((option) => (
                        <button
                            key={option}
                            type="button"
                            onClick={() => setRounds(option)}
                            className={cn(
                                'rounded-xl py-3 text-base font-bold ring-1 transition',
                                rounds === option
                                    ? 'bg-indigo-500 text-white ring-indigo-300'
                                    : 'bg-white text-slate-900 ring-slate-200 hover:bg-slate-200 dark:bg-white/5 dark:text-white dark:ring-white/10 dark:hover:bg-white/10',
                            )}
                        >
                            {option}
                        </button>
                    ))}
                </div>
            </section>

            <section className="mb-5 space-y-2">
                <h2 className="px-1 text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
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
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/40 focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-500"
                        placeholder={`Speler ${index + 1}`}
                    />
                ))}
            </section>

            {history.length > 0 && <HistoryList history={history} />}

            <div className="mt-auto pt-2">
                {error && (
                    <p className="mb-3 text-center text-sm text-rose-600 dark:text-rose-400">
                        {error}
                    </p>
                )}
                <Button
                    onClick={start}
                    disabled={Boolean(error)}
                    className="h-14 w-full rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-lg font-bold text-white shadow-lg shadow-amber-900/40 hover:from-amber-400 hover:to-orange-400"
                >
                    Start spel
                    <ArrowRight className="size-5" />
                </Button>
            </div>
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
            <h2 className="mb-2 px-1 text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
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
                            className="flex items-center justify-between rounded-xl bg-white px-4 py-3 text-sm shadow-sm ring-1 ring-slate-200 dark:bg-white/5 dark:shadow-none dark:ring-white/10"
                        >
                            <span className="flex items-center gap-2">
                                <Trophy className="size-4 text-amber-600 dark:text-amber-300" />
                                <span className="font-medium text-slate-900 dark:text-white">
                                    {winner.names.join(' & ')}
                                </span>
                            </span>
                            <span className="text-xs text-slate-400 dark:text-slate-500">
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

function Stepper({
    label,
    icon,
    value,
    min,
    max,
    onChange,
}: {
    label: string;
    icon: React.ReactNode;
    value: number;
    min: number;
    max: number;
    onChange: (value: number) => void;
}) {
    return (
        <div className="flex items-center justify-between py-2">
            <span className="flex items-center gap-2 text-sm font-medium">
                {icon} {label}
            </span>
            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={() => onChange(value - 1)}
                    disabled={value <= min}
                    className="flex size-9 items-center justify-center rounded-full bg-slate-100 text-slate-900 transition hover:bg-slate-200 disabled:opacity-30 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
                >
                    <Minus className="size-4" />
                </button>
                <span className="w-6 text-center text-lg font-bold tabular-nums">
                    {value}
                </span>
                <button
                    type="button"
                    onClick={() => onChange(value + 1)}
                    disabled={value >= max}
                    className="flex size-9 items-center justify-center rounded-full bg-slate-100 text-slate-900 transition hover:bg-slate-200 disabled:opacity-30 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
                >
                    <Plus className="size-4" />
                </button>
            </div>
        </div>
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
    const [started, setStarted] = useState(false);
    const [secondsLeft, setSecondsLeft] = useState(game.seconds);
    const [turnScore, setTurnScore] = useState(0);
    const [card, setCard] = useState<ForbiddenCard>(game.currentCard);

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

    const nextCard = () => setCard((current) => pickCard(current));

    const correct = () => {
        setTurnScore((value) => value + 1);
        nextCard();
    };

    const foul = () => {
        setTurnScore((value) => value - 1);
        nextCard();
    };

    if (!started) {
        return (
            <div className="flex flex-1 flex-col">
                <div className="mb-4 flex items-center justify-between">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold tracking-wide text-slate-600 uppercase dark:bg-white/10 dark:text-slate-300">
                        Ronde {game.round} / {game.totalRounds}
                    </span>
                    <button
                        type="button"
                        onClick={onReset}
                        className="flex items-center gap-1 text-xs text-slate-500 transition hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                    >
                        <RotateCcw className="size-3.5" /> Nieuw spel
                    </button>
                </div>

                <div className="flex flex-1 flex-col items-center justify-center text-center">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Aan de beurt
                    </p>
                    <h1 className="mt-2 text-4xl font-black text-slate-900 dark:text-white">
                        {player}
                    </h1>
                    <p className="mt-4 max-w-xs text-sm text-slate-500 dark:text-slate-400">
                        Houd de telefoon zo dat alleen jij hem ziet. Laat de
                        groep het woord raden zonder de verboden woorden te
                        zeggen.
                    </p>
                </div>

                <div className="mt-auto pt-4">
                    <Button
                        onClick={() => setStarted(true)}
                        className="h-14 w-full rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-lg font-bold text-white hover:from-amber-400 hover:to-orange-400"
                    >
                        Start beurt ({game.seconds}s)
                    </Button>
                </div>
            </div>
        );
    }

    const urgent = secondsLeft <= 10;

    return (
        <div className="flex flex-1 flex-col">
            <div className="mb-4 flex items-center justify-between gap-2">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-900 dark:bg-white/10 dark:text-white">
                    {player}
                </span>
                <span
                    role="timer"
                    aria-live="polite"
                    aria-atomic="true"
                    className={cn(
                        'flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold tabular-nums ring-1',
                        urgent
                            ? 'animate-pulse bg-rose-500/15 text-rose-700 ring-rose-400/50 dark:bg-rose-500/20 dark:text-rose-300'
                            : 'bg-white text-slate-900 ring-slate-200 dark:bg-white/5 dark:text-white dark:ring-white/10',
                    )}
                >
                    <Timer className="size-4" />
                    <span aria-hidden="true">{secondsLeft}s</span>
                    <span className="sr-only">nog {secondsLeft} seconden</span>
                </span>
                <span className="rounded-full bg-indigo-500/15 px-3 py-1 text-sm font-bold text-indigo-700 tabular-nums dark:bg-indigo-500/20 dark:text-indigo-200">
                    {turnScore} pt
                </span>
                <button
                    type="button"
                    onClick={onReset}
                    aria-label="Nieuw spel"
                    className="flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200 active:scale-[0.97] dark:bg-white/10 dark:text-slate-300 dark:hover:bg-white/20"
                >
                    <RotateCcw className="size-4" />
                </button>
            </div>

            <div className="flex flex-1 flex-col items-center justify-center">
                <div className="w-full rounded-3xl bg-white p-6 text-center shadow-2xl">
                    <p className="text-xs font-semibold tracking-widest text-indigo-500 uppercase">
                        Jouw woord
                    </p>
                    <h1 className="mt-2 mb-5 text-4xl font-black break-words text-slate-900">
                        {card.word}
                    </h1>
                    <div className="space-y-1.5 border-t border-slate-200 pt-4">
                        <p className="mb-2 flex items-center justify-center gap-1.5 text-xs font-bold tracking-wide text-rose-500 uppercase">
                            <Ban className="size-3.5" /> Verboden
                        </p>
                        {card.forbidden.map((word) => (
                            <p
                                key={word}
                                className="text-lg font-semibold text-slate-700"
                            >
                                {word}
                            </p>
                        ))}
                    </div>
                </div>

                <div className="mt-5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                    <div
                        className={cn(
                            'h-full rounded-full transition-[width] duration-1000 ease-linear',
                            urgent ? 'bg-rose-500' : 'bg-indigo-500',
                        )}
                        style={{
                            width: `${(secondsLeft / game.seconds) * 100}%`,
                        }}
                    />
                </div>
            </div>

            <div className="mt-auto grid grid-cols-2 gap-3 pt-4">
                <Button
                    onClick={foul}
                    className="h-16 rounded-2xl bg-rose-500 text-lg font-bold text-white transition hover:bg-rose-400 active:scale-[0.97]"
                >
                    <X className="size-5" /> Fout
                </Button>
                <Button
                    onClick={correct}
                    className="h-16 rounded-2xl bg-emerald-500 text-lg font-bold text-white transition hover:bg-emerald-400 active:scale-[0.97]"
                >
                    <Check className="size-5" /> Goed
                </Button>
            </div>
        </div>
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

    const ranked = game.names
        .map((name, index) => ({ name, score: game.scores[index] }))
        .sort((a, b) => b.score - a.score);

    return (
        <div className="flex flex-1 flex-col">
            <div className="mt-6 mb-6 text-center">
                <Timer className="mx-auto size-12 text-indigo-600 dark:text-indigo-300" />
                <h1 className="mt-3 text-2xl font-black text-slate-900 dark:text-white">
                    Tijd voorbij!
                </h1>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    <span className="font-semibold text-slate-900 dark:text-white">
                        {player}
                    </span>{' '}
                    haalde{' '}
                    <span className="font-bold text-indigo-600 dark:text-indigo-300">
                        {game.turnScore}
                    </span>{' '}
                    {Math.abs(game.turnScore) === 1 ? 'punt' : 'punten'} deze
                    beurt.
                </p>
            </div>

            <h2 className="mb-2 px-1 text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
                Tussenstand
            </h2>
            <div className="space-y-2">
                {ranked.map((entry) => (
                    <div
                        key={entry.name}
                        className="flex items-center justify-between rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200 dark:bg-white/5 dark:shadow-none dark:ring-white/10"
                    >
                        <span className="text-base font-medium text-slate-900 dark:text-white">
                            {entry.name}
                        </span>
                        <span className="text-sm font-bold text-indigo-600 tabular-nums dark:text-indigo-300">
                            {entry.score} pt
                        </span>
                    </div>
                ))}
            </div>

            <div className="mt-auto pt-6">
                <Button
                    onClick={advance}
                    className="h-14 w-full rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-lg font-bold text-white hover:from-amber-400 hover:to-orange-400"
                >
                    Volgende speler
                    <ArrowRight className="size-5" />
                </Button>
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
    const ranked = game.names
        .map((name, index) => ({ name, score: game.scores[index] }))
        .sort((a, b) => b.score - a.score);

    const topScore = ranked.length > 0 ? ranked[0].score : 0;

    const playAgain = () => {
        setGame(startGame(game.names, game.seconds, game.totalRounds));
    };

    return (
        <div className="flex flex-1 flex-col">
            <div className="mt-6 mb-6 text-center">
                <Trophy className="mx-auto mb-3 size-12 text-amber-600 dark:text-amber-400" />
                <h1 className="text-3xl font-black text-slate-900 dark:text-white">
                    {ranked
                        .filter((entry) => entry.score === topScore)
                        .map((entry) => entry.name)
                        .join(' & ')}{' '}
                    wint!
                </h1>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    {topScore} punten
                </p>
            </div>

            <div className="space-y-2">
                {ranked.map((entry, index) => (
                    <div
                        key={entry.name}
                        className={cn(
                            'flex items-center justify-between rounded-xl px-4 py-3 ring-1',
                            entry.score === topScore
                                ? 'bg-amber-500/15 ring-amber-400/40'
                                : 'bg-white shadow-sm ring-slate-200 dark:bg-white/5 dark:shadow-none dark:ring-white/10',
                        )}
                    >
                        <span className="flex items-center gap-3 text-base font-medium text-slate-900 dark:text-white">
                            <span className="w-5 text-center text-sm font-bold text-slate-500 tabular-nums dark:text-slate-400">
                                {index + 1}
                            </span>
                            {entry.name}
                        </span>
                        <span className="text-sm font-bold text-amber-600 tabular-nums dark:text-amber-300">
                            {entry.score} pt
                        </span>
                    </div>
                ))}
            </div>

            <div className="mt-auto space-y-3 pt-6">
                <Button
                    onClick={playAgain}
                    className="h-14 w-full rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-lg font-bold text-white hover:from-amber-400 hover:to-orange-400"
                >
                    <RotateCcw className="size-5" /> Opnieuw — zelfde spelers
                </Button>
                <Button
                    onClick={onReset}
                    variant="ghost"
                    className="h-12 w-full rounded-2xl text-slate-600 dark:text-slate-300"
                >
                    Nieuw spel
                </Button>
            </div>
        </div>
    );
}
