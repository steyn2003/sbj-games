import { router, usePage } from '@inertiajs/react';
import { motion, useReducedMotion } from 'framer-motion';
import {
    ArrowRight,
    Eye,
    EyeOff,
    MapPin,
    Play,
    RotateCcw,
    Timer,
    Trophy,
    VenetianMask,
    Vote,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
    ActionButton,
    CelebrationHeader,
    FlipCard,
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
    dealSpyLocation,
    isLocationGuessCorrect,
    LOCATIONS,
    MAX_PLAYERS,
    MIN_PLAYERS,
    spies,
    TIMER_MINUTES_OPTIONS,
    validateSettings,
} from '@/lib/spy-location';
import type { SpyPlayer, SpySettings, SpyWinner } from '@/lib/spy-location';
import { usePersistedGame } from '@/lib/use-persisted-game';
import { cn } from '@/lib/utils';

type Phase = 'reveal' | 'discuss' | 'vote' | 'spyguess' | 'gameover';

interface GameState {
    /** Identifies one game session on the client, across persistence calls. */
    localId: number;
    phase: Phase;
    players: SpyPlayer[];
    location: string;
    revealIndex: number;
    timerSeconds: number;
    votedId: number | null;
    winner: SpyWinner | null;
    spyGuessedRight: boolean;
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

export default function SpyLocation() {
    const { currentGame, history } = usePage<PageProps>().props;

    const [game, setGame] = useState<GameState | null>(null);

    usePersistedGame('spy-location', game, {
        serverId: currentGame?.id ?? null,
        localId: currentGame?.state.localId ?? 0,
    });

    const resetToSetup = () => {
        setGame(null);
        router.reload({ only: ['currentGame', 'history'] });
    };

    return (
        <GameShell title="Spion" accent="cyan">
            <PhaseTransition phaseKey={game === null ? 'setup' : game.phase}>
                {game === null ? (
                    <SetupScreen
                        resumable={currentGame}
                        history={history}
                        onResume={(state) => setGame(state)}
                        onStart={setGame}
                    />
                ) : (
                    <PlayScreen
                        game={game}
                        setGame={setGame}
                        onReset={resetToSetup}
                    />
                )}
            </PhaseTransition>
        </GameShell>
    );
}

function startGame(settings: SpySettings, timerSeconds: number): GameState {
    const { players, location } = dealSpyLocation(settings);

    return {
        localId: Date.now(),
        phase: 'reveal',
        players,
        location,
        revealIndex: 0,
        timerSeconds,
        votedId: null,
        winner: null,
        spyGuessedRight: false,
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
    const [spyCount, setSpyCount] = useState(1);
    const [minutes, setMinutes] = useState(5);

    const settings: SpySettings = useMemo(
        () => ({ names, spyCount }),
        [names, spyCount],
    );
    const error = validateSettings(settings);

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

        onStart(startGame(settings, minutes * 60));
    };

    return (
        <div className="flex flex-1 flex-col">
            <GameHeader
                kicker="Blufspel"
                title="Spion"
                description="Iedereen kent de geheime locatie — behalve de Spion. Stel vragen, ontmasker de Spion, of bluf je naar de winst."
            />

            {resumable && (
                <motion.button
                    type="button"
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                        feel.tap();
                        onResume(resumable.state);
                    }}
                    className="mb-4 flex w-full items-center gap-3 rounded-2xl bg-white/[0.045] px-4 py-3 text-left ring-1 ring-white/10 transition hover:bg-white/[0.08] focus:outline-none focus-visible:ring-2 focus-visible:ring-(--glow)"
                >
                    <span className="flex size-10 items-center justify-center rounded-xl bg-(--glow)/12 text-(--glow-strong) ring-1 ring-(--glow)/25">
                        <Play className="size-5" aria-hidden />
                    </span>
                    <span className="flex-1">
                        <span className="block text-sm font-bold text-white">
                            Ga verder
                        </span>
                        <span className="block text-xs text-slate-400">
                            {resumable.state.players?.length ?? 0} spelers
                        </span>
                    </span>
                    <ArrowRight className="size-5 text-slate-500" aria-hidden />
                </motion.button>
            )}

            <Panel className="mb-5 space-y-3">
                <Stepper
                    label="Spelers"
                    value={names.length}
                    min={MIN_PLAYERS}
                    max={MAX_PLAYERS}
                    onChange={setPlayerCount}
                />
                <Stepper
                    label="Spionnen"
                    value={spyCount}
                    min={1}
                    max={Math.max(1, names.length - 2)}
                    onChange={(value) =>
                        setSpyCount(
                            Math.min(
                                Math.max(1, value),
                                Math.max(1, names.length - 2),
                            ),
                        )
                    }
                />
            </Panel>

            <Panel className="mb-5">
                <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-300">
                    <Timer className="size-4" aria-hidden /> Tijd om te
                    overleggen
                </h2>
                <div className="grid grid-cols-3 gap-3">
                    {TIMER_MINUTES_OPTIONS.map((option) => (
                        <motion.button
                            key={option}
                            type="button"
                            whileTap={{ scale: 0.96 }}
                            onClick={() => {
                                feel.select();
                                setMinutes(option);
                            }}
                            aria-pressed={minutes === option}
                            className={cn(
                                'rounded-xl py-3 text-base font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-(--glow)',
                                minutes === option
                                    ? 'bg-(--glow) text-slate-950 shadow-[0_0_24px_-8px_var(--glow)]'
                                    : 'bg-white/5 text-white ring-1 ring-white/10 hover:bg-white/10',
                            )}
                        >
                            {option} min
                        </motion.button>
                    ))}
                </div>
            </Panel>

            <section className="mb-5 space-y-2">
                <h2 className="px-1 text-xs font-semibold tracking-wide text-slate-400 uppercase">
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
                        className="w-full rounded-xl bg-white/5 px-4 py-3 text-base text-white ring-1 ring-white/10 placeholder:text-slate-500 focus:ring-2 focus:ring-(--glow) focus:outline-none"
                        placeholder={`Speler ${index + 1}`}
                    />
                ))}
            </section>

            {history.length > 0 && <HistoryList history={history} />}

            <div className="mt-auto pt-2">
                {error && (
                    <p className="mb-3 text-center text-sm text-rose-400">
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

function HistoryList({ history }: { history: HistoryEntry[] }) {
    const entries = history.filter(
        (entry) => entry.state?.location && entry.state.winner,
    );

    if (entries.length === 0) {
        return null;
    }

    return (
        <section className="mb-5">
            <h2 className="mb-2 px-1 text-xs font-semibold tracking-wide text-slate-400 uppercase">
                Recente potjes
            </h2>
            <div className="space-y-2">
                {entries.map((entry) => {
                    const playersWon = entry.state.winner === 'players';

                    return (
                        <div
                            key={entry.id}
                            className="flex items-center justify-between rounded-xl bg-white/[0.045] px-4 py-3 text-sm ring-1 ring-white/10"
                        >
                            <span className="flex items-center gap-2">
                                <span
                                    className={cn(
                                        'rounded-full px-2 py-0.5 text-xs font-bold',
                                        playersWon
                                            ? 'bg-emerald-400/15 text-emerald-300'
                                            : 'bg-rose-400/15 text-rose-300',
                                    )}
                                >
                                    {playersWon
                                        ? 'Spelers wonnen'
                                        : 'Spion won'}
                                </span>
                                <span className="text-slate-400">
                                    {entry.state.location}
                                </span>
                            </span>
                            <span className="text-xs text-slate-500">
                                {formatDate(entry.finished_at)}
                            </span>
                        </div>
                    );
                })}
            </div>
        </section>
    );
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
 * Mid-game "Nieuw spel" escape hatch with an inline arm-confirm: the first
 * tap arms it for three seconds, the second tap actually abandons the round.
 */
function ResetLink({ onReset }: { onReset: () => void }) {
    const [armed, setArmed] = useState(false);

    useEffect(() => {
        if (!armed) {
            return;
        }

        const id = window.setTimeout(() => setArmed(false), 3000);

        return () => window.clearTimeout(id);
    }, [armed]);

    return (
        <button
            type="button"
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
                'flex h-11 items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-(--glow)',
                armed
                    ? 'bg-rose-500/15 text-rose-300 ring-1 ring-rose-400/40'
                    : 'text-slate-400 hover:text-white',
            )}
        >
            <RotateCcw className="size-3.5" aria-hidden />
            {armed ? 'Zeker weten?' : 'Nieuw spel'}
        </button>
    );
}

function PhaseTop({ label, onReset }: { label: string; onReset: () => void }) {
    return (
        <div className="mb-4 flex items-center justify-between">
            <span className="rounded-full bg-(--glow)/10 px-3 py-1 text-xs font-semibold tracking-widest text-(--glow-strong) uppercase ring-1 ring-(--glow)/20">
                {label}
            </span>
            <ResetLink onReset={onReset} />
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
    switch (game.phase) {
        case 'reveal':
            return <RevealScreen game={game} setGame={setGame} />;
        case 'discuss':
            return (
                <DiscussScreen
                    game={game}
                    setGame={setGame}
                    onReset={onReset}
                />
            );
        case 'vote':
            return (
                <VoteScreen game={game} setGame={setGame} onReset={onReset} />
            );
        case 'spyguess':
            return (
                <SpyGuessScreen
                    game={game}
                    setGame={setGame}
                    onReset={onReset}
                />
            );
        case 'gameover':
            return (
                <GameOverScreen
                    game={game}
                    setGame={setGame}
                    onReset={onReset}
                />
            );
        default:
            return null;
    }
}

function SpyCardBack() {
    const reduceMotion = useReducedMotion();

    return (
        <div
            role="status"
            aria-live="polite"
            className="flex size-full flex-col items-center justify-center gap-4 rounded-3xl bg-rose-500/10 p-6 text-center shadow-[0_0_60px_-18px_var(--color-rose-500)] ring-1 ring-rose-400/30"
        >
            <motion.span
                aria-hidden
                initial={
                    reduceMotion
                        ? { opacity: 0 }
                        : { scale: 0, rotate: -14, opacity: 0 }
                }
                animate={
                    reduceMotion
                        ? { opacity: 1 }
                        : { scale: 1, rotate: 0, opacity: 1 }
                }
                transition={{
                    delay: 0.18,
                    type: 'spring',
                    stiffness: 320,
                    damping: 18,
                }}
                className="flex size-20 items-center justify-center rounded-3xl bg-rose-400/15 text-rose-300 ring-1 ring-rose-400/30"
            >
                <VenetianMask className="size-10" />
            </motion.span>
            <motion.span
                initial={
                    reduceMotion ? { opacity: 0 } : { scale: 1.7, opacity: 0 }
                }
                animate={
                    reduceMotion ? { opacity: 1 } : { scale: 1, opacity: 1 }
                }
                transition={{
                    delay: 0.32,
                    type: 'spring',
                    stiffness: 300,
                    damping: 20,
                }}
                className="font-display text-4xl text-rose-300"
            >
                Spion
            </motion.span>
            <p className="text-sm text-slate-300">
                Jij kent de locatie niet. Stel slimme vragen en raad hem!
            </p>
        </div>
    );
}

function LocationCardBack({
    playerName,
    location,
}: {
    playerName: string;
    location: string;
}) {
    const reduceMotion = useReducedMotion();

    return (
        <div
            role="status"
            aria-live="polite"
            className="flex size-full flex-col items-center justify-center gap-4 rounded-3xl bg-emerald-500/10 p-6 text-center shadow-[0_0_60px_-18px_var(--color-emerald-500)] ring-1 ring-emerald-400/30"
        >
            <p className="text-sm font-medium text-slate-300">
                {playerName}, de locatie is
            </p>
            <motion.span
                aria-hidden
                initial={
                    reduceMotion
                        ? { opacity: 0 }
                        : { scale: 0, rotate: 12, opacity: 0 }
                }
                animate={
                    reduceMotion
                        ? { opacity: 1 }
                        : { scale: 1, rotate: 0, opacity: 1 }
                }
                transition={{
                    delay: 0.18,
                    type: 'spring',
                    stiffness: 320,
                    damping: 18,
                }}
                className="flex size-16 items-center justify-center rounded-2xl bg-emerald-400/15 text-emerald-300 ring-1 ring-emerald-400/30"
            >
                <MapPin className="size-8" />
            </motion.span>
            <motion.span
                initial={
                    reduceMotion ? { opacity: 0 } : { scale: 1.6, opacity: 0 }
                }
                animate={
                    reduceMotion ? { opacity: 1 } : { scale: 1, opacity: 1 }
                }
                transition={{
                    delay: 0.32,
                    type: 'spring',
                    stiffness: 300,
                    damping: 20,
                }}
                className="font-display text-4xl break-words text-white"
            >
                {location}
            </motion.span>
        </div>
    );
}

function RevealScreen({
    game,
    setGame,
}: {
    game: GameState;
    setGame: (game: GameState) => void;
}) {
    const [claimed, setClaimed] = useState(false);
    const [revealed, setRevealed] = useState(false);
    const player = game.players[game.revealIndex];
    const isLast = game.revealIndex === game.players.length - 1;

    const reveal = () => {
        if (revealed) {
            return;
        }

        feel.flip();
        setRevealed(true);
    };

    const next = () => {
        // Hide first, so the next card can never render face-up.
        setRevealed(false);
        setClaimed(false);

        if (isLast) {
            setGame({ ...game, phase: 'discuss' });
        } else {
            setGame({ ...game, revealIndex: game.revealIndex + 1 });
        }
    };

    return (
        <div className="flex flex-1 flex-col">
            <div className="mb-2 flex flex-col items-center gap-2">
                <div className="flex items-center gap-1.5">
                    {game.players.map((dot, index) => (
                        <span
                            key={dot.id}
                            aria-hidden
                            className={cn(
                                'h-1.5 rounded-full transition-all',
                                index < game.revealIndex
                                    ? 'w-1.5 bg-(--glow)/60'
                                    : index === game.revealIndex
                                      ? 'w-5 bg-(--glow)'
                                      : 'w-1.5 bg-white/15',
                            )}
                        />
                    ))}
                </div>
                <p className="text-xs font-medium text-slate-500">
                    Kaart {game.revealIndex + 1} van {game.players.length}
                </p>
            </div>

            <PhaseTransition
                phaseKey={`${player.id}:${claimed ? 'card' : 'gate'}`}
            >
                {!claimed ? (
                    <PassPhoneGate
                        name={player.name}
                        instruction="Geef de telefoon aan"
                        onReady={() => setClaimed(true)}
                    >
                        <p className="text-xs text-slate-500">
                            Zorg dat niemand anders meekijkt.
                        </p>
                    </PassPhoneGate>
                ) : (
                    <>
                        <div className="flex flex-1 items-center justify-center py-4">
                            <FlipCard
                                revealed={revealed}
                                className="aspect-[3/4] w-full max-w-xs"
                                front={
                                    <button
                                        type="button"
                                        onClick={reveal}
                                        className="relative flex size-full flex-col items-center justify-center gap-4 overflow-hidden rounded-3xl bg-white/[0.045] p-6 text-center ring-1 ring-white/10 transition hover:bg-white/[0.07] focus:outline-none focus-visible:ring-2 focus-visible:ring-(--glow)"
                                    >
                                        <VenetianMask
                                            aria-hidden
                                            className="pointer-events-none absolute -top-5 -right-5 size-28 rotate-12 text-white/[0.05]"
                                        />
                                        <span className="text-[11px] font-semibold tracking-widest text-(--glow-strong) uppercase">
                                            Geheime kaart
                                        </span>
                                        <span className="font-display text-3xl break-words text-white">
                                            {player.name}
                                        </span>
                                        <span className="flex items-center gap-2 rounded-full bg-(--glow)/12 px-4 py-2 text-sm font-medium text-(--glow-strong) ring-1 ring-(--glow)/25">
                                            <Eye
                                                className="size-4"
                                                aria-hidden
                                            />{' '}
                                            Tik om je kaart te zien
                                        </span>
                                        <span className="text-xs text-slate-500">
                                            Zorg dat niemand meekijkt
                                        </span>
                                    </button>
                                }
                                back={
                                    player.isSpy ? (
                                        <SpyCardBack />
                                    ) : (
                                        <LocationCardBack
                                            playerName={player.name}
                                            location={game.location}
                                        />
                                    )
                                }
                            />
                        </div>
                        <div className="mt-auto pt-4">
                            {revealed ? (
                                <ActionButton
                                    onClick={next}
                                    className="text-lg"
                                >
                                    <EyeOff className="size-5" aria-hidden />
                                    {isLast
                                        ? 'Klaar — start het overleg'
                                        : 'Verberg & geef door'}
                                </ActionButton>
                            ) : (
                                <p className="text-center text-sm text-slate-400">
                                    Tik op de kaart om je geheime rol te zien.
                                </p>
                            )}
                        </div>
                    </>
                )}
            </PhaseTransition>
        </div>
    );
}

function DiscussScreen({
    game,
    setGame,
    onReset,
}: {
    game: GameState;
    setGame: (game: GameState) => void;
    onReset: () => void;
}) {
    const [secondsLeft, setSecondsLeft] = useState(game.timerSeconds);
    const reduceMotion = useReducedMotion();

    useEffect(() => {
        const id = window.setInterval(() => {
            setSecondsLeft((value) => (value <= 1 ? 0 : value - 1));
        }, 1000);

        return () => window.clearInterval(id);
    }, []);

    useEffect(() => {
        if (secondsLeft === 0) {
            feel.fail();
        } else if (secondsLeft <= 10) {
            feel.tick();
        }
    }, [secondsLeft]);

    const timeUp = secondsLeft === 0;

    return (
        <div className="flex flex-1 flex-col">
            <PhaseTop label="Overleg" onReset={onReset} />

            <div className="mb-4 flex flex-col items-center">
                <TimerRing
                    seconds={secondsLeft}
                    total={game.timerSeconds}
                    size={160}
                />
                {timeUp ? (
                    <motion.div
                        role="status"
                        aria-live="assertive"
                        initial={
                            reduceMotion
                                ? { opacity: 0 }
                                : { scale: 1.5, opacity: 0 }
                        }
                        animate={
                            reduceMotion
                                ? { opacity: 1 }
                                : { scale: 1, opacity: 1 }
                        }
                        transition={{
                            type: 'spring',
                            stiffness: 300,
                            damping: 18,
                        }}
                        className="mt-3 text-center"
                    >
                        <p className="font-display text-4xl text-rose-400">
                            Tijd is om!
                        </p>
                        <p className="mt-1 text-sm text-slate-400">
                            Ga stemmen.
                        </p>
                    </motion.div>
                ) : (
                    <p className="mt-3 text-center text-sm text-slate-400">
                        Stel elkaar vragen over de locatie. De Spion bluft mee
                        en probeert de plek te raden.
                    </p>
                )}
            </div>

            <Panel className="flex min-h-32 flex-1 flex-col overflow-hidden p-0">
                <div className="flex items-center justify-between px-4 pt-3 pb-2">
                    <h2 className="text-xs font-semibold tracking-wide text-slate-400 uppercase">
                        Mogelijke locaties
                    </h2>
                    <span className="text-xs text-slate-500">
                        {LOCATIONS.length}
                    </span>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
                    <div className="grid grid-cols-2 gap-1.5">
                        {LOCATIONS.map((location) => (
                            <span
                                key={location}
                                className="rounded-lg bg-white/5 px-3 py-2 text-center text-xs font-medium text-slate-300 ring-1 ring-white/10"
                            >
                                {location}
                            </span>
                        ))}
                    </div>
                </div>
            </Panel>

            <div className="pt-4">
                <ActionButton
                    onClick={() => setGame({ ...game, phase: 'vote' })}
                    className="text-lg"
                >
                    <Vote className="size-5" aria-hidden /> Naar de stemming
                </ActionButton>
            </div>
        </div>
    );
}

function VoteScreen({
    game,
    setGame,
    onReset,
}: {
    game: GameState;
    setGame: (game: GameState) => void;
    onReset: () => void;
}) {
    const [selectedId, setSelectedId] = useState<number | null>(null);

    const confirmVote = () => {
        if (selectedId === null) {
            return;
        }

        const target = game.players.find((player) => player.id === selectedId);

        if (!target) {
            return;
        }

        if (target.isSpy) {
            // The Spy is caught but gets one chance to steal the win by guessing.
            setGame({ ...game, phase: 'spyguess', votedId: selectedId });

            return;
        }

        // An innocent player was accused — the Spy escapes and wins.
        setGame({
            ...game,
            phase: 'gameover',
            votedId: selectedId,
            winner: 'spy',
        });
    };

    return (
        <div className="flex flex-1 flex-col">
            <PhaseTop label="Stemming" onReset={onReset} />

            <h2 className="mb-1 font-display text-3xl text-white">
                Wie is de Spion?
            </h2>
            <p className="mb-5 text-sm text-slate-400">
                Overleg en tik samen op de verdachte.
            </p>

            <div className="grid grid-cols-2 gap-3">
                {game.players.map((player) => (
                    <motion.button
                        key={player.id}
                        type="button"
                        whileTap={{ scale: 0.96 }}
                        onClick={() => {
                            feel.select();
                            setSelectedId(player.id);
                        }}
                        aria-pressed={selectedId === player.id}
                        className={cn(
                            'min-h-16 rounded-2xl px-4 py-5 text-center text-base font-semibold break-words transition focus:outline-none focus-visible:ring-2 focus-visible:ring-(--glow)',
                            selectedId === player.id
                                ? 'bg-(--glow)/15 text-white shadow-[0_0_32px_-10px_var(--glow)] ring-2 ring-(--glow)'
                                : 'bg-white/5 text-white ring-1 ring-white/10 hover:bg-white/10',
                        )}
                    >
                        {player.name}
                    </motion.button>
                ))}
            </div>

            <div className="mt-auto pt-4">
                <ActionButton
                    variant="danger"
                    onClick={confirmVote}
                    disabled={selectedId === null}
                    className="text-lg"
                >
                    Beschuldigen
                </ActionButton>
            </div>
        </div>
    );
}

function SpyGuessScreen({
    game,
    setGame,
    onReset,
}: {
    game: GameState;
    setGame: (game: GameState) => void;
    onReset: () => void;
}) {
    const [selectedLocation, setSelectedLocation] = useState<string | null>(
        null,
    );
    const reduceMotion = useReducedMotion();
    const played = useRef(false);
    const caughtSpy = game.players.find((player) => player.id === game.votedId);

    useEffect(() => {
        const id = window.setTimeout(() => {
            if (!played.current) {
                played.current = true;
                feel.success();
            }
        }, 700);

        return () => window.clearTimeout(id);
    }, []);

    const confirmGuess = () => {
        if (selectedLocation === null) {
            return;
        }

        const correct = isLocationGuessCorrect(selectedLocation, game.location);

        setGame({
            ...game,
            phase: 'gameover',
            winner: correct ? 'spy' : 'players',
            spyGuessedRight: correct,
        });
    };

    return (
        <div className="flex flex-1 flex-col">
            <PhaseTop label="Spion ontmaskerd" onReset={onReset} />

            <div
                role="status"
                aria-live="polite"
                className="mb-4 flex flex-col items-center text-center"
            >
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="font-display text-3xl text-white"
                >
                    {caughtSpy?.name}
                </motion.p>
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.25 }}
                    className="mt-1 text-sm text-slate-400"
                >
                    was de hele tijd…
                </motion.p>
                <motion.div
                    initial={
                        reduceMotion
                            ? { opacity: 0 }
                            : { scale: 2.1, opacity: 0 }
                    }
                    animate={
                        reduceMotion ? { opacity: 1 } : { scale: 1, opacity: 1 }
                    }
                    transition={{
                        delay: 0.7,
                        type: 'spring',
                        stiffness: 300,
                        damping: 18,
                    }}
                    className="mt-2 flex items-center gap-3"
                >
                    <span
                        aria-hidden
                        className="flex size-12 items-center justify-center rounded-2xl bg-rose-400/15 text-rose-300 ring-1 ring-rose-400/30"
                    >
                        <VenetianMask className="size-6" />
                    </span>
                    <span className="font-display text-5xl text-rose-400">
                        SPION!
                    </span>
                </motion.div>
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.3 }}
                    className="mt-3 text-sm text-slate-400"
                >
                    Laatste kans: raad de geheime locatie om alsnog te winnen.
                </motion.p>
            </div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="min-h-0 flex-1 overflow-y-auto"
            >
                <div className="grid grid-cols-2 gap-2 pb-2">
                    {LOCATIONS.map((location) => (
                        <button
                            key={location}
                            type="button"
                            onClick={() => {
                                feel.select();
                                setSelectedLocation(location);
                            }}
                            aria-pressed={selectedLocation === location}
                            className={cn(
                                'min-h-12 rounded-xl px-3 py-3 text-center text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-(--glow) active:scale-[0.97]',
                                selectedLocation === location
                                    ? 'bg-(--glow)/15 text-white shadow-[0_0_28px_-8px_var(--glow)] ring-2 ring-(--glow)'
                                    : 'bg-white/5 text-slate-200 ring-1 ring-white/10 hover:bg-white/10',
                            )}
                        >
                            {location}
                        </button>
                    ))}
                </div>
            </motion.div>

            <div className="pt-4">
                <ActionButton
                    variant="danger"
                    onClick={confirmGuess}
                    disabled={selectedLocation === null}
                    className="text-lg"
                >
                    Bevestig gok
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
    const reduceMotion = useReducedMotion();
    const playersWon = game.winner === 'players';
    const spyNames = spies(game.players).map((player) => player.name);
    const accused =
        game.votedId === null
            ? undefined
            : game.players.find((player) => player.id === game.votedId);
    const showInnocentPrelude = Boolean(accused && !accused.isSpy);
    const [verdictDone, setVerdictDone] = useState(!showInnocentPrelude);

    useEffect(() => {
        if (verdictDone) {
            return;
        }

        const id = window.setTimeout(() => setVerdictDone(true), 2100);

        return () => window.clearTimeout(id);
    }, [verdictDone]);

    const title = playersWon
        ? 'De spelers winnen!'
        : game.spyGuessedRight
          ? 'De Spion raadt de locatie!'
          : 'De Spion ontsnapt!';

    const playAgain = () => {
        const settings: SpySettings = {
            names: game.players.map((player) => player.name),
            spyCount: spies(game.players).length,
        };

        setGame(startGame(settings, game.timerSeconds));
    };

    if (!verdictDone) {
        return (
            <div
                role="status"
                aria-live="polite"
                className="flex flex-1 flex-col items-center justify-center text-center"
            >
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm text-slate-400"
                >
                    De beschuldigde…
                </motion.p>
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="mt-1 font-display text-4xl break-words text-white"
                >
                    {accused?.name}
                </motion.p>
                <motion.p
                    initial={
                        reduceMotion ? { opacity: 0 } : { scale: 2, opacity: 0 }
                    }
                    animate={
                        reduceMotion ? { opacity: 1 } : { scale: 1, opacity: 1 }
                    }
                    transition={{
                        delay: 0.9,
                        type: 'spring',
                        stiffness: 300,
                        damping: 18,
                    }}
                    className="mt-4 font-display text-5xl text-emerald-300"
                >
                    Onschuldig…
                </motion.p>
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.6 }}
                    className="mt-4 text-sm text-slate-400"
                >
                    De echte Spion glipt weg.
                </motion.p>
            </div>
        );
    }

    return (
        <div className="flex flex-1 flex-col">
            <CelebrationHeader
                icon={playersWon ? Trophy : VenetianMask}
                tone={playersWon ? 'win' : 'lose'}
                title={title}
                subtitle={
                    <>
                        <p>
                            De locatie was{' '}
                            <span className="font-semibold text-emerald-300">
                                {game.location}
                            </span>
                        </p>
                        <p className="mt-1">
                            {spyNames.length === 1 ? 'Spion: ' : 'Spionnen: '}
                            <span className="font-semibold text-rose-300">
                                {spyNames.join(', ')}
                            </span>
                        </p>
                    </>
                }
                className="mt-6 mb-6"
            />

            <div className="space-y-2">
                {game.players.map((player, index) => (
                    <motion.div
                        key={player.id}
                        initial={
                            reduceMotion
                                ? { opacity: 0 }
                                : { opacity: 0, y: 14 }
                        }
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                            delay: 0.35 + index * 0.07,
                            type: 'spring',
                            stiffness: 300,
                            damping: 24,
                        }}
                        className="flex items-center justify-between rounded-xl bg-white/[0.045] px-4 py-3 ring-1 ring-white/10"
                    >
                        <span className="text-base font-medium text-white">
                            {player.name}
                        </span>
                        <span
                            className={cn(
                                'rounded-full px-3 py-1 text-xs font-bold',
                                player.isSpy
                                    ? 'bg-rose-400/15 text-rose-300'
                                    : 'bg-emerald-400/15 text-emerald-300',
                            )}
                        >
                            {player.isSpy ? 'Spion' : 'Speler'}
                        </span>
                    </motion.div>
                ))}
            </div>

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
