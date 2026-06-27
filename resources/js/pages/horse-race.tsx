import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Beer, Flag, Minus, Plus, RotateCcw, Trophy, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { list, show, store, update } from '@/actions/App/Http/Controllers/RaceController';
import { Button } from '@/components/ui/button';
import { flip, outcomes, startRace, SUITS, suitInfo, TRACK_LENGTH } from '@/lib/horse-race';
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
function bettingState(bets: Bet[]): RaceState {
    return {
        phase: 'betting',
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
                    {state && state.bets.length > 0 && (
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

/** The shared race track: four lanes with the horses and revealed backfires. */
function Track({ state }: { state: RaceState }) {
    return (
        <div className="flex flex-1 flex-col">
            {state.lastEvent && (
                <div className="mb-3 rounded-xl bg-amber-400/15 px-4 py-2 text-center text-sm font-semibold text-amber-200 ring-1 ring-amber-400/30">
                    {state.lastEvent}
                </div>
            )}

            <div className="space-y-3">
                {SUITS.map((suit) => {
                    const pos = state.positions[suit.key];
                    const isWinner = state.winner === suit.key;

                    return (
                        <div key={suit.key} className={cn('rounded-2xl border p-2', isWinner ? 'border-amber-400 bg-amber-400/10' : 'border-slate-800 bg-slate-900/50')}>
                            <div className="mb-1 flex items-center gap-2 px-1">
                                <span className={cn('text-2xl leading-none', suit.color)}>{suit.symbol}</span>
                                <span className="text-sm font-semibold text-slate-300">{suit.label}</span>
                                {isWinner && <Trophy className="ml-auto size-4 text-amber-400" />}
                            </div>
                            <div className="grid grid-cols-[repeat(8,1fr)] gap-1">
                                {Array.from({ length: TRACK_LENGTH + 1 }, (_, step) => {
                                    const backfire = state.backfires.find((b) => b.row === step);

                                    return (
                                        <div
                                            key={step}
                                            className={cn(
                                                'flex aspect-square items-center justify-center rounded-md text-lg',
                                                step === TRACK_LENGTH ? 'bg-slate-700/40' : 'bg-slate-800/40',
                                            )}
                                        >
                                            {pos === step ? (
                                                <span className="text-xl">🐎</span>
                                            ) : step === TRACK_LENGTH ? (
                                                <Flag className="size-4 text-slate-500" />
                                            ) : backfire ? (
                                                <span className={cn(backfire.revealed ? suitInfo(backfire.suit).color : 'text-slate-600')}>
                                                    {backfire.revealed ? suitInfo(backfire.suit).symbol : '🂠'}
                                                </span>
                                            ) : null}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>

            {state.phase === 'finished' && state.winner && (
                <div className="mt-5 rounded-2xl bg-amber-400/15 p-5 text-center ring-1 ring-amber-400/30">
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
                </div>
            )}
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

                <div className="mt-auto pt-6">
                    <Button
                        onClick={() => sync(startRace(state.bets))}
                        disabled={state.bets.length === 0}
                        className="h-14 w-full bg-emerald-500 text-base font-bold text-slate-950 hover:bg-emerald-400 disabled:opacity-40"
                    >
                        Start de race 🏇
                    </Button>
                </div>
            </div>
        );
    }

    // Racing / finished: the dealer just flips cards.
    return (
        <div className="flex flex-1 flex-col">
            <header className="mb-5 text-center">
                <h1 className="text-2xl font-black">Dealer</h1>
                <p className="text-sm text-slate-400">Kijk naar het bord — draai de volgende kaart.</p>
            </header>

            {state.drawn && (
                <div className="mb-5 flex flex-col items-center">
                    <div className="flex h-28 w-20 items-center justify-center rounded-2xl bg-white shadow-lg">
                        <span className={cn('text-5xl', suitInfo(state.drawn).color)}>{suitInfo(state.drawn).symbol}</span>
                    </div>
                    {state.lastEvent && <p className="mt-3 text-center text-sm font-semibold text-amber-300">{state.lastEvent}</p>}
                </div>
            )}

            <div className="grid grid-cols-2 gap-2">
                {SUITS.map((s) => (
                    <div key={s.key} className="flex items-center justify-between rounded-xl bg-slate-900/60 px-4 py-2">
                        <span className={cn('text-xl', s.color)}>{s.symbol}</span>
                        <span className="text-sm font-bold text-slate-300">{state.positions[s.key]}/{TRACK_LENGTH}</span>
                    </div>
                ))}
            </div>

            <div className="mt-auto pt-6">
                {state.phase === 'racing' ? (
                    <Button onClick={() => sync(flip(state))} className="h-16 w-full bg-emerald-500 text-lg font-black text-slate-950 hover:bg-emerald-400">
                        Draai kaart
                    </Button>
                ) : (
                    <Button onClick={() => sync(bettingState([]))} className="h-14 w-full bg-amber-400 text-base font-bold text-slate-950 hover:bg-amber-300">
                        <RotateCcw className="size-4" /> Nieuw potje
                    </Button>
                )}
            </div>
        </div>
    );
}
