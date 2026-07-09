import { AnimatePresence, motion } from 'framer-motion';
import {
    ArrowLeft,
    Beer,
    Flag,
    Minus,
    Monitor,
    Plus,
    Rabbit,
    RotateCcw,
    Trophy,
    WalletCards,
    X,
} from 'lucide-react';
import {
    useCallback,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
} from 'react';
import {
    list,
    show,
    store,
    update,
} from '@/actions/App/Http/Controllers/RaceController';
import {
    ActionButton,
    GameHeader,
    GameShell,
    Panel,
} from '@/components/game-ui';
import {
    DEFAULT_STEPS,
    flip,
    outcomes,
    startRace,
    STEP_OPTIONS,
    SUITS,
    suitInfo,
} from '@/lib/horse-race';
import type { Bet, RaceState, Suit } from '@/lib/horse-race';
import { cn } from '@/lib/utils';

function readCookie(name: string): string | null {
    const match = document.cookie.match(
        new RegExp('(?:^|; )' + name + '=([^;]*)'),
    );

    return match ? decodeURIComponent(match[1]) : null;
}

async function pushState(code: string, state: RaceState): Promise<void> {
    const action = update(code);
    await fetch(action.url, {
        method: action.method,
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-XSRF-TOKEN': readCookie('XSRF-TOKEN') ?? '',
        },
        credentials: 'same-origin',
        body: JSON.stringify({ state }),
    });
}

/** A blank board waiting for the dealer to place bets and start. */
function bettingState(
    bets: Bet[],
    trackLength: number = DEFAULT_STEPS,
): RaceState {
    return {
        phase: 'betting',
        trackLength,
        positions: { hearts: 0, spades: 0, clubs: 0, diamonds: 0 },
        backfires: [],
        bets,
        deck: [],
        drawn: null,
        lastEvent: null,
        winner: null,
    };
}

type Role = 'choose' | 'board' | 'dealer';

export default function HorseRace() {
    const [role, setRole] = useState<Role>('choose');
    const [code, setCode] = useState('');

    return (
        <GameShell title="Paardenrace">
            {role === 'choose' && (
                <ChooseScreen
                    onBoard={(c) => {
                        setCode(c);
                        setRole('board');
                    }}
                    onDealer={(c) => {
                        setCode(c);
                        setRole('dealer');
                    }}
                />
            )}
            {role === 'board' && <BoardScreen code={code} />}
            {role === 'dealer' && <DealerScreen code={code} />}
        </GameShell>
    );
}

interface OpenRace {
    code: string;
    phase: string;
    players: number;
}

const optionCardClasses =
    'flex w-full items-start gap-4 rounded-2xl bg-white p-5 text-left shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 active:scale-[0.99] disabled:opacity-50 dark:bg-white/5 dark:shadow-none dark:ring-white/10 dark:hover:bg-white/10';

function ChooseScreen({
    onBoard,
    onDealer,
}: {
    onBoard: (code: string) => void;
    onDealer: (code: string) => void;
}) {
    const [view, setView] = useState<'pick' | 'join'>('pick');
    const [races, setRaces] = useState<OpenRace[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    // The dealer (leading phone) starts the race and runs it.
    const startRace = async () => {
        setBusy(true);
        setError(null);

        try {
            const response = await fetch(store().url, {
                method: store().method,
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': readCookie('XSRF-TOKEN') ?? '',
                },
                credentials: 'same-origin',
            });

            if (!response.ok) {
                throw new Error();
            }

            const data: { code: string } = await response.json();
            onDealer(data.code);
        } catch {
            setError('Kon geen race starten. Probeer opnieuw.');
            setBusy(false);
        }
    };

    // The board (render phone) joins a race the dealer started. The list keeps
    // refreshing so a freshly started race shows up on its own.
    useEffect(() => {
        if (view !== 'join') {
            return;
        }

        let active = true;
        const refresh = async () => {
            try {
                const response = await fetch(list().url, {
                    headers: { Accept: 'application/json' },
                });
                const data: { races: OpenRace[] } = await response.json();

                if (active) {
                    setRaces(data.races);
                }
            } catch {
                // Leave the last list up; the next tick retries.
            }
        };
        refresh();
        const id = window.setInterval(refresh, 2000);

        return () => {
            active = false;
            window.clearInterval(id);
        };
    }, [view]);

    if (view === 'join') {
        return (
            <div className="flex flex-1 flex-col">
                <button
                    type="button"
                    onClick={() => setView('pick')}
                    className="mb-4 inline-flex items-center gap-1.5 self-start text-sm text-slate-500 transition hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 dark:text-slate-400 dark:hover:text-slate-100"
                >
                    <ArrowLeft className="size-4" aria-hidden /> Terug
                </button>
                <GameHeader
                    kicker="Racespel"
                    title="Kies een race"
                    description="Tik op de race die de dealer net startte."
                />

                {races.length === 0 ? (
                    <div className="mt-10 flex flex-col items-center text-center text-slate-500 dark:text-slate-400">
                        <span className="mb-4 flex size-20 animate-pulse items-center justify-center rounded-full bg-amber-500/15 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300">
                            <Rabbit className="size-10" aria-hidden />
                        </span>
                        Wachten tot de dealer een race start…
                    </div>
                ) : (
                    <ul className="space-y-2">
                        {races.map((race) => (
                            <li key={race.code}>
                                <button
                                    type="button"
                                    onClick={() => onBoard(race.code)}
                                    className="flex w-full items-center justify-between rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 active:scale-[0.99] dark:bg-white/5 dark:shadow-none dark:ring-white/10 dark:hover:bg-white/10"
                                >
                                    <span className="text-xl font-bold tracking-[0.3em] text-amber-600 dark:text-amber-400">
                                        {race.code}
                                    </span>
                                    <span className="text-sm text-slate-500 dark:text-slate-400">
                                        {race.players}{' '}
                                        {race.players === 1
                                            ? 'inzet'
                                            : 'inzetten'}
                                    </span>
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        );
    }

    return (
        <div className="flex flex-1 flex-col">
            <GameHeader
                kicker="Racespel"
                title="Paardenrace"
                description="Twee telefoons: de dealer start de race en draait de kaarten, het bord toont de baan."
            />

            <button
                type="button"
                onClick={startRace}
                disabled={busy}
                className={cn(optionCardClasses, 'mb-3')}
            >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300">
                    <WalletCards className="size-5" aria-hidden />
                </span>
                <span>
                    <span className="block text-lg font-bold">
                        Ik ben de dealer
                    </span>
                    <span className="block text-sm text-slate-500 dark:text-slate-400">
                        Start de race, plaats de weddenschappen en draai de
                        kaarten.
                    </span>
                </span>
            </button>

            <button
                type="button"
                onClick={() => setView('join')}
                className={optionCardClasses}
            >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300">
                    <Monitor className="size-5" aria-hidden />
                </span>
                <span>
                    <span className="block text-lg font-bold">
                        Ik ben het bord
                    </span>
                    <span className="block text-sm text-slate-500 dark:text-slate-400">
                        Toon de baan. Kies de race die de dealer startte.
                    </span>
                </span>
            </button>

            {error && (
                <p className="mt-4 text-center text-sm text-rose-600 dark:text-rose-400">
                    {error}
                </p>
            )}
        </div>
    );
}

function BoardScreen({ code }: { code: string }) {
    const [state, setState] = useState<RaceState | null>(null);
    const [gone, setGone] = useState(false);

    useEffect(() => {
        let active = true;
        const poll = async () => {
            try {
                const response = await fetch(show(code).url, {
                    headers: { Accept: 'application/json' },
                });

                if (!response.ok) {
                    if (active) {
                        setGone(true);
                    }

                    return;
                }

                const data: { state: RaceState } = await response.json();

                if (active) {
                    setState(data.state);
                }
            } catch {
                // Keep the last frame on a flaky network; the next tick retries.
            }
        };
        poll();
        const id = window.setInterval(poll, 1000);

        return () => {
            active = false;
            window.clearInterval(id);
        };
    }, [code]);

    if (gone) {
        return (
            <p className="mt-10 text-center text-slate-500 dark:text-slate-400">
                Deze race bestaat niet meer.
            </p>
        );
    }

    return (
        <div className="flex flex-1 flex-col">
            <div className="mb-4 flex items-center justify-between">
                <span className="text-sm text-slate-500 dark:text-slate-400">
                    Race
                </span>
                <span className="rounded-lg bg-white px-3 py-1 text-xl font-bold tracking-[0.3em] text-amber-600 ring-1 ring-slate-200 dark:bg-white/5 dark:text-amber-400 dark:ring-white/10">
                    {code}
                </span>
            </div>

            {(!state ||
                state.phase === 'lobby' ||
                state.phase === 'betting') && (
                <div className="mt-10 flex flex-col items-center text-center text-slate-500 dark:text-slate-400">
                    <span className="mb-4 flex size-20 animate-pulse items-center justify-center rounded-full bg-amber-500/15 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300">
                        <Rabbit className="size-10" aria-hidden />
                    </span>
                    Wachten op de dealer…
                    {state && state.bets && state.bets.length > 0 && (
                        <ul className="mx-auto mt-6 w-full max-w-xs space-y-1 text-left text-sm">
                            {state.bets.map((bet) => (
                                <li
                                    key={bet.id}
                                    className="flex items-center justify-between rounded-lg bg-white px-3 py-1.5 ring-1 ring-slate-200 dark:bg-white/5 dark:ring-white/10"
                                >
                                    <span>{bet.player}</span>
                                    <span
                                        className={cn(
                                            'inline-flex items-center gap-1 font-bold',
                                            suitInfo(bet.suit).color,
                                        )}
                                    >
                                        {suitInfo(bet.suit).symbol} · {bet.sips}
                                        <Beer
                                            className="size-3.5"
                                            aria-hidden
                                        />
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}

            {state &&
                (state.phase === 'racing' || state.phase === 'finished') && (
                    <Track state={state} />
                )}
        </div>
    );
}

/** Length of one step on the track, in pixels. */
const ROW_HEIGHT = 64;

/** True on tablet/desktop, where the race reads better running left-to-right. */
function useHorizontal(): boolean {
    const [horizontal, setHorizontal] = useState(false);

    useEffect(() => {
        const query = window.matchMedia('(min-width: 768px)');
        const update = () => setHorizontal(query.matches);
        update();
        query.addEventListener('change', update);

        return () => query.removeEventListener('change', update);
    }, []);

    return horizontal;
}

/**
 * The shared race track. Vertical (start at the bottom) on phones, horizontal
 * (start at the left) on bigger screens. The camera follows the leader so
 * longer tracks scroll into view.
 */
function Track({ state }: { state: RaceState }) {
    const horizontal = useHorizontal();

    return (
        <div className="flex flex-1 flex-col">
            <AnimatePresence>
                {state.lastEvent && (
                    <motion.div
                        key={state.lastEvent}
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="mb-2 rounded-xl bg-amber-500/10 px-4 py-2 text-center text-sm font-semibold text-amber-700 ring-1 ring-amber-500/30 dark:text-amber-300"
                    >
                        {state.lastEvent}
                    </motion.div>
                )}
            </AnimatePresence>

            <div
                className={cn(
                    'flex flex-1 gap-2',
                    horizontal ? 'flex-row' : 'flex-col',
                )}
            >
                <div
                    className={cn(
                        horizontal
                            ? 'flex flex-col justify-around'
                            : 'grid grid-cols-4 gap-2',
                    )}
                >
                    {SUITS.map((suit) => {
                        const isWinner = state.winner === suit.key;

                        return (
                            <div
                                key={suit.key}
                                className={cn(
                                    'flex items-center justify-center gap-1 rounded-xl px-2 py-1.5 ring-1',
                                    horizontal && 'flex-1',
                                    isWinner
                                        ? 'bg-amber-500/10 ring-amber-500'
                                        : 'bg-white ring-slate-200 dark:bg-white/5 dark:ring-white/10',
                                )}
                            >
                                <span
                                    className={cn(
                                        'text-xl leading-none',
                                        suit.color,
                                    )}
                                >
                                    {suit.symbol}
                                </span>
                                {isWinner && (
                                    <Trophy
                                        className="size-4 text-amber-600 dark:text-amber-400"
                                        aria-hidden
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>

                <TrackField state={state} horizontal={horizontal} />
            </div>

            {state.phase === 'finished' && state.winner && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 18 }}
                    className="mt-4 rounded-2xl bg-amber-500/10 p-5 text-center ring-1 ring-amber-500/30"
                >
                    <span className="mx-auto mb-2 flex size-14 items-center justify-center rounded-full bg-amber-500/15 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300">
                        <Trophy className="size-7" aria-hidden />
                    </span>
                    <div
                        className={cn(
                            'text-xl font-bold',
                            suitInfo(state.winner).color,
                        )}
                    >
                        {suitInfo(state.winner).symbol}{' '}
                        {suitInfo(state.winner).label} wint!
                    </div>
                    <ul className="mt-4 space-y-1.5 text-left text-sm">
                        {outcomes(state).map((o) => (
                            <li
                                key={o.bet.id}
                                className="flex items-center justify-between rounded-lg bg-white px-3 py-1.5 ring-1 ring-slate-200 dark:bg-white/5 dark:ring-white/10"
                            >
                                <span>{o.bet.player}</span>
                                <span
                                    className={cn(
                                        'inline-flex items-center gap-1 font-bold',
                                        o.won
                                            ? 'text-emerald-600 dark:text-emerald-400'
                                            : 'text-rose-600 dark:text-rose-400',
                                    )}
                                >
                                    {o.won
                                        ? `deelt ${o.sips} uit`
                                        : `drinkt ${o.sips}`}
                                    <Beer className="size-4" aria-hidden />
                                </span>
                            </li>
                        ))}
                    </ul>
                </motion.div>
            )}
        </div>
    );
}

/**
 * The camera viewport with the lanes, backfires and horses. `horizontal` swaps
 * the travel axis (left→right vs bottom→top); everything else is symmetric.
 */
function TrackField({
    state,
    horizontal,
}: {
    state: RaceState;
    horizontal: boolean;
}) {
    const { trackLength } = state;
    const containerRef = useRef<HTMLDivElement>(null);
    const [size, setSize] = useState(0);

    useLayoutEffect(() => {
        const el = containerRef.current;

        if (!el) {
            return;
        }

        const measure = () =>
            setSize(horizontal ? el.clientWidth : el.clientHeight);
        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(el);

        return () => observer.disconnect();
    }, [horizontal]);

    const contentMain = (trackLength + 1) * ROW_HEIGHT;
    const leadPos = Math.max(...SUITS.map((s) => state.positions[s.key]));
    // Distance of the leader along the travel axis from the origin (finish-side
    // for vertical, start-side for horizontal), then keep it ~62% into view.
    const leaderCoord =
        (horizontal ? leadPos : trackLength - leadPos) * ROW_HEIGHT +
        ROW_HEIGHT / 2;
    const minOffset = Math.min(0, size - contentMain);
    const offset =
        size === 0
            ? 0
            : Math.max(minOffset, Math.min(0, size * 0.62 - leaderCoord));

    /** Position of one horse along the travel axis. */
    const horsePos = (pos: number): number =>
        (horizontal ? pos : trackLength - pos) * ROW_HEIGHT;

    return (
        <div
            ref={containerRef}
            className="relative flex-1 overflow-hidden rounded-2xl bg-slate-100 ring-1 ring-slate-200 dark:bg-white/5 dark:ring-white/10"
        >
            <motion.div
                className="absolute"
                style={
                    horizontal
                        ? { top: 0, bottom: 0, left: 0, width: contentMain }
                        : { left: 0, right: 0, top: 0, height: contentMain }
                }
                animate={horizontal ? { x: offset } : { y: offset }}
                transition={{ type: 'spring', stiffness: 120, damping: 24 }}
            >
                {[1, 2, 3].map((n) => (
                    <div
                        key={n}
                        className="absolute bg-slate-300 dark:bg-white/10"
                        style={
                            horizontal
                                ? {
                                      left: 0,
                                      right: 0,
                                      top: `${n * 25}%`,
                                      height: 1,
                                  }
                                : {
                                      top: 0,
                                      bottom: 0,
                                      left: `${n * 25}%`,
                                      width: 1,
                                  }
                        }
                    />
                ))}

                {Array.from({ length: trackLength + 1 }, (_, idx) => {
                    const step = horizontal ? idx : trackLength - idx;
                    const backfire = state.backfires.find(
                        (b) => b.row === step,
                    );
                    const isFinish = step === trackLength;

                    return (
                        <div
                            key={step}
                            className={cn(
                                'absolute flex items-center justify-center',
                                horizontal
                                    ? 'top-0 bottom-0 border-r border-slate-200 dark:border-white/10'
                                    : 'right-0 left-0 border-b border-slate-200 dark:border-white/10',
                                isFinish && 'bg-amber-500/5',
                                backfire?.revealed && 'bg-amber-500/10',
                            )}
                            style={
                                horizontal
                                    ? {
                                          left: idx * ROW_HEIGHT,
                                          width: ROW_HEIGHT,
                                      }
                                    : {
                                          top: idx * ROW_HEIGHT,
                                          height: ROW_HEIGHT,
                                      }
                            }
                        >
                            {isFinish ? (
                                <span className="flex items-center gap-1 text-xs font-bold tracking-widest text-slate-400 dark:text-slate-500">
                                    <Flag className="size-4" aria-hidden />
                                    {!horizontal && 'FINISH'}
                                </span>
                            ) : backfire ? (
                                backfire.revealed ? (
                                    <span
                                        className={cn(
                                            'text-2xl',
                                            suitInfo(backfire.suit).color,
                                        )}
                                    >
                                        {suitInfo(backfire.suit).symbol}
                                    </span>
                                ) : (
                                    <span
                                        aria-hidden
                                        className="h-9 w-7 rounded-md bg-slate-300 ring-1 ring-slate-400/50 dark:bg-slate-700 dark:ring-slate-500/50"
                                    />
                                )
                            ) : null}
                        </div>
                    );
                })}

                {SUITS.map((suit, i) => (
                    <motion.div
                        key={suit.key}
                        className="absolute flex items-center justify-center"
                        style={
                            horizontal
                                ? {
                                      top: `${i * 25}%`,
                                      height: '25%',
                                      left: 0,
                                      width: ROW_HEIGHT,
                                  }
                                : {
                                      left: `${i * 25}%`,
                                      width: '25%',
                                      top: 0,
                                      height: ROW_HEIGHT,
                                  }
                        }
                        animate={
                            horizontal
                                ? { x: horsePos(state.positions[suit.key]) }
                                : { y: horsePos(state.positions[suit.key]) }
                        }
                        transition={{
                            type: 'spring',
                            stiffness: 260,
                            damping: 26,
                        }}
                    >
                        <motion.span
                            className={cn('flex', suit.color)}
                            animate={
                                state.winner === suit.key
                                    ? { scale: [1, 1.3, 1] }
                                    : { scale: 1 }
                            }
                            transition={{
                                repeat:
                                    state.winner === suit.key ? Infinity : 0,
                                duration: 0.8,
                            }}
                        >
                            <Rabbit className="size-8" aria-hidden />
                        </motion.span>
                    </motion.div>
                ))}
            </motion.div>
        </div>
    );
}

const stepperButtonClasses =
    'flex size-10 items-center justify-center rounded-xl bg-white ring-1 ring-slate-200 transition hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 active:scale-[0.97] dark:bg-white/5 dark:ring-white/10 dark:hover:bg-white/10';

function DealerScreen({ code }: { code: string }) {
    const [state, setState] = useState<RaceState>(() => bettingState([]));
    const nextBetId = useRef(1);

    // Keep the board in sync with every change the dealer makes.
    const sync = useCallback(
        (next: RaceState) => {
            setState(next);
            void pushState(code, next);
        },
        [code],
    );

    const [player, setPlayer] = useState('');
    const [suit, setSuit] = useState<Suit>('hearts');
    const [sips, setSips] = useState(2);
    const [steps, setSteps] = useState(DEFAULT_STEPS);

    const addBet = () => {
        const name = player.trim();

        if (name === '') {
            return;
        }

        const bet: Bet = { id: nextBetId.current++, player: name, suit, sips };
        sync({ ...state, bets: [...state.bets, bet] });
        setPlayer('');
    };

    const removeBet = (id: number) =>
        sync({ ...state, bets: state.bets.filter((b) => b.id !== id) });

    if (state.phase === 'betting') {
        return (
            <div className="flex flex-1 flex-col">
                <header className="mb-5">
                    <p className="text-xs font-semibold tracking-widest text-amber-600 uppercase dark:text-amber-400">
                        Dealer
                    </p>
                    <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                        Weddenschappen
                    </h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Code{' '}
                        <span className="font-bold text-amber-600 dark:text-amber-400">
                            {code}
                        </span>{' '}
                        · iedereen kiest een paard en zet slokken in.
                    </p>
                </header>

                <Panel>
                    <input
                        value={player}
                        onChange={(e) => setPlayer(e.target.value)}
                        placeholder="Naam"
                        className="mb-3 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 placeholder:text-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-400/40 focus:outline-none dark:border-white/10 dark:bg-slate-950 dark:placeholder:text-slate-600"
                    />
                    <div className="mb-3 grid grid-cols-4 gap-2">
                        {SUITS.map((s) => (
                            <button
                                key={s.key}
                                type="button"
                                onClick={() => setSuit(s.key)}
                                className={cn(
                                    'flex flex-col items-center gap-0.5 rounded-xl py-2 ring-1 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 active:scale-[0.97]',
                                    suit === s.key
                                        ? 'bg-amber-500/10 ring-amber-500'
                                        : 'bg-white ring-slate-200 hover:bg-slate-100 dark:bg-white/5 dark:ring-white/10 dark:hover:bg-white/10',
                                )}
                            >
                                <span
                                    className={cn(
                                        'text-2xl leading-none',
                                        s.color,
                                    )}
                                >
                                    {s.symbol}
                                </span>
                                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                    {s.label}
                                </span>
                            </button>
                        ))}
                    </div>
                    <div className="mb-3 flex items-center justify-center gap-4">
                        <button
                            type="button"
                            onClick={() => setSips((n) => Math.max(1, n - 1))}
                            aria-label="Minder slokken"
                            className={stepperButtonClasses}
                        >
                            <Minus className="size-4" aria-hidden />
                        </button>
                        <span className="flex items-center gap-1.5 text-lg font-bold tabular-nums">
                            {sips}
                            <Beer
                                className="size-4 text-amber-600 dark:text-amber-400"
                                aria-hidden
                            />
                        </span>
                        <button
                            type="button"
                            onClick={() => setSips((n) => n + 1)}
                            aria-label="Meer slokken"
                            className={stepperButtonClasses}
                        >
                            <Plus className="size-4" aria-hidden />
                        </button>
                    </div>
                    <ActionButton onClick={addBet} className="h-12 text-sm">
                        <Plus className="size-4" aria-hidden /> Inzet toevoegen
                    </ActionButton>
                </Panel>

                {state.bets.length > 0 && (
                    <ul className="mt-4 space-y-2">
                        {state.bets.map((bet) => (
                            <li
                                key={bet.id}
                                className="flex items-center justify-between rounded-xl bg-white px-4 py-2 shadow-sm ring-1 ring-slate-200 dark:bg-white/5 dark:shadow-none dark:ring-white/10"
                            >
                                <span className="font-semibold">
                                    {bet.player}
                                </span>
                                <span className="flex items-center gap-3">
                                    <span
                                        className={cn(
                                            'inline-flex items-center gap-1 font-bold',
                                            suitInfo(bet.suit).color,
                                        )}
                                    >
                                        {suitInfo(bet.suit).symbol} · {bet.sips}
                                        <Beer
                                            className="size-3.5"
                                            aria-hidden
                                        />
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => removeBet(bet.id)}
                                        aria-label={`Verwijder inzet van ${bet.player}`}
                                        className="text-slate-400 transition hover:text-rose-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 dark:text-slate-500 dark:hover:text-rose-400"
                                    >
                                        <X className="size-4" aria-hidden />
                                    </button>
                                </span>
                            </li>
                        ))}
                    </ul>
                )}

                <div className="mt-6">
                    <p className="mb-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
                        Aantal stappen
                    </p>
                    <div className="grid grid-cols-5 gap-2">
                        {STEP_OPTIONS.map((option) => (
                            <button
                                key={option}
                                type="button"
                                onClick={() => setSteps(option)}
                                className={cn(
                                    'rounded-xl py-2 text-sm font-bold ring-1 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 active:scale-[0.97]',
                                    steps === option
                                        ? 'bg-amber-500 text-slate-950 ring-amber-500'
                                        : 'bg-white text-slate-600 ring-slate-200 hover:bg-slate-100 dark:bg-white/5 dark:text-slate-300 dark:ring-white/10 dark:hover:bg-white/10',
                                )}
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mt-auto pt-6">
                    <ActionButton
                        onClick={() => sync(startRace(state.bets, steps))}
                        disabled={state.bets.length === 0}
                        className="text-lg"
                    >
                        <Rabbit className="size-5" aria-hidden /> Start de race
                    </ActionButton>
                </div>
            </div>
        );
    }

    // Racing / finished: tap the big card to flip the next one.
    const canFlip = state.phase === 'racing';
    const drawnSuit = state.drawn ? suitInfo(state.drawn) : null;

    return (
        <div className="flex flex-1 flex-col">
            <header className="mb-2 text-center">
                <h1 className="text-2xl font-bold">Dealer</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                    {canFlip
                        ? 'Tik op de kaart om te draaien.'
                        : 'De race is gereden.'}
                </p>
            </header>

            <div className="flex flex-1 flex-col items-center justify-center">
                <div
                    className="relative h-80 w-56"
                    style={{ perspective: 1200 }}
                >
                    <AnimatePresence initial={false}>
                        <motion.div
                            key={state.drawn ? state.deck.length : 'cover'}
                            onClick={
                                canFlip ? () => sync(flip(state)) : undefined
                            }
                            initial={{ rotateY: -180, opacity: 0 }}
                            animate={{ rotateY: 0, opacity: 1 }}
                            exit={{ rotateY: 180, opacity: 0 }}
                            transition={{ duration: 0.7, ease: 'easeInOut' }}
                            style={{
                                transformStyle: 'preserve-3d',
                                backfaceVisibility: 'hidden',
                            }}
                            className={cn(
                                'absolute inset-0 flex flex-col items-center justify-center rounded-3xl shadow-lg select-none',
                                drawnSuit
                                    ? 'bg-white ring-1 ring-slate-200 dark:ring-white/10'
                                    : 'bg-amber-500 ring-4 ring-slate-950/10 ring-inset',
                                canFlip && 'cursor-pointer',
                            )}
                        >
                            {drawnSuit ? (
                                <>
                                    <span
                                        className={cn(
                                            'absolute top-3 left-4 text-2xl font-bold',
                                            drawnSuit.color,
                                        )}
                                    >
                                        {drawnSuit.symbol}
                                    </span>
                                    <span
                                        className={cn(
                                            'text-[7rem] leading-none',
                                            drawnSuit.color,
                                        )}
                                    >
                                        {drawnSuit.symbol}
                                    </span>
                                    <span
                                        className={cn(
                                            'absolute right-4 bottom-3 rotate-180 text-2xl font-bold',
                                            drawnSuit.color,
                                        )}
                                    >
                                        {drawnSuit.symbol}
                                    </span>
                                </>
                            ) : (
                                <>
                                    <Rabbit
                                        className="size-20 text-slate-950"
                                        aria-hidden
                                    />
                                    <span className="mt-3 text-sm font-semibold text-slate-950/70">
                                        Tik om te draaien
                                    </span>
                                </>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>

                <div className="mt-4 h-6">
                    {state.lastEvent && (
                        <p className="text-center text-sm font-semibold text-amber-600 dark:text-amber-400">
                            {state.lastEvent}
                        </p>
                    )}
                </div>

                <div className="grid w-full grid-cols-4 gap-2">
                    {SUITS.map((s) => (
                        <div
                            key={s.key}
                            className="flex flex-col items-center rounded-xl bg-white py-2 ring-1 ring-slate-200 dark:bg-white/5 dark:ring-white/10"
                        >
                            <span className={cn('text-lg', s.color)}>
                                {s.symbol}
                            </span>
                            <span className="text-xs font-bold text-slate-600 tabular-nums dark:text-slate-300">
                                {state.positions[s.key]}/{state.trackLength}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {state.phase === 'finished' && (
                <div className="mt-auto pt-4">
                    <ActionButton onClick={() => sync(bettingState([]))}>
                        <RotateCcw className="size-5" aria-hidden /> Nieuw potje
                    </ActionButton>
                </div>
            )}
        </div>
    );
}
