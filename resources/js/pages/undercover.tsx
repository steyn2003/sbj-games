import { router, usePage } from '@inertiajs/react';
import { motion, useReducedMotion } from 'framer-motion';
import {
    ArrowRight,
    Eye,
    EyeOff,
    Megaphone,
    Play,
    RotateCcw,
    Skull,
    Trophy,
    UserX,
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
    IconBadge,
    Panel,
    PassPhoneGate,
    PhaseTransition,
    Stepper,
} from '@/components/game-ui';
import { feel } from '@/hooks/use-game-feel';
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
import { usePersistedGame } from '@/lib/use-persisted-game';
import { cn } from '@/lib/utils';

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

function defaultNames(count: number): string[] {
    return Array.from({ length: count }, (_, i) => `Speler ${i + 1}`);
}

export default function Undercover() {
    const { currentGame, history } = usePage<PageProps>().props;

    const [game, setGame] = useState<GameState | null>(null);

    // Persist every state change to the server so each game is saved per user.
    usePersistedGame('undercover', game, {
        serverId: currentGame?.id ?? null,
        localId: currentGame?.state.localId ?? 0,
    });

    const resetToSetup = () => {
        setGame(null);
        // Refresh the resume card and history when returning to the start screen.
        router.reload({ only: ['currentGame', 'history'] });
    };

    return (
        <GameShell title="Undercover" accent="violet">
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
    const civilianCount =
        names.length - undercoverCount - (includeMrWhite ? 1 : 0);

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
            <GameHeader
                kicker="Blufspel"
                title="Undercover"
                description="Iedereen krijgt een geheim woord — behalve de Undercover. Ontmasker ze."
            />

            {resumable && (
                <motion.button
                    type="button"
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 24 }}
                    onClick={() => {
                        feel.select();
                        onResume(resumable.state);
                    }}
                    className="mb-4 flex w-full items-center gap-3 rounded-2xl bg-(--glow)/10 px-4 py-3 text-left ring-1 ring-(--glow)/30 transition hover:bg-(--glow)/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-(--glow)"
                >
                    <span
                        aria-hidden
                        className="flex size-10 shrink-0 items-center justify-center rounded-full bg-(--glow)/15 text-(--glow-strong)"
                    >
                        <Play className="size-5" />
                    </span>
                    <span className="flex-1">
                        <span className="block text-sm font-bold text-white">
                            Ga verder
                        </span>
                        <span className="block text-xs text-slate-400">
                            Ronde {resumable.state.round ?? 1} ·{' '}
                            {alivePlayers(resumable.state.players ?? []).length}{' '}
                            spelers over
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
                    label="Undercover"
                    value={undercoverCount}
                    min={1}
                    max={Math.max(1, names.length - 2)}
                    onChange={setUndercoverCount}
                />
                <button
                    type="button"
                    role="switch"
                    aria-checked={includeMrWhite}
                    onClick={() => {
                        feel.select();
                        setIncludeMrWhite((value) => !value);
                    }}
                    className="flex min-h-12 w-full items-center justify-between gap-3 rounded-xl bg-white/5 px-4 py-3 text-left transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-(--glow)"
                >
                    <span className="flex items-center gap-2 text-sm font-medium text-slate-300">
                        <Skull className="size-4 text-slate-400" aria-hidden />
                        Mr. White speelt mee
                    </span>
                    <span
                        aria-hidden
                        className={cn(
                            'relative h-6 w-11 shrink-0 rounded-full transition',
                            includeMrWhite ? 'bg-(--glow)' : 'bg-white/15',
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
                <p className="pt-1 text-center text-xs text-slate-500">
                    {civilianCount} Burger{civilianCount === 1 ? '' : 's'} ·{' '}
                    {undercoverCount} Undercover
                    {includeMrWhite ? ' · 1 Mr. White' : ''}
                </p>
            </Panel>

            <section className="mb-5 space-y-2">
                <h2 className="px-1 text-xs font-semibold tracking-widest text-slate-500 uppercase">
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
                        aria-label={`Naam van speler ${index + 1}`}
                        placeholder={`Speler ${index + 1}`}
                        className="w-full rounded-xl bg-white/5 px-4 py-3 text-base text-white ring-1 ring-white/10 placeholder:text-slate-500 focus:ring-2 focus:ring-(--glow) focus:outline-none"
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

function HistoryList({ history }: { history: HistoryEntry[] }) {
    // Only show entries with a complete result, guarding against partial saves.
    const entries = history.filter(
        (entry) => entry.state?.pair && entry.state.winner,
    );

    if (entries.length === 0) {
        return null;
    }

    return (
        <section className="mb-5">
            <h2 className="mb-2 px-1 text-xs font-semibold tracking-widest text-slate-500 uppercase">
                Recente potjes
            </h2>
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
                            className="flex items-center justify-between gap-2 rounded-xl bg-white/[0.045] px-4 py-3 text-sm ring-1 ring-white/10"
                        >
                            <span className="flex min-w-0 items-center gap-2">
                                <span
                                    className={cn(
                                        'shrink-0 rounded-full px-2 py-0.5 text-xs font-bold',
                                        civiliansWon && !entry.state.mrWhiteWon
                                            ? 'bg-emerald-400/15 text-emerald-300'
                                            : 'bg-rose-400/15 text-rose-300',
                                    )}
                                >
                                    {result}
                                </span>
                                <span className="truncate text-slate-400">
                                    {entry.state.pair.civilian} /{' '}
                                    {entry.state.pair.undercover}
                                </span>
                            </span>
                            <span className="shrink-0 text-xs text-slate-500">
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
            return <VoteScreen game={game} setGame={setGame} />;
        case 'mrwhite':
            return <MrWhiteScreen game={game} setGame={setGame} />;
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
    const reduceMotion = useReducedMotion();
    const [claimed, setClaimed] = useState(false);
    const [revealed, setRevealed] = useState(false);
    const player = game.players[game.revealIndex];
    const isLast = game.revealIndex === game.players.length - 1;

    const reveal = () => {
        feel.flip();
        setRevealed(true);
    };

    const next = () => {
        setRevealed(false);
        setClaimed(false);

        if (isLast) {
            setGame({
                ...game,
                phase: 'discuss',
                starterId: pickStarterId(game.players),
            });
        } else {
            setGame({ ...game, revealIndex: game.revealIndex + 1 });
        }
    };

    const wordFace = (
        <div className="flex size-full flex-col items-center justify-center gap-3 rounded-3xl bg-(--glow)/10 p-6 text-center shadow-[0_0_60px_-15px_var(--glow)] ring-2 ring-(--glow)/40">
            <span className="text-sm font-medium text-slate-300">
                {player.name}, jouw woord is
            </span>
            <motion.span
                initial={
                    reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.6 }
                }
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                    type: 'spring',
                    stiffness: 300,
                    damping: 18,
                    delay: 0.15,
                }}
                className="font-display text-4xl break-words text-white"
            >
                {player.word}
            </motion.span>
            <span className="text-xs text-slate-400">
                Onthoud het goed en verberg de kaart
            </span>
        </div>
    );

    const mrWhiteFace = (
        <div className="flex size-full flex-col items-center justify-center gap-3 rounded-3xl bg-slate-950 p-6 text-center ring-2 ring-white/15">
            <motion.span
                aria-hidden
                initial={
                    reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.6 }
                }
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                    type: 'spring',
                    stiffness: 300,
                    damping: 18,
                    delay: 0.15,
                }}
                className="flex size-16 items-center justify-center rounded-full bg-white/10 text-slate-200"
            >
                <Skull className="size-8" />
            </motion.span>
            <span className="font-display text-3xl text-white">Mr. White</span>
            <span className="text-sm text-slate-400">
                Jij hebt geen woord. Doe alsof en raad het woord van de anderen!
            </span>
        </div>
    );

    return (
        <div className="flex flex-1 flex-col">
            <div className="mb-4 flex flex-col items-center gap-2">
                <div aria-hidden className="flex items-center gap-1.5">
                    {game.players.map((dot, index) => (
                        <span
                            key={dot.id}
                            className={cn(
                                'h-1.5 rounded-full transition-all duration-300',
                                index < game.revealIndex
                                    ? 'w-1.5 bg-(--glow)/50'
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
                phaseKey={`${player.id}-${claimed ? 'kaart' : 'gate'}`}
            >
                {!claimed ? (
                    <PassPhoneGate
                        name={player.name}
                        onReady={() => setClaimed(true)}
                    />
                ) : (
                    <div className="flex flex-1 flex-col">
                        <div className="flex flex-1 items-center justify-center py-2">
                            <FlipCard
                                key={player.id}
                                revealed={revealed}
                                className="aspect-[3/4] w-full max-w-xs"
                                front={
                                    <motion.button
                                        type="button"
                                        whileTap={{ scale: 0.97 }}
                                        transition={{
                                            type: 'spring',
                                            stiffness: 400,
                                            damping: 24,
                                        }}
                                        onClick={reveal}
                                        className="flex size-full flex-col items-center justify-center gap-4 rounded-3xl bg-slate-900 p-6 text-center shadow-[0_0_40px_-18px_var(--glow)] ring-1 ring-(--glow)/30 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-(--glow)"
                                    >
                                        <IconBadge icon={Eye} />
                                        <span className="font-display text-3xl break-words text-white">
                                            {player.name}
                                        </span>
                                        <span className="rounded-full bg-white/10 px-4 py-2 text-sm text-slate-300">
                                            Tik om je woord te zien
                                        </span>
                                    </motion.button>
                                }
                                back={player.word ? wordFace : mrWhiteFace}
                            />
                        </div>

                        <div className="mt-auto pt-4">
                            {revealed ? (
                                <ActionButton onClick={next}>
                                    <EyeOff className="size-5" aria-hidden />
                                    {isLast
                                        ? 'Klaar — begin de ronde'
                                        : 'Verberg & geef door'}
                                </ActionButton>
                            ) : (
                                <p className="flex h-14 items-center justify-center text-sm text-slate-500">
                                    Zorg dat niemand meekijkt
                                </p>
                            )}
                        </div>
                    </div>
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
    const reduceMotion = useReducedMotion();
    const order = orderFromStarter(game.players, game.starterId);
    const starter = order[0];
    const eliminated =
        game.players.find((player) => player.id === game.lastEliminatedId) ??
        null;
    const soundPlayed = useRef(false);

    useEffect(() => {
        if (soundPlayed.current) {
            return;
        }

        soundPlayed.current = true;

        if (eliminated) {
            feel.fail();
        } else {
            feel.select();
        }
    }, [eliminated]);

    const spotlightDelay = eliminated ? 0.35 : 0.1;

    return (
        <div className="flex flex-1 flex-col">
            <RoundHeader round={game.round} onReset={onReset} />

            <div className="flex flex-1 flex-col">
                <h2 className="mb-1 text-2xl font-bold text-white">
                    Beschrijf je woord
                </h2>
                <p className="mb-4 text-sm text-slate-400">
                    Om de beurt zegt elke speler{' '}
                    <span className="font-semibold text-slate-200">
                        één woord
                    </span>{' '}
                    dat naar het geheime woord hint — zonder het te zeggen. Stem
                    daarna iemand weg.
                </p>

                {eliminated && (
                    <motion.div
                        aria-live="polite"
                        initial={
                            reduceMotion
                                ? { opacity: 0 }
                                : { opacity: 0, y: -10, scale: 0.96 }
                        }
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{
                            type: 'spring',
                            stiffness: 320,
                            damping: 22,
                        }}
                        className="mb-3 flex items-center gap-3 rounded-2xl bg-rose-500/10 px-4 py-3 ring-1 ring-rose-400/30"
                    >
                        <UserX
                            className="size-5 shrink-0 text-rose-300"
                            aria-hidden
                        />
                        <p className="text-sm text-slate-300">
                            <span className="font-display text-lg text-rose-300">
                                {eliminated.name}
                            </span>{' '}
                            is weggestemd.
                        </p>
                    </motion.div>
                )}

                {starter && (
                    <motion.div
                        initial={
                            reduceMotion
                                ? { opacity: 0 }
                                : { opacity: 0, scale: 0.9 }
                        }
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{
                            type: 'spring',
                            stiffness: 320,
                            damping: 20,
                            delay: spotlightDelay,
                        }}
                        className="mb-4 flex items-center gap-3 rounded-2xl bg-(--glow)/10 px-4 py-3 ring-1 ring-(--glow)/30"
                    >
                        <Megaphone
                            className="size-5 shrink-0 text-(--glow-strong)"
                            aria-hidden
                        />
                        <p className="text-sm text-slate-300">
                            <span className="font-display text-xl text-white">
                                {starter.name}
                            </span>{' '}
                            begint deze ronde.
                        </p>
                    </motion.div>
                )}

                <div className="space-y-2">
                    {order.map((player, index) => (
                        <motion.div
                            key={player.id}
                            initial={
                                reduceMotion
                                    ? { opacity: 0 }
                                    : { opacity: 0, x: -14 }
                            }
                            animate={{ opacity: 1, x: 0 }}
                            transition={{
                                type: 'spring',
                                stiffness: 300,
                                damping: 26,
                                delay: spotlightDelay + 0.1 + index * 0.05,
                            }}
                            className={cn(
                                'flex items-center gap-3 rounded-xl px-4 py-3 ring-1',
                                index === 0
                                    ? 'bg-(--glow)/10 ring-(--glow)/40'
                                    : 'bg-white/[0.045] ring-white/10',
                            )}
                        >
                            <span
                                className={cn(
                                    'flex size-7 items-center justify-center rounded-full text-xs font-bold',
                                    index === 0
                                        ? 'bg-(--glow) text-slate-950'
                                        : 'bg-white/10 text-slate-300',
                                )}
                            >
                                {index + 1}
                            </span>
                            <span className="text-base font-medium text-white">
                                {player.name}
                            </span>
                            {index === 0 && (
                                <span className="ml-auto text-xs font-semibold tracking-wide text-(--glow-strong) uppercase">
                                    Begint
                                </span>
                            )}
                        </motion.div>
                    ))}
                </div>
            </div>

            <div className="mt-auto pt-4">
                <ActionButton
                    onClick={() => setGame({ ...game, phase: 'vote' })}
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
}: {
    game: GameState;
    setGame: (game: GameState) => void;
}) {
    const reduceMotion = useReducedMotion();
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
            setGame({
                ...game,
                phase: 'mrwhite',
                lastEliminatedId: selectedId,
            });

            return;
        }

        resolveElimination(game, setGame, selectedId);
    };

    return (
        <div className="flex flex-1 flex-col">
            <RoundHeader round={game.round} />

            <h2 className="mb-1 text-2xl font-bold text-white">
                Stem iemand weg
            </h2>
            <p className="mb-5 text-sm text-slate-400">
                Overleg samen en tik op de speler die jullie verdenken.
            </p>

            <div className="grid grid-cols-2 gap-3">
                {alive.map((player, index) => (
                    <motion.button
                        key={player.id}
                        type="button"
                        aria-pressed={selectedId === player.id}
                        initial={
                            reduceMotion
                                ? { opacity: 0 }
                                : { opacity: 0, y: 10 }
                        }
                        animate={{ opacity: 1, y: 0 }}
                        whileTap={{
                            scale: 0.95,
                            transition: {
                                type: 'spring',
                                stiffness: 450,
                                damping: 25,
                            },
                        }}
                        transition={{
                            type: 'spring',
                            stiffness: 300,
                            damping: 24,
                            delay: index * 0.04,
                        }}
                        onClick={() => {
                            feel.select();
                            setSelectedId(player.id);
                        }}
                        className={cn(
                            'min-h-16 rounded-2xl px-4 py-5 text-center text-base font-semibold break-words ring-1 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-(--glow)',
                            selectedId === player.id
                                ? 'bg-rose-500 text-white shadow-[0_10px_32px_-12px_var(--color-rose-500)] ring-rose-400'
                                : 'bg-white/[0.045] text-white ring-white/10 hover:bg-white/10',
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
                >
                    Wegstemmen
                </ActionButton>
            </div>
        </div>
    );
}

/** Eliminates a player, then advances to the result or the next round. */
function resolveElimination(
    game: GameState,
    setGame: (game: GameState) => void,
    targetId: number,
) {
    const players = game.players.map((player) =>
        player.id === targetId ? { ...player, eliminated: true } : player,
    );

    const winner = determineWinner(players);

    if (winner) {
        setGame({
            ...game,
            players,
            winner,
            phase: 'gameover',
            lastEliminatedId: targetId,
        });

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

function MrWhiteScreen({
    game,
    setGame,
}: {
    game: GameState;
    setGame: (game: GameState) => void;
}) {
    const reduceMotion = useReducedMotion();
    const [guess, setGuess] = useState('');
    const mrWhite = game.players.find(
        (player) => player.id === game.lastEliminatedId,
    );
    const soundPlayed = useRef(false);

    useEffect(() => {
        if (soundPlayed.current) {
            return;
        }

        soundPlayed.current = true;
        feel.fail();
    }, []);

    const submitGuess = () => {
        if (guess.trim() === '') {
            return;
        }

        if (isMrWhiteGuessCorrect(guess, game.civilianWord)) {
            const players = game.players.map((player) =>
                player.id === game.lastEliminatedId
                    ? { ...player, eliminated: true }
                    : player,
            );

            setGame({
                ...game,
                players,
                phase: 'gameover',
                winner: 'undercover',
                mrWhiteWon: true,
            });

            return;
        }

        resolveElimination(game, setGame, game.lastEliminatedId as number);
    };

    return (
        <div className="flex flex-1 flex-col">
            <div className="flex flex-1 flex-col items-center justify-center text-center">
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
                    transition={{ type: 'spring', stiffness: 300, damping: 16 }}
                    className="mb-4 flex size-20 items-center justify-center rounded-3xl bg-white/10 text-slate-200 ring-1 ring-white/15"
                >
                    <Skull className="size-10" />
                </motion.span>
                <motion.h2
                    aria-live="polite"
                    initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                        type: 'spring',
                        stiffness: 300,
                        damping: 22,
                        delay: 0.12,
                    }}
                    className="font-display text-4xl text-white"
                >
                    Betrapt!
                </motion.h2>
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.25 }}
                    className="mt-2 mb-6 text-sm text-slate-400"
                >
                    <span className="font-semibold text-slate-200">
                        {mrWhite?.name}
                    </span>{' '}
                    was Mr. White. Laatste kans: raad het geheime woord van de
                    Burgers om alsnog te winnen.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.35 }}
                    className="w-full max-w-xs"
                >
                    <input
                        value={guess}
                        onChange={(event) => setGuess(event.target.value)}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                                submitGuess();
                            }
                        }}
                        autoFocus
                        aria-label="Jouw gok"
                        placeholder="Jouw gok"
                        className="w-full rounded-2xl bg-white/5 px-4 py-4 text-center text-xl font-semibold text-white ring-1 ring-white/10 placeholder:text-slate-500 focus:ring-2 focus:ring-(--glow) focus:outline-none"
                    />
                </motion.div>
            </div>

            <div className="mt-auto pt-4">
                <ActionButton
                    onClick={submitGuess}
                    disabled={guess.trim() === ''}
                >
                    Gok indienen
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
    const civiliansWon = game.winner === 'civilians';
    // The game only ever ends straight after the Mr. White guess screen when
    // the last eliminated player is Mr. White — that arrival earns a beat of
    // suspense before the verdict lands.
    const fromMrWhiteGuess =
        game.players.find((player) => player.id === game.lastEliminatedId)
            ?.role === 'mrwhite';
    const [suspense, setSuspense] = useState(
        () => fromMrWhiteGuess && !reduceMotion,
    );

    useEffect(() => {
        if (!suspense) {
            return;
        }

        const timers = [
            setTimeout(() => feel.tick(), 350),
            setTimeout(() => feel.tick(), 800),
            setTimeout(() => feel.tick(), 1250),
            setTimeout(() => setSuspense(false), 1600),
        ];

        return () => timers.forEach(clearTimeout);
    }, [suspense]);

    const title = game.mrWhiteWon
        ? 'Mr. White wint alsnog!'
        : civiliansWon
          ? 'De Burgers winnen!'
          : 'De Undercover wint!';

    const playAgain = () => {
        const { players, civilianWord, pair } = dealRoles({
            names: game.players.map((player) => player.name),
            undercoverCount: game.players.filter(
                (player) => player.role === 'undercover',
            ).length,
            includeMrWhite: game.players.some(
                (player) => player.role === 'mrwhite',
            ),
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

    if (suspense) {
        return (
            <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
                <span
                    aria-hidden
                    className="flex size-20 items-center justify-center rounded-3xl bg-white/10 text-slate-200 ring-1 ring-white/15"
                >
                    <Skull className="size-10" />
                </span>
                <p className="font-display text-3xl text-white">
                    Was de gok juist?
                </p>
                <span aria-hidden className="flex items-center gap-1.5">
                    {[0, 150, 300].map((delay) => (
                        <span
                            key={delay}
                            className="size-2 animate-bounce rounded-full bg-(--glow)"
                            style={{ animationDelay: `${delay}ms` }}
                        />
                    ))}
                </span>
            </div>
        );
    }

    return (
        <div className="flex flex-1 flex-col">
            <div
                className="mt-4 mb-6"
                data-accent={
                    game.mrWhiteWon
                        ? undefined
                        : civiliansWon
                          ? 'emerald'
                          : 'rose'
                }
            >
                <CelebrationHeader
                    icon={
                        game.mrWhiteWon
                            ? Skull
                            : civiliansWon
                              ? Trophy
                              : VenetianMask
                    }
                    title={title}
                    tone="win"
                    subtitle={
                        <>
                            De woorden waren{' '}
                            <span className="font-semibold text-slate-200">
                                {game.pair.civilian}
                            </span>{' '}
                            /{' '}
                            <span className="font-semibold text-slate-200">
                                {game.pair.undercover}
                            </span>
                        </>
                    }
                />
            </div>

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
                            type: 'spring',
                            stiffness: 300,
                            damping: 24,
                            delay: 0.45 + index * 0.09,
                        }}
                        className={cn(
                            'flex items-center justify-between gap-2 rounded-xl bg-white/[0.045] px-4 py-3 ring-1 ring-white/10',
                            player.eliminated && 'opacity-60',
                        )}
                    >
                        <span className="flex min-w-0 items-center gap-2 text-base font-medium text-white">
                            <span className="truncate">{player.name}</span>
                            {player.eliminated && (
                                <Skull
                                    className="size-4 shrink-0 text-slate-500"
                                    aria-hidden
                                />
                            )}
                        </span>
                        <span
                            className={cn(
                                'shrink-0 rounded-full px-3 py-1 text-xs font-bold',
                                player.role === 'civilian' &&
                                    'bg-emerald-400/15 text-emerald-300',
                                player.role === 'undercover' &&
                                    'bg-rose-400/15 text-rose-300',
                                player.role === 'mrwhite' &&
                                    'bg-white/10 text-slate-200',
                            )}
                        >
                            {ROLE_LABEL[player.role]}
                            {player.word ? ` · ${player.word}` : ''}
                        </span>
                    </motion.div>
                ))}
            </div>

            <div className="mt-auto space-y-3 pt-6">
                <ActionButton onClick={playAgain}>
                    <RotateCcw className="size-5" aria-hidden /> Opnieuw —
                    zelfde spelers
                </ActionButton>
                <ActionButton variant="neutral" onClick={onReset}>
                    Nieuw spel
                </ActionButton>
            </div>
        </div>
    );
}

function RoundHeader({
    round,
    onReset,
}: {
    round: number;
    onReset?: () => void;
}) {
    const [armed, setArmed] = useState(false);

    useEffect(() => {
        if (!armed) {
            return;
        }

        const timeout = setTimeout(() => setArmed(false), 3000);

        return () => clearTimeout(timeout);
    }, [armed]);

    return (
        <div className="mb-5 flex items-center justify-between">
            <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-semibold tracking-widest text-slate-300 uppercase ring-1 ring-white/10">
                Ronde {round}
            </span>
            {onReset && (
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
                        'flex h-9 items-center gap-1.5 rounded-full px-3 text-xs transition focus:outline-none focus-visible:ring-2 focus-visible:ring-(--glow)',
                        armed
                            ? 'bg-rose-500/15 font-semibold text-rose-300 ring-1 ring-rose-400/40'
                            : 'font-medium text-slate-400 hover:text-white',
                    )}
                >
                    <RotateCcw className="size-3.5" aria-hidden />
                    {armed ? 'Zeker weten?' : 'Nieuw spel'}
                </button>
            )}
        </div>
    );
}
