import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    ArrowRight,
    Beer,
    Eye,
    EyeOff,
    Megaphone,
    Minus,
    Play,
    Plus,
    RotateCcw,
    ShieldQuestion,
    Skull,
    Trophy,
    Users,
    Vote,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { store, update } from '@/actions/App/Http/Controllers/GameController';
import { Button } from '@/components/ui/button';
import {
    alivePlayers,
    dealRoles,
    determineWinner,
    isMrWhiteGuessCorrect,
    MAX_PLAYERS,
    MIN_PLAYERS,
    orderFromStarter,
    pickStarterId,
    ROLE_LABEL,
    validateSettings,
} from '@/lib/undercover/game';
import type { GameSettings, Player, Winner } from '@/lib/undercover/game';
import type { WordPair } from '@/lib/undercover/words';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';

type Phase = 'setup' | 'reveal' | 'discuss' | 'vote' | 'mrwhite' | 'gameover';

interface GameState {
    /** Identifies one game session on the client, across persistence calls. */
    localId: number;
    phase: Phase;
    players: Player[];
    civilianWord: string;
    pair: WordPair;
    revealIndex: number;
    round: number;
    /** The living player who describes their word first this round. */
    starterId: number | null;
    lastEliminatedId: number | null;
    winner: Winner | null;
    mrWhiteWon: boolean;
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

function readCookie(name: string): string | null {
    const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));

    return match ? decodeURIComponent(match[1]) : null;
}

/** Sends a JSON request with the Inertia/Laravel CSRF token attached. */
async function sendJson(url: string, method: string, body: unknown): Promise<{ id: number }> {
    const response = await fetch(url, {
        method,
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-XSRF-TOKEN': readCookie('XSRF-TOKEN') ?? '',
        },
        credentials: 'same-origin',
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
    }

    return response.json();
}

function defaultNames(count: number): string[] {
    return Array.from({ length: count }, (_, i) => `Speler ${i + 1}`);
}

export default function Undercover() {
    const { currentGame, history } = usePage<PageProps>().props;

    const [game, setGame] = useState<GameState | null>(null);

    const serverIdRef = useRef<number | null>(currentGame?.id ?? null);
    const lastLocalIdRef = useRef<number>(currentGame?.state.localId ?? 0);
    const saveChainRef = useRef<Promise<void>>(Promise.resolve());

    // Persist every state change to the server so each game is saved per user.
    useEffect(() => {
        if (!game) {
            return;
        }

        const isNewGame = game.localId !== lastLocalIdRef.current;

        if (isNewGame) {
            lastLocalIdRef.current = game.localId;
            serverIdRef.current = null;
        }

        const snapshot = game;

        saveChainRef.current = saveChainRef.current
            .then(async () => {
                if (serverIdRef.current === null) {
                    const created = await sendJson(store().url, store().method, { state: snapshot });
                    serverIdRef.current = created.id;
                } else {
                    const action = update(serverIdRef.current);
                    await sendJson(action.url, action.method, { state: snapshot });
                }
            })
            .catch(() => {
                // The game keeps working locally even if a save fails.
            });
    }, [game]);

    const resetToSetup = () => {
        setGame(null);
        // Refresh the resume card and history when returning to the start screen.
        router.reload({ only: ['currentGame', 'history'] });
    };

    return (
        <>
            <Head title="Undercover" />
            <div className="relative flex min-h-[100dvh] flex-col overflow-hidden bg-slate-950 text-slate-100">
                <div className="pointer-events-none absolute -top-32 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-indigo-600/30 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-40 -right-24 h-80 w-80 rounded-full bg-amber-500/20 blur-3xl" />
                <main className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
                    {game === null ? (
                        <SetupScreen
                            resumable={currentGame}
                            history={history}
                            onResume={(state) => setGame(state)}
                            onStart={setGame}
                        />
                    ) : (
                        <PlayScreen game={game} setGame={setGame} onReset={resetToSetup} />
                    )}
                </main>
            </div>
        </>
    );
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
    const [undercoverCount, setUndercoverCount] = useState(1);
    const [includeMrWhite, setIncludeMrWhite] = useState(false);

    const settings: GameSettings = useMemo(
        () => ({ names, undercoverCount, includeMrWhite }),
        [names, undercoverCount, includeMrWhite],
    );

    const error = validateSettings(settings);
    const civilianCount = names.length - undercoverCount - (includeMrWhite ? 1 : 0);

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
        setNames((current) => current.map((name, i) => (i === index ? value : name)));
    };

    const start = () => {
        if (error) {
            return;
        }

        const { players, civilianWord, pair } = dealRoles(settings);

        onStart({
            localId: Date.now(),
            phase: 'reveal',
            players,
            civilianWord,
            pair,
            revealIndex: 0,
            round: 1,
            starterId: null,
            lastEliminatedId: null,
            winner: null,
            mrWhiteWon: false,
        });
    };

    return (
        <div className="flex flex-1 flex-col">
            <div className="mb-2">
                <Link
                    href={dashboard()}
                    className="inline-flex items-center gap-1 text-sm text-slate-400 transition hover:text-slate-200"
                >
                    <ArrowLeft className="size-4" /> Dashboard
                </Link>
            </div>
            <header className="mb-6 text-center">
                <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-amber-400/15 px-3 py-1 text-xs font-bold tracking-widest text-amber-300 uppercase ring-1 ring-amber-400/30">
                    <Beer className="size-3.5" /> Pim Pam Pet
                </span>
                <h1 className="bg-gradient-to-br from-white via-amber-100 to-amber-300 bg-clip-text text-5xl font-black tracking-tight text-transparent">
                    Undercover
                </h1>
                <p className="mt-2 text-sm text-slate-400">
                    Iedereen krijgt een geheim woord — behalve de Undercover. Ontmasker ze.
                </p>
            </header>

            {resumable && (
                <button
                    type="button"
                    onClick={() => onResume(resumable.state)}
                    className="mb-4 flex w-full items-center gap-3 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 px-4 py-3 text-left ring-1 ring-emerald-400/40 transition active:scale-[0.99]"
                >
                    <span className="flex size-10 items-center justify-center rounded-full bg-emerald-500/30">
                        <Play className="size-5 text-emerald-200" />
                    </span>
                    <span className="flex-1">
                        <span className="block text-sm font-bold text-white">Ga verder</span>
                        <span className="block text-xs text-emerald-200/80">
                            Ronde {resumable.state.round ?? 1} ·{' '}
                            {alivePlayers(resumable.state.players ?? []).length} spelers over
                        </span>
                    </span>
                    <ArrowRight className="size-5 text-emerald-200" />
                </button>
            )}

            <section className="mb-5 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10 backdrop-blur-sm">
                <Stepper
                    label="Spelers"
                    icon={<Users className="size-4" />}
                    value={names.length}
                    min={MIN_PLAYERS}
                    max={MAX_PLAYERS}
                    onChange={setPlayerCount}
                />
                <Stepper
                    label="Undercover"
                    icon={<ShieldQuestion className="size-4" />}
                    value={undercoverCount}
                    min={1}
                    max={Math.max(1, names.length - 2)}
                    onChange={setUndercoverCount}
                />
                <button
                    type="button"
                    onClick={() => setIncludeMrWhite((value) => !value)}
                    className="mt-2 flex w-full items-center justify-between rounded-xl bg-white/5 px-4 py-3 text-left transition hover:bg-white/10"
                >
                    <span className="flex items-center gap-2 text-sm font-medium">
                        <Skull className="size-4" /> Mr. White meespelen
                    </span>
                    <span
                        className={cn(
                            'relative h-6 w-11 rounded-full transition',
                            includeMrWhite ? 'bg-emerald-500' : 'bg-slate-600',
                        )}
                    >
                        <span
                            className={cn(
                                'absolute top-0.5 left-0.5 size-5 rounded-full bg-white transition',
                                includeMrWhite && 'translate-x-5',
                            )}
                        />
                    </span>
                </button>
                <p className="mt-3 text-center text-xs text-slate-400">
                    {civilianCount} Burger{civilianCount === 1 ? '' : 's'} · {undercoverCount} Undercover
                    {includeMrWhite ? ' · 1 Mr. White' : ''}
                </p>
            </section>

            <section className="mb-5 space-y-2">
                <h2 className="px-1 text-xs font-semibold tracking-wide text-slate-400 uppercase">Namen</h2>
                {names.map((name, index) => (
                    <input
                        key={index}
                        value={name}
                        onChange={(event) => updateName(index, event.target.value)}
                        maxLength={20}
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-base text-white placeholder:text-slate-500 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/40 focus:outline-none"
                        placeholder={`Speler ${index + 1}`}
                    />
                ))}
            </section>

            {history.length > 0 && <HistoryList history={history} />}

            <div className="mt-auto pt-2">
                {error && <p className="mb-3 text-center text-sm text-rose-400">{error}</p>}
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
    // Only show entries with a complete result, guarding against partial saves.
    const entries = history.filter((entry) => entry.state?.pair && entry.state.winner);

    if (entries.length === 0) {
        return null;
    }

    return (
        <section className="mb-5">
            <h2 className="mb-2 px-1 text-xs font-semibold tracking-wide text-slate-400 uppercase">Recente potjes</h2>
            <div className="space-y-2">
                {entries.map((entry) => {
                    const civiliansWon = entry.state.winner === 'civilians';
                    const result = entry.state.mrWhiteWon
                        ? 'Mr. White won'
                        : civiliansWon
                          ? 'Burgers wonnen'
                          : 'Undercover won';

                    return (
                        <div
                            key={entry.id}
                            className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3 text-sm ring-1 ring-white/10"
                        >
                            <span className="flex items-center gap-2">
                                <span
                                    className={cn(
                                        'rounded-full px-2 py-0.5 text-xs font-bold',
                                        civiliansWon && !entry.state.mrWhiteWon
                                            ? 'bg-emerald-500/20 text-emerald-300'
                                            : 'bg-rose-500/20 text-rose-300',
                                    )}
                                >
                                    {result}
                                </span>
                                <span className="text-slate-400">
                                    {entry.state.pair.civilian} / {entry.state.pair.undercover}
                                </span>
                            </span>
                            <span className="text-xs text-slate-500">{formatDate(entry.finished_at)}</span>
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

    return new Date(value).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
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
                <StepperButton onClick={() => onChange(value - 1)} disabled={value <= min}>
                    <Minus className="size-4" />
                </StepperButton>
                <span className="w-6 text-center text-lg font-bold tabular-nums">{value}</span>
                <StepperButton onClick={() => onChange(value + 1)} disabled={value >= max}>
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
            className="flex size-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 disabled:opacity-30"
        >
            {children}
        </button>
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
            return <DiscussScreen game={game} setGame={setGame} onReset={onReset} />;
        case 'vote':
            return <VoteScreen game={game} setGame={setGame} />;
        case 'mrwhite':
            return <MrWhiteScreen game={game} setGame={setGame} />;
        case 'gameover':
            return <GameOverScreen game={game} setGame={setGame} onReset={onReset} />;
        default:
            return null;
    }
}

function RevealScreen({ game, setGame }: { game: GameState; setGame: (game: GameState) => void }) {
    const [revealed, setRevealed] = useState(false);
    const player = game.players[game.revealIndex];
    const isLast = game.revealIndex === game.players.length - 1;

    const next = () => {
        setRevealed(false);

        if (isLast) {
            setGame({ ...game, phase: 'discuss', starterId: pickStarterId(game.players) });
        } else {
            setGame({ ...game, revealIndex: game.revealIndex + 1 });
        }
    };

    return (
        <div className="flex flex-1 flex-col">
            <p className="mb-2 text-center text-sm text-slate-400">
                Kaart {game.revealIndex + 1} van {game.players.length}
            </p>

            <div className="flex flex-1 flex-col items-center justify-center">
                {!revealed ? (
                    <button
                        type="button"
                        onClick={() => setRevealed(true)}
                        className="flex aspect-[3/4] w-full max-w-xs flex-col items-center justify-center gap-4 rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-700 p-6 text-center shadow-2xl ring-1 ring-white/20 transition active:scale-[0.98]"
                    >
                        <span className="text-2xl font-bold text-white">{player.name}</span>
                        <span className="flex items-center gap-2 rounded-full bg-black/20 px-4 py-2 text-sm text-white/90">
                            <Eye className="size-4" /> Tik om je woord te zien
                        </span>
                        <span className="text-xs text-white/70">Zorg dat niemand meekijkt</span>
                    </button>
                ) : (
                    <div className="flex aspect-[3/4] w-full max-w-xs flex-col items-center justify-center gap-4 rounded-3xl bg-white p-6 text-center shadow-2xl">
                        <span className="text-sm font-medium text-slate-500">{player.name}, jouw woord is</span>
                        {player.word ? (
                            <span className="text-4xl font-black break-words text-slate-900">{player.word}</span>
                        ) : (
                            <div className="flex flex-col items-center gap-2">
                                <Skull className="size-10 text-slate-800" />
                                <span className="text-3xl font-black text-slate-900">Mr. White</span>
                                <span className="text-sm text-slate-500">
                                    Jij hebt geen woord. Doe alsof en raad het woord van de anderen!
                                </span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="mt-auto pt-4">
                {revealed ? (
                    <Button
                        onClick={next}
                        className="h-14 w-full rounded-2xl bg-indigo-500 text-lg font-bold hover:bg-indigo-400"
                    >
                        <EyeOff className="size-5" />
                        {isLast ? 'Klaar — begin de ronde' : 'Verberg & geef door'}
                    </Button>
                ) : (
                    <p className="text-center text-sm text-slate-500">Geef de telefoon aan {player.name}</p>
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
    const order = orderFromStarter(game.players, game.starterId);
    const starter = order[0];

    return (
        <div className="flex flex-1 flex-col">
            <Header round={game.round} onReset={onReset} />

            <div className="flex flex-1 flex-col">
                <h2 className="mb-1 text-2xl font-bold text-white">Beschrijf je woord</h2>
                <p className="mb-4 text-sm text-slate-400">
                    Om de beurt zegt elke speler <span className="font-semibold text-slate-200">één woord</span> dat naar
                    het geheime woord hint — zonder het te zeggen. Stem daarna iemand weg.
                </p>

                {starter && (
                    <div className="mb-4 flex items-center gap-3 rounded-2xl bg-indigo-500/15 px-4 py-3 ring-1 ring-indigo-400/40">
                        <Megaphone className="size-5 shrink-0 text-indigo-300" />
                        <p className="text-sm text-slate-200">
                            <span className="font-bold text-white">{starter.name}</span> begint deze ronde, daarna
                            verder op volgorde.
                        </p>
                    </div>
                )}

                <div className="space-y-2">
                    {order.map((player, index) => (
                        <div
                            key={player.id}
                            className={cn(
                                'flex items-center gap-3 rounded-xl px-4 py-3 ring-1',
                                index === 0 ? 'bg-indigo-500/20 ring-indigo-400/50' : 'bg-white/5 ring-white/10',
                            )}
                        >
                            <span
                                className={cn(
                                    'flex size-7 items-center justify-center rounded-full text-xs font-bold',
                                    index === 0 ? 'bg-indigo-400 text-slate-900' : 'bg-indigo-500/30 text-indigo-200',
                                )}
                            >
                                {index + 1}
                            </span>
                            <span className="text-base font-medium text-white">{player.name}</span>
                            {index === 0 && (
                                <span className="ml-auto text-xs font-semibold tracking-wide text-indigo-300 uppercase">
                                    Begint
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className="mt-auto pt-4">
                <Button
                    onClick={() => setGame({ ...game, phase: 'vote' })}
                    className="h-14 w-full rounded-2xl bg-rose-500 text-lg font-bold hover:bg-rose-400"
                >
                    <Vote className="size-5" /> Naar de stemming
                </Button>
            </div>
        </div>
    );
}

function VoteScreen({ game, setGame }: { game: GameState; setGame: (game: GameState) => void }) {
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const alive = alivePlayers(game.players);

    const confirmVote = () => {
        if (selectedId === null) {
            return;
        }

        const target = game.players.find((player) => player.id === selectedId);

        if (!target) {
            return;
        }

        if (target.role === 'mrwhite') {
            // Mr. White gets a chance to steal the win by guessing the word.
            setGame({ ...game, phase: 'mrwhite', lastEliminatedId: selectedId });

            return;
        }

        resolveElimination(game, setGame, selectedId);
    };

    return (
        <div className="flex flex-1 flex-col">
            <Header round={game.round} />

            <h2 className="mb-1 text-2xl font-bold text-white">Stem iemand weg</h2>
            <p className="mb-5 text-sm text-slate-400">Tik op de speler die je verdenkt van Undercover.</p>

            <div className="grid grid-cols-2 gap-3">
                {alive.map((player) => (
                    <button
                        key={player.id}
                        type="button"
                        onClick={() => setSelectedId(player.id)}
                        className={cn(
                            'rounded-2xl px-4 py-5 text-center text-base font-semibold ring-1 transition',
                            selectedId === player.id
                                ? 'bg-rose-500 text-white ring-rose-300'
                                : 'bg-white/5 text-white ring-white/10 hover:bg-white/10',
                        )}
                    >
                        {player.name}
                    </button>
                ))}
            </div>

            <div className="mt-auto pt-4">
                <Button
                    onClick={confirmVote}
                    disabled={selectedId === null}
                    className="h-14 w-full rounded-2xl bg-rose-500 text-lg font-bold hover:bg-rose-400"
                >
                    Wegstemmen
                </Button>
            </div>
        </div>
    );
}

/** Eliminates a player, then advances to the result or the next round. */
function resolveElimination(game: GameState, setGame: (game: GameState) => void, targetId: number) {
    const players = game.players.map((player) =>
        player.id === targetId ? { ...player, eliminated: true } : player,
    );

    const winner = determineWinner(players);

    if (winner) {
        setGame({ ...game, players, winner, phase: 'gameover', lastEliminatedId: targetId });

        return;
    }

    setGame({
        ...game,
        players,
        phase: 'discuss',
        round: game.round + 1,
        starterId: pickStarterId(players),
        lastEliminatedId: targetId,
    });
}

function MrWhiteScreen({ game, setGame }: { game: GameState; setGame: (game: GameState) => void }) {
    const [guess, setGuess] = useState('');
    const mrWhite = game.players.find((player) => player.id === game.lastEliminatedId);

    const submitGuess = () => {
        if (guess.trim() === '') {
            return;
        }

        if (isMrWhiteGuessCorrect(guess, game.civilianWord)) {
            const players = game.players.map((player) =>
                player.id === game.lastEliminatedId ? { ...player, eliminated: true } : player,
            );

            setGame({ ...game, players, phase: 'gameover', winner: 'undercover', mrWhiteWon: true });

            return;
        }

        resolveElimination(game, setGame, game.lastEliminatedId as number);
    };

    return (
        <div className="flex flex-1 flex-col">
            <div className="flex flex-1 flex-col items-center justify-center text-center">
                <Skull className="mb-4 size-12 text-slate-300" />
                <h2 className="text-2xl font-bold text-white">{mrWhite?.name} was Mr. White!</h2>
                <p className="mt-2 mb-6 text-sm text-slate-400">
                    Laatste kans: raad het geheime woord van de Burgers om alsnog te winnen.
                </p>

                <input
                    value={guess}
                    onChange={(event) => setGuess(event.target.value)}
                    autoFocus
                    className="w-full max-w-xs rounded-xl border border-white/10 bg-white/5 px-4 py-4 text-center text-xl font-semibold text-white placeholder:text-slate-500 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/40 focus:outline-none"
                    placeholder="Jouw gok"
                />
            </div>

            <div className="mt-auto pt-4">
                <Button
                    onClick={submitGuess}
                    disabled={guess.trim() === ''}
                    className="h-14 w-full rounded-2xl bg-indigo-500 text-lg font-bold hover:bg-indigo-400"
                >
                    Gok indienen
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
    const civiliansWon = game.winner === 'civilians';

    const title = game.mrWhiteWon
        ? 'Mr. White wint alsnog!'
        : civiliansWon
          ? 'De Burgers winnen!'
          : 'De Undercover wint!';

    const playAgain = () => {
        const { players, civilianWord, pair } = dealRoles({
            names: game.players.map((player) => player.name),
            undercoverCount: game.players.filter((player) => player.role === 'undercover').length,
            includeMrWhite: game.players.some((player) => player.role === 'mrwhite'),
        });

        setGame({
            localId: Date.now(),
            phase: 'reveal',
            players,
            civilianWord,
            pair,
            revealIndex: 0,
            round: 1,
            starterId: null,
            lastEliminatedId: null,
            winner: null,
            mrWhiteWon: false,
        });
    };

    return (
        <div className="flex flex-1 flex-col">
            <div className="mt-6 mb-6 text-center">
                <Trophy className={cn('mx-auto mb-3 size-12', civiliansWon ? 'text-emerald-400' : 'text-rose-400')} />
                <h1 className="text-3xl font-black text-white">{title}</h1>
                <p className="mt-2 text-sm text-slate-400">
                    De woorden waren <span className="font-semibold text-slate-200">{game.pair.civilian}</span> /{' '}
                    <span className="font-semibold text-slate-200">{game.pair.undercover}</span>
                </p>
            </div>

            <div className="space-y-2">
                {game.players.map((player) => (
                    <div
                        key={player.id}
                        className={cn(
                            'flex items-center justify-between rounded-xl px-4 py-3 ring-1',
                            player.eliminated ? 'bg-white/5 ring-white/5 opacity-60' : 'bg-white/5 ring-white/10',
                        )}
                    >
                        <span className="flex items-center gap-2 text-base font-medium text-white">
                            {player.name}
                            {player.eliminated && <Skull className="size-4 text-slate-500" />}
                        </span>
                        <span
                            className={cn(
                                'rounded-full px-3 py-1 text-xs font-bold',
                                player.role === 'civilian' && 'bg-emerald-500/20 text-emerald-300',
                                player.role === 'undercover' && 'bg-rose-500/20 text-rose-300',
                                player.role === 'mrwhite' && 'bg-slate-400/20 text-slate-200',
                            )}
                        >
                            {ROLE_LABEL[player.role]}
                            {player.word ? ` · ${player.word}` : ''}
                        </span>
                    </div>
                ))}
            </div>

            <div className="mt-auto space-y-3 pt-6">
                <Button
                    onClick={playAgain}
                    className="h-14 w-full rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-lg font-bold hover:from-amber-400 hover:to-orange-400"
                >
                    <RotateCcw className="size-5" /> Opnieuw — zelfde spelers
                </Button>
                <Button onClick={onReset} variant="ghost" className="h-12 w-full rounded-2xl text-slate-300">
                    Nieuw spel
                </Button>
            </div>
        </div>
    );
}

function Header({ round, onReset }: { round: number; onReset?: () => void }) {
    return (
        <div className="mb-5 flex items-center justify-between">
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide text-slate-300 uppercase">
                Ronde {round}
            </span>
            {onReset && (
                <button
                    type="button"
                    onClick={onReset}
                    className="flex items-center gap-1 text-xs text-slate-400 transition hover:text-slate-200"
                >
                    <RotateCcw className="size-3.5" /> Nieuw spel
                </button>
            )}
        </div>
    );
}
