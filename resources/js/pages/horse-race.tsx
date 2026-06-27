import { Head, Link } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Beer, Flag, Minus, Plus, RotateCcw, Trophy, X } from 'lucide-react';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { list, show, store, update } from '@/actions/App/Http/Controllers/RaceController';
import { Button } from '@/components/ui/button';
import { DEFAULT_STEPS, flip, outcomes, startRace, STEP_OPTIONS, SUITS, suitInfo } from '@/lib/horse-race';
import type { Bet, RaceState, Suit } from '@/lib/horse-race';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';

function readCookie(name: string): string | null {
    const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));

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
function bettingState(bets: Bet[], trackLength: number = DEFAULT_STEPS): RaceState {
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
        <>
            <Head title="Paardenrace" />
            <div className="relative flex min-h-[100dvh] flex-col overflow-hidden bg-slate-950 text-slate-100">
                <div className="pointer-events-none absolute -top-32 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-emerald-600/25 blur-3xl" />
                <div className="pointer-events-none absolute -right-24 -bottom-40 h-80 w-80 rounded-full bg-amber-500/20 blur-3xl" />
                <main className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
                    <div className="mb-2">
                        <Link
                            href={dashboard()}
                            className="inline-flex items-center gap-1 text-sm text-slate-400 transition hover:text-slate-200"
                        >
                            <ArrowLeft className="size-4" /> Dashboard
                        </Link>
                    </div>

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
                </main>
            </div>
        </>
    );
}

interface OpenRace {
    code: string;
    phase: string;
    players: number;
}

function ChooseScreen({ onBoard, onDealer }: { onBoard: (code: string) => void; onDealer: (code: string) => void }) {
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
                const response = await fetch(list().url, { headers: { Accept: 'application/json' } });
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
                <button onClick={() => setView('pick')} className="mb-4 inline-flex items-center gap-1 self-start text-sm text-slate-400 hover:text-slate-200">
                    <ArrowLeft className="size-4" /> Terug
                </button>
                <header className="mb-5 text-center">
                    <h1 className="text-2xl font-black">Kies een race</h1>
                    <p className="mt-1 text-sm text-slate-400">Tik op de race die de dealer net startte.</p>
                </header>

                {races.length === 0 ? (
                    <div className="mt-10 text-center text-slate-400">
                        <div className="mb-3 animate-pulse text-5xl">🐎</div>
                        Wachten tot de dealer een race start…
                    </div>
                ) : (
                    <ul className="space-y-2">
                        {races.map((race) => (
                            <li key={race.code}>
                                <button
                                    onClick={() => onBoard(race.code)}
                                    className="flex w-full items-center justify-between rounded-2xl border border-slate-700 bg-slate-900/60 p-4 transition hover:border-emerald-400/60 active:scale-[0.99]"
                                >
                                    <span className="text-xl font-black tracking-[0.3em] text-amber-300">{race.code}</span>
                                    <span className="text-sm text-slate-400">
                                        {race.players} {race.players === 1 ? 'inzet' : 'inzetten'}
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
            <header className="mb-6 text-center">
                <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-amber-400/15 px-3 py-1 text-xs font-bold tracking-widest text-amber-300 uppercase ring-1 ring-amber-400/30">
                    🐎 Paardenrace
                </span>
                <h1 className="text-3xl font-black">Twee telefoons</h1>
                <p className="mt-1 text-sm text-slate-400">De dealer start de race, het bord doet mee.</p>
            </header>

            <button
                onClick={startRace}
                disabled={busy}
                className="mb-3 flex flex-col items-start gap-1 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-5 text-left transition hover:border-emerald-400/60 active:scale-[0.99] disabled:opacity-50"
            >
                <span className="text-2xl">🃏</span>
                <span className="text-lg font-bold">Ik ben de dealer</span>
                <span className="text-sm text-slate-400">Start de race, plaats de weddenschappen en draai de kaarten.</span>
            </button>

            <button
                onClick={() => setView('join')}
                className="flex flex-col items-start gap-1 rounded-2xl border border-slate-700 bg-slate-900/60 p-5 text-left transition hover:border-emerald-400/60 active:scale-[0.99]"
            >
                <span className="text-2xl">📺</span>
                <span className="text-lg font-bold">Ik ben het bord</span>
                <span className="text-sm text-slate-400">Toon de baan. Kies de race die de dealer startte.</span>
            </button>

            {error && <p className="mt-4 text-center text-sm text-red-400">{error}</p>}
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
                const response = await fetch(show(code).url, { headers: { Accept: 'application/json' } });

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
        return <p className="mt-10 text-center text-slate-400">Deze race bestaat niet meer.</p>;
    }

    return (
        <div className="flex flex-1 flex-col">
            <div className="mb-4 flex items-center justify-between">
                <span className="text-sm text-slate-400">Race</span>
                <span className="rounded-lg bg-slate-800 px-3 py-1 text-xl font-black tracking-[0.3em] text-amber-300">{code}</span>
            </div>

            {(!state || state.phase === 'lobby' || state.phase === 'betting') && (
                <div className="mt-10 text-center text-slate-400">
                    <div className="mb-3 animate-pulse text-5xl">🐎</div>
                    Wachten op de dealer…
                    {state && state.bets && state.bets.length > 0 && (
                        <ul className="mx-auto mt-6 max-w-xs space-y-1 text-left text-sm">
                            {state.bets.map((bet) => (
                                <li key={bet.id} className="flex items-center justify-between rounded-lg bg-slate-900/60 px-3 py-1.5">
                                    <span>{bet.player}</span>
                                    <span className={cn('font-bold', suitInfo(bet.suit).color)}>
                                        {suitInfo(bet.suit).symbol} · {bet.sips} 🍺
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}

            {state && (state.phase === 'racing' || state.phase === 'finished') && <Track state={state} />}
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
                        className="mb-2 rounded-xl bg-amber-400/15 px-4 py-2 text-center text-sm font-semibold text-amber-200 ring-1 ring-amber-400/30"
                    >
                        {state.lastEvent}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className={cn('flex flex-1 gap-2', horizontal ? 'flex-row' : 'flex-col')}>
                <div className={cn(horizontal ? 'flex flex-col justify-around' : 'grid grid-cols-4 gap-2')}>
                    {SUITS.map((suit) => {
                        const isWinner = state.winner === suit.key;

                        return (
                            <div
                                key={suit.key}
                                className={cn(
                                    'flex items-center justify-center gap-1 rounded-xl border px-2 py-1.5',
                                    horizontal && 'flex-1',
                                    isWinner ? 'border-amber-400 bg-amber-400/10' : 'border-slate-800 bg-slate-900/50',
                                )}
                            >
                                <span className={cn('text-xl leading-none', suit.color)}>{suit.symbol}</span>
                                {isWinner && <Trophy className="size-4 text-amber-400" />}
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
                    className="mt-4 rounded-2xl bg-amber-400/15 p-5 text-center ring-1 ring-amber-400/30"
                >
                    <div className="mb-1 text-4xl">🏆</div>
                    <div className={cn('text-xl font-black', suitInfo(state.winner).color)}>
                        {suitInfo(state.winner).symbol} {suitInfo(state.winner).label} wint!
                    </div>
                    <ul className="mt-4 space-y-1.5 text-left text-sm">
                        {outcomes(state).map((o) => (
                            <li key={o.bet.id} className="flex items-center justify-between rounded-lg bg-slate-900/60 px-3 py-1.5">
                                <span>{o.bet.player}</span>
                                <span className={cn('font-bold', o.won ? 'text-emerald-400' : 'text-red-400')}>
                                    {o.won ? `deelt ${o.sips} uit` : `drinkt ${o.sips}`} 🍺
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
function TrackField({ state, horizontal }: { state: RaceState; horizontal: boolean }) {
    const { trackLength } = state;
    const containerRef = useRef<HTMLDivElement>(null);
    const [size, setSize] = useState(0);

    useLayoutEffect(() => {
        const el = containerRef.current;

        if (!el) {
            return;
        }

        const measure = () => setSize(horizontal ? el.clientWidth : el.clientHeight);
        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(el);

        return () => observer.disconnect();
    }, [horizontal]);

    const contentMain = (trackLength + 1) * ROW_HEIGHT;
    const leadPos = Math.max(...SUITS.map((s) => state.positions[s.key]));
    // Distance of the leader along the travel axis from the origin (finish-side
    // for vertical, start-side for horizontal), then keep it ~62% into view.
    const leaderCoord = (horizontal ? leadPos : trackLength - leadPos) * ROW_HEIGHT + ROW_HEIGHT / 2;
    const minOffset = Math.min(0, size - contentMain);
    const offset = size === 0 ? 0 : Math.max(minOffset, Math.min(0, size * 0.62 - leaderCoord));

    /** Position of one horse along the travel axis. */
    const horsePos = (pos: number): number => (horizontal ? pos : trackLength - pos) * ROW_HEIGHT;

    return (
        <div ref={containerRef} className="relative flex-1 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40">
            <motion.div
                className="absolute"
                style={horizontal ? { top: 0, bottom: 0, left: 0, width: contentMain } : { left: 0, right: 0, top: 0, height: contentMain }}
                animate={horizontal ? { x: offset } : { y: offset }}
                transition={{ type: 'spring', stiffness: 120, damping: 24 }}
            >
                {[1, 2, 3].map((n) => (
                    <div
                        key={n}
                        className="absolute bg-slate-800/40"
                        style={horizontal ? { left: 0, right: 0, top: `${n * 25}%`, height: 1 } : { top: 0, bottom: 0, left: `${n * 25}%`, width: 1 }}
                    />
                ))}

                {Array.from({ length: trackLength + 1 }, (_, idx) => {
                    const step = horizontal ? idx : trackLength - idx;
                    const backfire = state.backfires.find((b) => b.row === step);
                    const isFinish = step === trackLength;

                    return (
                        <div
                            key={step}
                            className={cn(
                                'absolute flex items-center justify-center',
                                horizontal ? 'top-0 bottom-0 border-r border-slate-800/50' : 'right-0 left-0 border-b border-slate-800/50',
                                isFinish && 'bg-amber-400/5',
                                backfire?.revealed && 'bg-amber-400/10',
                            )}
                            style={horizontal ? { left: idx * ROW_HEIGHT, width: ROW_HEIGHT } : { top: idx * ROW_HEIGHT, height: ROW_HEIGHT }}
                        >
                            {isFinish ? (
                                <span className="flex items-center gap-1 text-xs font-bold tracking-widest text-slate-500">
                                    <Flag className="size-4" />
                                    {!horizontal && 'FINISH'}
                                </span>
                            ) : backfire ? (
                                <span className={cn('text-2xl', backfire.revealed ? suitInfo(backfire.suit).color : 'text-slate-600')}>
                                    {backfire.revealed ? suitInfo(backfire.suit).symbol : '🂠'}
                                </span>
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
                                ? { top: `${i * 25}%`, height: '25%', left: 0, width: ROW_HEIGHT }
                                : { left: `${i * 25}%`, width: '25%', top: 0, height: ROW_HEIGHT }
                        }
                        animate={horizontal ? { x: horsePos(state.positions[suit.key]) } : { y: horsePos(state.positions[suit.key]) }}
                        transition={{ type: 'spring', stiffness: 260, damping: 26 }}
                    >
                        <motion.span
                            className="text-3xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
                            animate={state.winner === suit.key ? { scale: [1, 1.3, 1] } : { scale: 1 }}
                            transition={{ repeat: state.winner === suit.key ? Infinity : 0, duration: 0.8 }}
                        >
                            🐎
                        </motion.span>
                    </motion.div>
                ))}
            </motion.div>
        </div>
    );
}

function DealerScreen({ code }: { code: string }) {
    const [state, setState] = useState<RaceState>(() => bettingState([]));
    const nextBetId = useRef(1);

    // Keep the board in sync with every change the dealer makes.
    const sync = useCallback((next: RaceState) => {
        setState(next);
        void pushState(code, next);
    }, [code]);

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

    const removeBet = (id: number) => sync({ ...state, bets: state.bets.filter((b) => b.id !== id) });

    if (state.phase === 'betting') {
        return (
            <div className="flex flex-1 flex-col">
                <header className="mb-5">
                    <h1 className="text-2xl font-black">Weddenschappen</h1>
                    <p className="text-sm text-slate-400">Code <span className="font-bold text-amber-300">{code}</span> · iedereen kiest een paard en zet slokken in.</p>
                </header>

                <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
                    <input
                        value={player}
                        onChange={(e) => setPlayer(e.target.value)}
                        placeholder="Naam"
                        className="mb-3 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 placeholder:text-slate-600 focus:border-amber-400 focus:outline-none"
                    />
                    <div className="mb-3 grid grid-cols-4 gap-2">
                        {SUITS.map((s) => (
                            <button
                                key={s.key}
                                onClick={() => setSuit(s.key)}
                                className={cn(
                                    'flex flex-col items-center gap-0.5 rounded-xl border py-2 transition',
                                    suit === s.key ? 'border-amber-400 bg-amber-400/10' : 'border-slate-700 bg-slate-950',
                                )}
                            >
                                <span className={cn('text-2xl leading-none', s.color)}>{s.symbol}</span>
                                <span className="text-[10px] text-slate-400">{s.label}</span>
                            </button>
                        ))}
                    </div>
                    <div className="mb-3 flex items-center justify-center gap-4">
                        <Button variant="outline" size="icon" onClick={() => setSips((n) => Math.max(1, n - 1))} className="border-slate-700 bg-slate-950">
                            <Minus className="size-4" />
                        </Button>
                        <span className="flex items-center gap-1 text-lg font-bold">{sips} <Beer className="size-4 text-amber-400" /></span>
                        <Button variant="outline" size="icon" onClick={() => setSips((n) => n + 1)} className="border-slate-700 bg-slate-950">
                            <Plus className="size-4" />
                        </Button>
                    </div>
                    <Button onClick={addBet} className="w-full bg-amber-400 text-slate-950 hover:bg-amber-300">
                        <Plus className="size-4" /> Inzet toevoegen
                    </Button>
                </div>

                {state.bets.length > 0 && (
                    <ul className="mt-4 space-y-2">
                        {state.bets.map((bet) => (
                            <li key={bet.id} className="flex items-center justify-between rounded-xl bg-slate-900/60 px-4 py-2">
                                <span className="font-semibold">{bet.player}</span>
                                <span className="flex items-center gap-3">
                                    <span className={cn('font-bold', suitInfo(bet.suit).color)}>{suitInfo(bet.suit).symbol} · {bet.sips} 🍺</span>
                                    <button onClick={() => removeBet(bet.id)} className="text-slate-500 hover:text-red-400">
                                        <X className="size-4" />
                                    </button>
                                </span>
                            </li>
                        ))}
                    </ul>
                )}

                <div className="mt-6">
                    <p className="mb-2 text-sm font-semibold text-slate-300">Aantal stappen</p>
                    <div className="grid grid-cols-5 gap-2">
                        {STEP_OPTIONS.map((option) => (
                            <button
                                key={option}
                                onClick={() => setSteps(option)}
                                className={cn(
                                    'rounded-xl border py-2 text-sm font-bold transition',
                                    steps === option ? 'border-amber-400 bg-amber-400/10 text-amber-300' : 'border-slate-700 bg-slate-950 text-slate-300',
                                )}
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mt-auto pt-6">
                    <Button
                        onClick={() => sync(startRace(state.bets, steps))}
                        disabled={state.bets.length === 0}
                        className="h-14 w-full bg-emerald-500 text-base font-bold text-slate-950 hover:bg-emerald-400 disabled:opacity-40"
                    >
                        Start de race 🏇
                    </Button>
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
                <h1 className="text-2xl font-black">Dealer</h1>
                <p className="text-sm text-slate-400">{canFlip ? 'Tik op de kaart om te draaien.' : 'De race is gereden.'}</p>
            </header>

            <div className="flex flex-1 flex-col items-center justify-center">
                <div className="relative h-80 w-56" style={{ perspective: 1200 }}>
                    <AnimatePresence initial={false}>
                        <motion.div
                            key={state.drawn ? state.deck.length : 'cover'}
                            onClick={canFlip ? () => sync(flip(state)) : undefined}
                            initial={{ rotateY: -180, opacity: 0 }}
                            animate={{ rotateY: 0, opacity: 1 }}
                            exit={{ rotateY: 180, opacity: 0 }}
                            transition={{ duration: 0.7, ease: 'easeInOut' }}
                            style={{ transformStyle: 'preserve-3d', backfaceVisibility: 'hidden' }}
                            className={cn(
                                'absolute inset-0 flex flex-col items-center justify-center rounded-3xl shadow-2xl select-none',
                                drawnSuit ? 'bg-white' : 'bg-gradient-to-br from-emerald-500 to-emerald-700 ring-4 ring-emerald-300/20 ring-inset',
                                canFlip && 'cursor-pointer',
                            )}
                        >
                            {drawnSuit ? (
                                <>
                                    <span className={cn('absolute top-3 left-4 text-2xl font-bold', drawnSuit.color)}>{drawnSuit.symbol}</span>
                                    <span className={cn('text-[7rem] leading-none', drawnSuit.color)}>{drawnSuit.symbol}</span>
                                    <span className={cn('absolute right-4 bottom-3 rotate-180 text-2xl font-bold', drawnSuit.color)}>{drawnSuit.symbol}</span>
                                </>
                            ) : (
                                <>
                                    <span className="text-7xl">🐎</span>
                                    <span className="mt-3 text-sm font-semibold text-emerald-50/90">Tik om te draaien</span>
                                </>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>

                <div className="mt-4 h-6">
                    {state.lastEvent && <p className="text-center text-sm font-semibold text-amber-300">{state.lastEvent}</p>}
                </div>

                <div className="grid w-full grid-cols-4 gap-2">
                    {SUITS.map((s) => (
                        <div key={s.key} className="flex flex-col items-center rounded-xl bg-slate-900/60 py-2">
                            <span className={cn('text-lg', s.color)}>{s.symbol}</span>
                            <span className="text-xs font-bold text-slate-300">
                                {state.positions[s.key]}/{state.trackLength}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {state.phase === 'finished' && (
                <div className="mt-auto pt-4">
                    <Button onClick={() => sync(bettingState([]))} className="h-14 w-full bg-amber-400 text-base font-bold text-slate-950 hover:bg-amber-300">
                        <RotateCcw className="size-4" /> Nieuw potje
                    </Button>
                </div>
            )}
        </div>
    );
}
