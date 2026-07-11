import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
    ArrowLeft,
    Beer,
    Flag,
    Layers,
    Monitor,
    Plus,
    Rabbit,
    RotateCcw,
    Trophy,
    WalletCards,
    X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
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
    CelebrationHeader,
    CountUp,
    GameHeader,
    GameShell,
    IconBadge,
    Panel,
    PhaseTransition,
    Stepper,
} from '@/components/game-ui';
import { feel } from '@/hooks/use-game-feel';
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
import { horseRace } from '@/routes';

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

/** Pip colour on a white card face (spades/clubs must read as black). */
const SUIT_ON_CARD: Record<Suit, string> = {
    hearts: 'text-red-500',
    diamonds: 'text-red-500',
    spades: 'text-slate-900',
    clubs: 'text-slate-900',
};

/** Glow colour for the reveal flash behind the dealer card. */
const SUIT_FLASH: Record<Suit, string> = {
    hearts: 'var(--color-red-500)',
    diamonds: 'var(--color-red-500)',
    spades: 'var(--color-slate-300)',
    clubs: 'var(--color-slate-300)',
};

/** Lane flash on the board when a suit's horse takes a step. */
const LANE_FLASH: Record<Suit, string> = {
    hearts: 'bg-red-500/20',
    diamonds: 'bg-red-500/20',
    spades: 'bg-slate-100/15',
    clubs: 'bg-slate-100/15',
};

type Role = 'choose' | 'board' | 'dealer';

export default function HorseRace() {
    const [role, setRole] = useState<Role>('choose');
    const [code, setCode] = useState('');

    return (
        <GameShell title="Paardenrace" accent="emerald">
            <PhaseTransition phaseKey={role}>
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
            </PhaseTransition>
        </GameShell>
    );
}

interface OpenRace {
    code: string;
    phase: string;
    players: number;
}

/** One of the two big role cards on the choose screen. */
function RoleCard({
    icon,
    title,
    description,
    onClick,
    disabled = false,
    className,
}: {
    icon: LucideIcon;
    title: string;
    description: string;
    onClick: () => void;
    disabled?: boolean;
    className?: string;
}) {
    return (
        <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 24 }}
            disabled={disabled}
            onClick={() => {
                feel.select();
                onClick();
            }}
            className={cn(
                'flex w-full items-center gap-4 rounded-2xl bg-white/[0.045] p-5 text-left ring-1 ring-white/10 transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-(--glow) disabled:opacity-50',
                className,
            )}
        >
            <IconBadge icon={icon} />
            <span className="min-w-0">
                <span className="block text-lg font-bold text-white">
                    {title}
                </span>
                <span className="mt-0.5 block text-sm leading-snug text-slate-400">
                    {description}
                </span>
            </span>
        </motion.button>
    );
}

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
    const createRace = async () => {
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

    return (
        <PhaseTransition phaseKey={view}>
            {view === 'join' ? (
                <div className="flex flex-1 flex-col">
                    <button
                        type="button"
                        onClick={() => {
                            feel.select();
                            setView('pick');
                        }}
                        className="mb-4 inline-flex h-9 items-center gap-1.5 self-start rounded-full bg-white/5 pr-4 pl-3 text-sm font-medium text-slate-300 ring-1 ring-white/10 transition hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-(--glow)"
                    >
                        <ArrowLeft className="size-4" aria-hidden /> Terug
                    </button>
                    <GameHeader
                        kicker="Racespel"
                        title="Kies een race"
                        description="Tik op de race die de dealer net startte."
                    />

                    {races.length === 0 ? (
                        <div className="mt-10 flex flex-col items-center gap-4 text-center">
                            <IconBadge
                                icon={Rabbit}
                                size="lg"
                                className="animate-float"
                            />
                            <p className="text-sm text-slate-400">
                                Wachten tot de dealer een race start…
                            </p>
                        </div>
                    ) : (
                        <ul className="space-y-2">
                            {races.map((race) => (
                                <li key={race.code}>
                                    <motion.button
                                        type="button"
                                        whileTap={{ scale: 0.97 }}
                                        transition={{
                                            type: 'spring',
                                            stiffness: 400,
                                            damping: 24,
                                        }}
                                        onClick={() => {
                                            feel.tap();
                                            onBoard(race.code);
                                        }}
                                        className="flex min-h-14 w-full items-center justify-between rounded-2xl bg-white/[0.045] p-4 ring-1 ring-white/10 transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-(--glow)"
                                    >
                                        <span className="font-display text-2xl tracking-[0.3em] text-(--glow-strong)">
                                            {race.code}
                                        </span>
                                        <span className="text-sm text-slate-400">
                                            {race.players}{' '}
                                            {race.players === 1
                                                ? 'inzet'
                                                : 'inzetten'}
                                        </span>
                                    </motion.button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            ) : (
                <div className="flex flex-1 flex-col">
                    <GameHeader
                        kicker="Racespel"
                        title="Paardenrace"
                        description="Twee telefoons: de dealer start de race en draait de kaarten, het bord toont de baan."
                    />

                    <RoleCard
                        icon={WalletCards}
                        title="Ik ben de dealer"
                        description="Start de race, plaats de weddenschappen en draai de kaarten."
                        disabled={busy}
                        onClick={createRace}
                        className="mb-3"
                    />

                    <RoleCard
                        icon={Monitor}
                        title="Ik ben het bord"
                        description="Toon de baan. Kies de race die de dealer startte."
                        onClick={() => setView('join')}
                    />

                    {error && (
                        <p
                            aria-live="polite"
                            className="mt-4 text-center text-sm text-rose-400"
                        >
                            {error}
                        </p>
                    )}
                </div>
            )}
        </PhaseTransition>
    );
}

/** A single bet row on the board's waiting screen. */
function BetRow({ bet }: { bet: Bet }) {
    const reduceMotion = useReducedMotion();

    return (
        <motion.li
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between rounded-xl bg-white/[0.045] px-3 py-2 ring-1 ring-white/10"
        >
            <span className="text-sm font-semibold text-white">
                {bet.player}
            </span>
            <span
                className={cn(
                    'inline-flex items-center gap-1 text-sm font-bold',
                    suitInfo(bet.suit).color,
                )}
            >
                {suitInfo(bet.suit).symbol} · {bet.sips}
                <Beer className="size-3.5" aria-hidden />
            </span>
        </motion.li>
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

    const phaseKey = gone
        ? 'gone'
        : state && (state.phase === 'racing' || state.phase === 'finished')
          ? 'race'
          : 'waiting';

    return (
        <div className="flex flex-1 flex-col">
            <div className="mb-4 flex items-center justify-between">
                <span className="text-xs font-semibold tracking-widest text-slate-500 uppercase">
                    Race
                </span>
                <span className="rounded-xl bg-white/5 px-3 py-1 font-display text-xl tracking-[0.3em] text-(--glow-strong) ring-1 ring-white/10">
                    {code}
                </span>
            </div>

            <PhaseTransition phaseKey={phaseKey}>
                {gone ? (
                    <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
                        <IconBadge icon={Rabbit} size="lg" />
                        <div>
                            <p className="font-display text-3xl text-white">
                                Race voorbij
                            </p>
                            <p className="mt-2 text-sm text-slate-400">
                                Deze race bestaat niet meer.
                            </p>
                        </div>
                        <div className="w-full pt-2">
                            <ActionButton
                                variant="neutral"
                                href={horseRace().url}
                            >
                                Terug naar start
                            </ActionButton>
                        </div>
                    </div>
                ) : phaseKey === 'race' && state ? (
                    <Track state={state} />
                ) : (
                    <div className="mt-10 flex flex-col items-center gap-4 text-center">
                        <IconBadge
                            icon={Rabbit}
                            size="lg"
                            className="animate-float"
                        />
                        <p className="text-sm text-slate-400">
                            Wachten op de dealer…
                        </p>
                        {state && state.bets && state.bets.length > 0 && (
                            <ul className="mt-2 w-full max-w-xs space-y-2 text-left">
                                {state.bets.map((bet) => (
                                    <BetRow key={bet.id} bet={bet} />
                                ))}
                            </ul>
                        )}
                    </div>
                )}
            </PhaseTransition>
        </div>
    );
}

/** The payout list after a finish: rows cascade in, sips count up. */
function PayoutList({ state }: { state: RaceState }) {
    const reduceMotion = useReducedMotion();

    return (
        <ul className="w-full space-y-2">
            {outcomes(state).map((o, index) => (
                <motion.li
                    key={o.bet.id}
                    initial={
                        reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 }
                    }
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                        delay: 0.2 + index * 0.12,
                        type: 'spring',
                        stiffness: 300,
                        damping: 24,
                    }}
                    className="flex items-center justify-between rounded-xl bg-white/[0.045] px-4 py-2.5 ring-1 ring-white/10"
                >
                    <span className="text-sm font-semibold text-white">
                        {o.bet.player}
                    </span>
                    <span
                        className={cn(
                            'inline-flex items-baseline gap-1.5 text-sm font-bold',
                            o.won ? 'text-emerald-300' : 'text-rose-400',
                        )}
                    >
                        {o.won ? 'deelt' : 'drinkt'}
                        <CountUp
                            value={o.sips}
                            duration={0.9}
                            className="font-display text-xl"
                        />
                        {o.won && 'uit'}
                        <Beer className="size-4 self-center" aria-hidden />
                    </span>
                </motion.li>
            ))}
        </ul>
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
                        role="status"
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="mb-2 animate-shake rounded-xl bg-rose-500/15 px-4 py-2 text-center text-sm font-semibold text-rose-300 ring-1 ring-rose-500/40"
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
                            ? 'flex flex-col justify-around gap-2'
                            : 'grid grid-cols-4 gap-2',
                    )}
                >
                    {SUITS.map((suit) => {
                        const isWinner = state.winner === suit.key;

                        return (
                            <div
                                key={suit.key}
                                className={cn(
                                    'flex flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-1.5 ring-1',
                                    horizontal && 'flex-1',
                                    isWinner
                                        ? 'bg-(--glow)/12 ring-(--glow)'
                                        : 'bg-white/[0.045] ring-white/10',
                                )}
                            >
                                <span
                                    className={cn(
                                        'flex items-center gap-1 text-xl leading-none',
                                        suit.color,
                                    )}
                                >
                                    {suit.symbol}
                                    {isWinner && (
                                        <Trophy
                                            className="size-4 text-(--glow-strong)"
                                            aria-hidden
                                        />
                                    )}
                                </span>
                                <span
                                    className={cn(
                                        'text-[10px] font-medium',
                                        isWinner
                                            ? 'text-(--glow-strong)'
                                            : 'text-slate-500',
                                    )}
                                >
                                    {suit.label}
                                </span>
                            </div>
                        );
                    })}
                </div>

                <TrackField state={state} horizontal={horizontal} />
            </div>

            {state.phase === 'finished' && state.winner && (
                <div className="mt-5">
                    <CelebrationHeader
                        icon={Trophy}
                        tone="win"
                        title={`${suitInfo(state.winner).symbol} ${suitInfo(state.winner).label} wint!`}
                        subtitle="Winnaars delen dubbel uit."
                    >
                        <PayoutList state={state} />
                    </CelebrationHeader>
                </div>
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
    const reduceMotion = useReducedMotion();

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

    /** Lane index of the last drawn suit, for the step flash. */
    const drawnLane = state.drawn
        ? SUITS.findIndex((s) => s.key === state.drawn)
        : -1;
    /** One step from glory: the finish line starts pulsing. */
    const nearFinish = !state.winner && leadPos === trackLength - 1;

    return (
        <div
            ref={containerRef}
            className="relative flex-1 overflow-hidden rounded-2xl bg-white/[0.045] ring-1 ring-white/10"
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
                        className="absolute bg-white/10"
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

                {state.drawn && drawnLane >= 0 && (
                    <motion.div
                        key={`lane-${state.drawn}-${state.deck.length}`}
                        aria-hidden
                        className={cn(
                            'pointer-events-none absolute',
                            LANE_FLASH[state.drawn],
                        )}
                        style={
                            horizontal
                                ? {
                                      top: `${drawnLane * 25}%`,
                                      height: '25%',
                                      left: 0,
                                      right: 0,
                                  }
                                : {
                                      left: `${drawnLane * 25}%`,
                                      width: '25%',
                                      top: 0,
                                      bottom: 0,
                                  }
                        }
                        initial={{ opacity: 0.7 }}
                        animate={{ opacity: 0 }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                    />
                )}

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
                                    ? 'top-0 bottom-0 border-r border-white/10'
                                    : 'right-0 left-0 border-b border-white/10',
                                isFinish && 'bg-(--glow)/5',
                                backfire?.revealed && 'bg-rose-500/10',
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
                                <>
                                    <span
                                        aria-hidden
                                        className={cn(
                                            'absolute',
                                            horizontal
                                                ? 'inset-y-0 left-0 w-2'
                                                : 'inset-x-0 bottom-0 h-2',
                                        )}
                                        style={{
                                            backgroundImage:
                                                'repeating-conic-gradient(rgb(255 255 255 / 0.35) 0% 25%, rgb(2 6 23 / 0.7) 0% 50%)',
                                            backgroundSize: '8px 8px',
                                        }}
                                    />
                                    {nearFinish && (
                                        <span
                                            aria-hidden
                                            className="absolute inset-0 animate-pulse bg-(--glow)/15"
                                        />
                                    )}
                                    <span className="flex items-center gap-1 font-display text-xs tracking-widest text-slate-400">
                                        <Flag className="size-4" aria-hidden />
                                        {!horizontal && 'FINISH'}
                                    </span>
                                </>
                            ) : backfire ? (
                                backfire.revealed ? (
                                    <motion.span
                                        initial={
                                            reduceMotion
                                                ? { opacity: 0 }
                                                : {
                                                      rotateY: 180,
                                                      scale: 0.5,
                                                      opacity: 0,
                                                  }
                                        }
                                        animate={
                                            reduceMotion
                                                ? { opacity: 1 }
                                                : {
                                                      rotateY: 0,
                                                      scale: 1,
                                                      opacity: 1,
                                                  }
                                        }
                                        transition={{
                                            type: 'spring',
                                            stiffness: 300,
                                            damping: 20,
                                        }}
                                        className={cn(
                                            'flex h-9 w-7 items-center justify-center rounded-md bg-white text-lg font-bold shadow-[0_0_18px_-2px_var(--color-rose-500)] ring-2 ring-rose-500/70',
                                            SUIT_ON_CARD[backfire.suit],
                                        )}
                                    >
                                        {suitInfo(backfire.suit).symbol}
                                    </motion.span>
                                ) : (
                                    <span
                                        aria-hidden
                                        className="h-9 w-7 rounded-md bg-slate-700 ring-1 ring-slate-500/60"
                                        style={{
                                            backgroundImage:
                                                'repeating-linear-gradient(45deg, rgb(255 255 255 / 0.07) 0 4px, transparent 4px 8px)',
                                        }}
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
                            className={cn(
                                'flex drop-shadow-[0_2px_6px_rgba(2,6,23,0.6)]',
                                suit.color,
                            )}
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

            {state.phase === 'racing' && (
                <motion.div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 1, 1, 0] }}
                    transition={{
                        duration: 2.4,
                        times: [0, 0.15, 0.75, 1],
                        delay: 0.2,
                    }}
                >
                    <span className="rounded-2xl bg-slate-950/70 px-6 py-2.5 font-display text-3xl text-(--glow-strong) ring-1 ring-(--glow)/30 backdrop-blur-sm">
                        Ze zijn los!
                    </span>
                </motion.div>
            )}
        </div>
    );
}

function DealerScreen({ code }: { code: string }) {
    const [state, setState] = useState<RaceState>(() => bettingState([]));
    const nextBetId = useRef(1);
    const reduceMotion = useReducedMotion();

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

    // Racing / finished: tap the big card to flip the next one.
    const canFlip = state.phase === 'racing';
    const drawnSuit = state.drawn ? suitInfo(state.drawn) : null;
    const deckLayers = Math.min(3, Math.ceil(state.deck.length / 16));

    return (
        <PhaseTransition phaseKey={state.phase}>
            {state.phase === 'betting' ? (
                <div className="flex flex-1 flex-col">
                    <header className="mb-5">
                        <p className="text-xs font-semibold tracking-widest text-(--glow-strong) uppercase">
                            Dealer
                        </p>
                        <h1 className="mt-1 font-display text-3xl text-white">
                            Weddenschappen
                        </h1>
                        <p className="mt-1 text-sm text-slate-400">
                            Code{' '}
                            <span className="font-display text-base tracking-[0.2em] text-(--glow-strong)">
                                {code}
                            </span>{' '}
                            · iedereen kiest een paard en zet slokken in.
                        </p>
                    </header>

                    <Panel>
                        <input
                            value={player}
                            onChange={(e) => setPlayer(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    feel.tap();
                                    addBet();
                                }
                            }}
                            placeholder="Naam"
                            className="mb-3 w-full rounded-xl bg-white/5 px-4 py-3 text-white ring-1 ring-white/10 placeholder:text-slate-500 focus:ring-2 focus:ring-(--glow) focus:outline-none"
                        />
                        <div className="mb-3 grid grid-cols-4 gap-2">
                            {SUITS.map((s) => (
                                <button
                                    key={s.key}
                                    type="button"
                                    aria-pressed={suit === s.key}
                                    onClick={() => {
                                        feel.select();
                                        setSuit(s.key);
                                    }}
                                    className={cn(
                                        'flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-xl ring-1 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-(--glow) active:scale-[0.96]',
                                        suit === s.key
                                            ? 'bg-(--glow)/12 ring-(--glow)'
                                            : 'bg-white/5 ring-white/10 hover:bg-white/10',
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
                                    <span
                                        className={cn(
                                            'text-[10px] font-medium',
                                            suit === s.key
                                                ? 'text-(--glow-strong)'
                                                : 'text-slate-400',
                                        )}
                                    >
                                        {s.label}
                                    </span>
                                </button>
                            ))}
                        </div>
                        <div className="mb-3">
                            <Stepper
                                label="Slokken"
                                value={sips}
                                onChange={setSips}
                                min={1}
                                max={99}
                            />
                        </div>
                        <ActionButton
                            onClick={addBet}
                            variant="neutral"
                            className="h-12 text-sm"
                        >
                            <Plus className="size-4" aria-hidden /> Inzet
                            toevoegen
                        </ActionButton>
                    </Panel>

                    {state.bets.length > 0 && (
                        <ul className="mt-4 space-y-2">
                            {state.bets.map((bet) => (
                                <motion.li
                                    key={bet.id}
                                    initial={
                                        reduceMotion
                                            ? { opacity: 0 }
                                            : { opacity: 0, y: 8 }
                                    }
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex items-center justify-between rounded-xl bg-white/[0.045] py-1.5 pr-1.5 pl-4 ring-1 ring-white/10"
                                >
                                    <span className="font-semibold text-white">
                                        {bet.player}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <span
                                            className={cn(
                                                'inline-flex items-center gap-1 font-bold',
                                                suitInfo(bet.suit).color,
                                            )}
                                        >
                                            {suitInfo(bet.suit).symbol} ·{' '}
                                            {bet.sips}
                                            <Beer
                                                className="size-3.5"
                                                aria-hidden
                                            />
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                feel.select();
                                                removeBet(bet.id);
                                            }}
                                            aria-label={`Verwijder inzet van ${bet.player}`}
                                            className="flex size-11 items-center justify-center rounded-xl text-slate-500 transition hover:text-rose-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-(--glow)"
                                        >
                                            <X className="size-4" aria-hidden />
                                        </button>
                                    </span>
                                </motion.li>
                            ))}
                        </ul>
                    )}

                    <div className="mt-6">
                        <p className="mb-2 text-sm font-medium text-slate-300">
                            Aantal stappen
                        </p>
                        <div className="grid grid-cols-5 gap-2">
                            {STEP_OPTIONS.map((option) => (
                                <button
                                    key={option}
                                    type="button"
                                    aria-pressed={steps === option}
                                    onClick={() => {
                                        feel.select();
                                        setSteps(option);
                                    }}
                                    className={cn(
                                        'h-11 rounded-xl text-sm font-bold ring-1 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-(--glow) active:scale-[0.96]',
                                        steps === option
                                            ? 'bg-(--glow) text-slate-950 ring-(--glow)'
                                            : 'bg-white/5 text-slate-300 ring-white/10 hover:bg-white/10',
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
                            <Rabbit className="size-5" aria-hidden /> Start de
                            race
                        </ActionButton>
                    </div>
                </div>
            ) : state.phase === 'finished' ? (
                <div className="flex flex-1 flex-col">
                    <div className="flex flex-1 flex-col justify-center py-6">
                        <CelebrationHeader
                            icon={Trophy}
                            tone="win"
                            title={
                                state.winner
                                    ? `${suitInfo(state.winner).symbol} ${suitInfo(state.winner).label} wint!`
                                    : 'De race is gereden!'
                            }
                            subtitle="Lees de uitslag voor aan de tafel."
                        >
                            <PayoutList state={state} />
                        </CelebrationHeader>
                    </div>
                    <div className="mt-auto pt-4">
                        <ActionButton onClick={() => sync(bettingState([]))}>
                            <RotateCcw className="size-5" aria-hidden /> Nieuw
                            potje
                        </ActionButton>
                    </div>
                </div>
            ) : (
                <div className="flex flex-1 flex-col">
                    <header className="mb-2 text-center">
                        <p className="text-xs font-semibold tracking-widest text-(--glow-strong) uppercase">
                            Dealer · race {code}
                        </p>
                        <h1 className="mt-1 font-display text-3xl text-white">
                            Draai de kaarten
                        </h1>
                        <p className="mt-1 text-sm text-slate-400">
                            Tik op de kaart om te draaien.
                        </p>
                    </header>

                    <div className="flex flex-1 flex-col items-center justify-center">
                        <div
                            className="relative h-80 w-56"
                            style={{ perspective: 1200 }}
                        >
                            {Array.from({ length: deckLayers }, (_, i) => (
                                <span
                                    key={i}
                                    aria-hidden
                                    className="absolute inset-0 rounded-3xl bg-(--glow-deep)/35 ring-1 ring-white/10"
                                    style={{
                                        transform: `translate(${(i + 1) * 5}px, ${(i + 1) * 5}px)`,
                                    }}
                                />
                            ))}

                            {drawnSuit && state.drawn && (
                                <motion.span
                                    key={`flash-${state.deck.length}`}
                                    aria-hidden
                                    className="pointer-events-none absolute -inset-4 z-20 rounded-[2rem]"
                                    style={{
                                        boxShadow: `0 0 80px 14px ${SUIT_FLASH[state.drawn]}`,
                                    }}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: [0, 1, 0] }}
                                    transition={{
                                        duration: 1.1,
                                        times: [0, 0.35, 1],
                                        delay: 0.2,
                                    }}
                                />
                            )}

                            <AnimatePresence initial={false}>
                                <motion.button
                                    key={
                                        state.drawn
                                            ? state.deck.length
                                            : 'cover'
                                    }
                                    type="button"
                                    disabled={!canFlip}
                                    aria-label={
                                        drawnSuit
                                            ? `${drawnSuit.label} gedraaid — tik voor de volgende kaart`
                                            : 'Draai de eerste kaart'
                                    }
                                    onClick={() => {
                                        if (!canFlip) {
                                            return;
                                        }

                                        feel.flip();
                                        sync(flip(state));
                                    }}
                                    initial={{ rotateY: -180, opacity: 0 }}
                                    animate={{ rotateY: 0, opacity: 1 }}
                                    exit={{ rotateY: 180, opacity: 0 }}
                                    transition={
                                        reduceMotion
                                            ? { duration: 0 }
                                            : {
                                                  duration: 0.7,
                                                  ease: 'easeInOut',
                                              }
                                    }
                                    style={{
                                        transformStyle: 'preserve-3d',
                                        backfaceVisibility: 'hidden',
                                    }}
                                    className={cn(
                                        'absolute inset-0 z-10 flex flex-col items-center justify-center rounded-3xl shadow-[0_18px_50px_-12px_rgba(2,6,23,0.9)] select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-(--glow)',
                                        drawnSuit
                                            ? 'bg-white ring-1 ring-white/10'
                                            : 'bg-(--glow-deep) ring-1 ring-white/15',
                                        canFlip && 'cursor-pointer',
                                    )}
                                >
                                    {drawnSuit && state.drawn ? (
                                        <>
                                            <span
                                                className={cn(
                                                    'absolute top-3 left-4 text-2xl font-bold',
                                                    SUIT_ON_CARD[state.drawn],
                                                )}
                                            >
                                                {drawnSuit.symbol}
                                            </span>
                                            <span
                                                className={cn(
                                                    'text-[7rem] leading-none',
                                                    SUIT_ON_CARD[state.drawn],
                                                )}
                                            >
                                                {drawnSuit.symbol}
                                            </span>
                                            <span
                                                className={cn(
                                                    'mt-1 font-display text-lg',
                                                    SUIT_ON_CARD[state.drawn],
                                                )}
                                            >
                                                {drawnSuit.label}
                                            </span>
                                            <span
                                                className={cn(
                                                    'absolute right-4 bottom-3 rotate-180 text-2xl font-bold',
                                                    SUIT_ON_CARD[state.drawn],
                                                )}
                                            >
                                                {drawnSuit.symbol}
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            <span
                                                aria-hidden
                                                className="pointer-events-none absolute inset-2 rounded-2xl border-2 border-slate-950/20"
                                            />
                                            <Rabbit
                                                className="size-20 text-slate-950"
                                                aria-hidden
                                            />
                                            <span className="mt-3 text-sm font-semibold text-slate-950/70">
                                                Tik om te draaien
                                            </span>
                                        </>
                                    )}
                                </motion.button>
                            </AnimatePresence>
                        </div>

                        <p className="mt-4 flex items-center gap-1.5 text-xs font-medium text-slate-500 tabular-nums">
                            <Layers className="size-3.5" aria-hidden />
                            {state.deck.length}{' '}
                            {state.deck.length === 1 ? 'kaart' : 'kaarten'} in
                            de stapel
                        </p>

                        <div
                            className="mt-2 h-6"
                            role="status"
                            aria-live="polite"
                        >
                            {state.lastEvent && (
                                <p
                                    key={state.deck.length}
                                    className="animate-shake text-center text-sm font-semibold text-rose-300"
                                >
                                    {state.lastEvent}
                                </p>
                            )}
                        </div>

                        <div className="grid w-full grid-cols-4 gap-2">
                            {SUITS.map((s) => (
                                <div
                                    key={s.key}
                                    className={cn(
                                        'flex flex-col items-center rounded-xl py-2 ring-1 transition',
                                        state.drawn === s.key
                                            ? 'bg-(--glow)/10 ring-(--glow)/60'
                                            : 'bg-white/[0.045] ring-white/10',
                                    )}
                                >
                                    <span
                                        className={cn(
                                            'text-lg leading-none',
                                            s.color,
                                        )}
                                    >
                                        {s.symbol}
                                    </span>
                                    <span className="mt-0.5 font-display text-base text-white tabular-nums">
                                        {state.positions[s.key]}
                                        <span className="text-slate-500">
                                            /{state.trackLength}
                                        </span>
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </PhaseTransition>
    );
}
