import { router, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    Eye,
    EyeOff,
    MapPin,
    Minus,
    Play,
    Plus,
    RotateCcw,
    Timer,
    Trophy,
    Users,
    VenetianMask,
    Vote,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
    ActionButton,
    GameHeader,
    GameShell,
    Panel,
} from '@/components/game-ui';
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
        <GameShell title="Spion">
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
                <button
                    type="button"
                    onClick={() => onResume(resumable.state)}
                    className="mb-4 flex w-full items-center gap-3 rounded-2xl bg-white px-4 py-3 text-left shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 active:scale-[0.99] dark:bg-white/5 dark:shadow-none dark:ring-white/10 dark:hover:bg-white/10"
                >
                    <span className="flex size-10 items-center justify-center rounded-full bg-amber-500/15 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
                        <Play className="size-5" aria-hidden />
                    </span>
                    <span className="flex-1">
                        <span className="block text-sm font-bold text-slate-900 dark:text-white">
                            Ga verder
                        </span>
                        <span className="block text-xs text-slate-500 dark:text-slate-400">
                            {resumable.state.players?.length ?? 0} spelers
                        </span>
                    </span>
                    <ArrowRight
                        className="size-5 text-slate-400 dark:text-slate-500"
                        aria-hidden
                    />
                </button>
            )}

            <Panel className="mb-5">
                <Stepper
                    label="Spelers"
                    icon={<Users className="size-4" aria-hidden />}
                    value={names.length}
                    min={MIN_PLAYERS}
                    max={MAX_PLAYERS}
                    onChange={setPlayerCount}
                />
                <Stepper
                    label="Spionnen"
                    icon={<VenetianMask className="size-4" aria-hidden />}
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
                <h2 className="mb-3 flex items-center gap-2 text-sm font-medium">
                    <Timer className="size-4" aria-hidden /> Tijd om te
                    overleggen
                </h2>
                <div className="grid grid-cols-3 gap-3">
                    {TIMER_MINUTES_OPTIONS.map((option) => (
                        <button
                            key={option}
                            type="button"
                            onClick={() => setMinutes(option)}
                            aria-pressed={minutes === option}
                            className={cn(
                                'rounded-xl py-3 text-base font-semibold ring-1 transition focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none active:scale-[0.98]',
                                minutes === option
                                    ? 'bg-amber-500 text-slate-950 ring-amber-500'
                                    : 'bg-white text-slate-900 ring-slate-200 hover:bg-slate-100 dark:bg-white/5 dark:text-white dark:ring-white/10 dark:hover:bg-white/10',
                            )}
                        >
                            {option} min
                        </button>
                    ))}
                </div>
            </Panel>

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
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-500/40 focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-500"
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
            <h2 className="mb-2 px-1 text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
                Recente potjes
            </h2>
            <div className="space-y-2">
                {entries.map((entry) => {
                    const playersWon = entry.state.winner === 'players';

                    return (
                        <div
                            key={entry.id}
                            className="flex items-center justify-between rounded-xl bg-white px-4 py-3 text-sm shadow-sm ring-1 ring-slate-200 dark:bg-white/5 dark:shadow-none dark:ring-white/10"
                        >
                            <span className="flex items-center gap-2">
                                <span
                                    className={cn(
                                        'rounded-full px-2 py-0.5 text-xs font-bold',
                                        playersWon
                                            ? 'bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                                            : 'bg-rose-500/15 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300',
                                    )}
                                >
                                    {playersWon
                                        ? 'Spelers wonnen'
                                        : 'Spion won'}
                                </span>
                                <span className="text-slate-500 dark:text-slate-400">
                                    {entry.state.location}
                                </span>
                            </span>
                            <span className="text-xs text-slate-400 dark:text-slate-500">
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
                <StepperButton
                    onClick={() => onChange(value - 1)}
                    disabled={value <= min}
                >
                    <Minus className="size-4" />
                </StepperButton>
                <span className="w-6 text-center text-lg font-bold tabular-nums">
                    {value}
                </span>
                <StepperButton
                    onClick={() => onChange(value + 1)}
                    disabled={value >= max}
                >
                    <Plus className="size-4" />
                </StepperButton>
            </div>
        </div>
    );
}

function StepperButton({
    children,
    onClick,
    disabled,
}: {
    children: React.ReactNode;
    onClick: () => void;
    disabled?: boolean;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className="flex size-9 items-center justify-center rounded-full bg-slate-100 text-slate-900 transition hover:bg-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 disabled:opacity-30 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
        >
            {children}
        </button>
    );
}

function PhaseHeader({
    label,
    onReset,
}: {
    label: string;
    onReset?: () => void;
}) {
    return (
        <div className="mb-4 flex items-center justify-between">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold tracking-wide text-slate-600 uppercase dark:bg-white/10 dark:text-slate-300">
                {label}
            </span>
            {onReset && (
                <button
                    type="button"
                    onClick={onReset}
                    className="flex items-center gap-1 text-xs text-slate-500 transition hover:text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 dark:text-slate-400 dark:hover:text-slate-200"
                >
                    <RotateCcw className="size-3.5" aria-hidden /> Nieuw spel
                </button>
            )}
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

function RevealScreen({
    game,
    setGame,
}: {
    game: GameState;
    setGame: (game: GameState) => void;
}) {
    const [revealed, setRevealed] = useState(false);
    const player = game.players[game.revealIndex];
    const isLast = game.revealIndex === game.players.length - 1;

    const next = () => {
        setRevealed(false);

        if (isLast) {
            setGame({ ...game, phase: 'discuss' });
        } else {
            setGame({ ...game, revealIndex: game.revealIndex + 1 });
        }
    };

    return (
        <div className="flex flex-1 flex-col">
            <p className="mb-2 text-center text-sm text-slate-500 dark:text-slate-400">
                Kaart {game.revealIndex + 1} van {game.players.length}
            </p>

            <div className="flex flex-1 flex-col items-center justify-center">
                {!revealed ? (
                    <button
                        type="button"
                        onClick={() => setRevealed(true)}
                        className="flex aspect-[3/4] w-full max-w-xs flex-col items-center justify-center gap-4 rounded-3xl bg-slate-900 p-6 text-center shadow-sm ring-1 ring-slate-800 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 active:scale-[0.98] dark:ring-white/10"
                    >
                        <span className="text-2xl font-bold text-white">
                            {player.name}
                        </span>
                        <span className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white/90">
                            <Eye className="size-4" aria-hidden /> Tik om je
                            kaart te zien
                        </span>
                        <span className="text-xs text-white/60">
                            Zorg dat niemand meekijkt
                        </span>
                    </button>
                ) : (
                    <div
                        role="status"
                        aria-live="polite"
                        className="flex aspect-[3/4] w-full max-w-xs flex-col items-center justify-center gap-4 rounded-3xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-200 dark:bg-white/5 dark:shadow-none dark:ring-white/10"
                    >
                        {player.isSpy ? (
                            <div className="flex flex-col items-center gap-3">
                                <span className="flex size-20 items-center justify-center rounded-full bg-rose-500/15 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300">
                                    <VenetianMask
                                        className="size-10"
                                        aria-hidden
                                    />
                                </span>
                                <span className="text-3xl font-bold text-slate-900 dark:text-white">
                                    Spion
                                </span>
                                <span className="text-sm text-slate-500 dark:text-slate-400">
                                    Jij kent de locatie niet. Stel slimme vragen
                                    en raad hem!
                                </span>
                            </div>
                        ) : (
                            <>
                                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                    {player.name}, de locatie is
                                </span>
                                <span className="flex size-16 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300">
                                    <MapPin className="size-8" aria-hidden />
                                </span>
                                <span className="text-4xl font-bold break-words text-slate-900 dark:text-white">
                                    {game.location}
                                </span>
                            </>
                        )}
                    </div>
                )}
            </div>

            <div className="mt-auto pt-4">
                {revealed ? (
                    <ActionButton onClick={next} className="text-lg">
                        <EyeOff className="size-5" aria-hidden />
                        {isLast
                            ? 'Klaar — start het overleg'
                            : 'Verberg & geef door'}
                    </ActionButton>
                ) : (
                    <p className="text-center text-sm text-slate-600 dark:text-slate-300">
                        Geef de telefoon aan {player.name}
                    </p>
                )}
            </div>
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

    useEffect(() => {
        const id = window.setInterval(() => {
            setSecondsLeft((value) => (value <= 1 ? 0 : value - 1));
        }, 1000);

        return () => window.clearInterval(id);
    }, []);

    const minutes = Math.floor(secondsLeft / 60);
    const seconds = secondsLeft % 60;
    const timeUp = secondsLeft === 0;
    const urgent = secondsLeft <= 30;

    return (
        <div className="flex flex-1 flex-col">
            <PhaseHeader label="Overleg" onReset={onReset} />

            <div
                className={cn(
                    'mb-5 rounded-2xl py-4 text-center ring-1 transition',
                    urgent
                        ? 'bg-rose-500/15 ring-rose-400/50'
                        : 'bg-white shadow-sm ring-slate-200 dark:bg-white/5 dark:shadow-none dark:ring-white/10',
                )}
            >
                <span
                    className={cn(
                        'text-4xl font-bold tabular-nums',
                        urgent
                            ? 'text-rose-600 dark:text-rose-300'
                            : 'text-slate-900 dark:text-white',
                    )}
                >
                    {minutes}:{seconds.toString().padStart(2, '0')}
                </span>
                {timeUp && (
                    <p
                        role="status"
                        aria-live="polite"
                        className="mt-1 text-sm font-semibold text-rose-600 dark:text-rose-300"
                    >
                        Tijd is om — ga stemmen
                    </p>
                )}
            </div>

            <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">
                Stel elkaar om de beurt vragen over de locatie. De Spion
                probeert te bluffen en de plek te raden. Stem als de tijd om is.
            </p>

            <h2 className="mb-2 px-1 text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
                Mogelijke locaties
            </h2>
            <div className="grid grid-cols-2 gap-1.5">
                {LOCATIONS.map((location) => (
                    <span
                        key={location}
                        className="rounded-lg bg-white px-3 py-1.5 text-center text-xs font-medium text-slate-600 ring-1 ring-slate-200 dark:bg-white/5 dark:text-slate-300 dark:ring-white/5"
                    >
                        {location}
                    </span>
                ))}
            </div>

            <div className="mt-auto pt-4">
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
            <PhaseHeader label="Stemming" onReset={onReset} />

            <h2 className="mb-1 text-2xl font-bold text-slate-900 dark:text-white">
                Wie is de Spion?
            </h2>
            <p className="mb-5 text-sm text-slate-500 dark:text-slate-400">
                Overleg en tik samen op de verdachte.
            </p>

            <div className="grid grid-cols-2 gap-3">
                {game.players.map((player) => (
                    <button
                        key={player.id}
                        type="button"
                        onClick={() => setSelectedId(player.id)}
                        aria-pressed={selectedId === player.id}
                        className={cn(
                            'rounded-2xl px-4 py-5 text-center text-base font-semibold ring-1 transition focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none active:scale-[0.98]',
                            selectedId === player.id
                                ? 'bg-amber-500 text-slate-950 ring-amber-500'
                                : 'bg-white text-slate-900 ring-slate-200 hover:bg-slate-100 dark:bg-white/5 dark:text-white dark:ring-white/10 dark:hover:bg-white/10',
                        )}
                    >
                        {player.name}
                    </button>
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
    const caughtSpy = game.players.find((player) => player.id === game.votedId);

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
            <PhaseHeader label="Spion ontmaskerd" onReset={onReset} />

            <div
                role="status"
                aria-live="polite"
                className="mb-4 flex flex-col items-center text-center"
            >
                <span className="mb-3 flex size-16 items-center justify-center rounded-full bg-rose-500/15 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300">
                    <VenetianMask className="size-8" aria-hidden />
                </span>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                    {caughtSpy?.name} was de Spion!
                </h2>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    Laatste kans: raad de geheime locatie om alsnog te winnen.
                </p>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
                <div className="grid grid-cols-2 gap-2 pb-2">
                    {LOCATIONS.map((location) => (
                        <button
                            key={location}
                            type="button"
                            onClick={() => setSelectedLocation(location)}
                            aria-pressed={selectedLocation === location}
                            className={cn(
                                'rounded-xl px-3 py-3 text-center text-sm font-semibold ring-1 transition focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none active:scale-[0.98]',
                                selectedLocation === location
                                    ? 'bg-amber-500 text-slate-950 ring-amber-500'
                                    : 'bg-white text-slate-900 ring-slate-200 hover:bg-slate-100 dark:bg-white/5 dark:text-white dark:ring-white/10 dark:hover:bg-white/10',
                            )}
                        >
                            {location}
                        </button>
                    ))}
                </div>
            </div>

            <div className="pt-4">
                <ActionButton
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
    const playersWon = game.winner === 'players';
    const spyNames = spies(game.players).map((player) => player.name);

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

    return (
        <div className="flex flex-1 flex-col">
            <div className="mt-6 mb-6 flex flex-col items-center text-center">
                <span
                    className={cn(
                        'mb-3 flex size-20 items-center justify-center rounded-full',
                        playersWon
                            ? 'bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300'
                            : 'bg-rose-500/15 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300',
                    )}
                >
                    <Trophy className="size-10" aria-hidden />
                </span>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                    {title}
                </h1>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    De locatie was{' '}
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {game.location}
                    </span>
                </p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {spyNames.length === 1 ? 'Spion: ' : 'Spionnen: '}
                    <span className="font-semibold text-rose-600 dark:text-rose-300">
                        {spyNames.join(', ')}
                    </span>
                </p>
            </div>

            <div className="space-y-2">
                {game.players.map((player) => (
                    <div
                        key={player.id}
                        className="flex items-center justify-between rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200 dark:bg-white/5 dark:shadow-none dark:ring-white/10"
                    >
                        <span className="text-base font-medium text-slate-900 dark:text-white">
                            {player.name}
                        </span>
                        <span
                            className={cn(
                                'rounded-full px-3 py-1 text-xs font-bold',
                                player.isSpy
                                    ? 'bg-rose-500/15 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300'
                                    : 'bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
                            )}
                        >
                            {player.isSpy ? 'Spion' : 'Speler'}
                        </span>
                    </div>
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
