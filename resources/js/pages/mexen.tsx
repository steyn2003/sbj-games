import { Head, Link } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    ArrowLeft,
    Beer,
    ChevronRight,
    Dice5,
    Eye,
    Minus,
    Plus,
    RotateCcw,
    ShieldQuestion,
    Users,
    VenetianMask,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    callForRoll,
    callsAbove,
    judgeRound,
    MAX_PLAYERS,
    MAX_THROWS,
    MIN_PLAYERS,
    rollDice,
} from '@/lib/mexen';
import type { Call, DiePair } from '@/lib/mexen';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';

type Variant = 'menu' | 'normaal' | 'bluf';

export default function Mexen() {
    const [variant, setVariant] = useState<Variant>('menu');

    return (
        <>
            <Head title="Mexen" />
            <div className="relative flex min-h-[100dvh] flex-col overflow-hidden bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
                <div className="pointer-events-none absolute -top-32 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-rose-300/40 blur-3xl dark:bg-rose-600/25" />
                <div className="pointer-events-none absolute -right-24 -bottom-40 h-80 w-80 rounded-full bg-amber-300/40 blur-3xl dark:bg-amber-500/20" />
                <main className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
                    <div className="mb-2">
                        {variant === 'menu' ? (
                            <Link
                                href={dashboard()}
                                className="inline-flex items-center gap-1 text-sm text-slate-500 transition hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                            >
                                <ArrowLeft className="size-4" /> Dashboard
                            </Link>
                        ) : (
                            <button
                                type="button"
                                onClick={() => setVariant('menu')}
                                className="inline-flex items-center gap-1 text-sm text-slate-500 transition hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                            >
                                <ArrowLeft className="size-4" /> Kies variant
                            </button>
                        )}
                    </div>

                    {variant === 'menu' && <VariantMenu onPick={setVariant} />}
                    {variant === 'normaal' && <NormaalMexen />}
                    {variant === 'bluf' && <BlufMexen />}
                </main>
            </div>
        </>
    );
}

/** Landing screen: pick the open (normaal) or secret (bluf) variant. */
function VariantMenu({ onPick }: { onPick: (variant: Variant) => void }) {
    return (
        <div className="flex flex-1 flex-col">
            <header className="mb-8 text-center">
                <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-rose-400/15 px-3 py-1 text-xs font-bold tracking-widest text-rose-600 uppercase ring-1 ring-rose-400/30 dark:text-rose-300">
                    🎲 Mexen
                </span>
                <h1 className="bg-gradient-to-br from-slate-900 via-rose-700 to-amber-500 bg-clip-text text-5xl font-black tracking-tight text-transparent dark:from-white dark:via-rose-100 dark:to-amber-300">
                    Mexen
                </h1>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    Twee dobbelstenen, twee manieren om te verliezen. Kies je
                    variant.
                </p>
            </header>

            <div className="space-y-3">
                <VariantCard
                    title="Normaal Mexen"
                    description="Iedereen rolt open, tot drie keer. De laagste worp van de ronde drinkt — elke Mex verdubbelt de slokken."
                    icon={Dice5}
                    chipClassName="bg-amber-400/15 text-amber-700 ring-amber-400/30 dark:text-amber-200"
                    onClick={() => onPick('normaal')}
                />
                <VariantCard
                    title="Bluf Mexen"
                    description="Rol stiekem en noem iets hogers dan de vorige — of lieg erop los. Wie betrapt wordt, drinkt!"
                    icon={VenetianMask}
                    chipClassName="bg-rose-400/15 text-rose-700 ring-rose-400/30 dark:text-rose-200"
                    onClick={() => onPick('bluf')}
                />
            </div>
        </div>
    );
}

function VariantCard({
    title,
    description,
    icon: Icon,
    chipClassName,
    onClick,
}: {
    title: string;
    description: string;
    icon: typeof Dice5;
    chipClassName: string;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="flex w-full items-center gap-4 rounded-2xl bg-white p-4 text-left shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50 hover:ring-rose-400/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/70 active:scale-[0.99] dark:bg-white/5 dark:shadow-none dark:ring-white/10 dark:hover:bg-white/[0.07]"
        >
            <span
                aria-hidden
                className={cn(
                    'flex size-12 shrink-0 items-center justify-center rounded-xl ring-1',
                    chipClassName,
                )}
            >
                <Icon className="size-6" />
            </span>
            <span className="flex-1">
                <span className="block text-base font-bold text-slate-900 dark:text-white">
                    {title}
                </span>
                <span className="block text-sm text-slate-500 dark:text-slate-400">
                    {description}
                </span>
            </span>
            <ChevronRight
                className="size-5 shrink-0 text-slate-400 dark:text-slate-500"
                aria-hidden
            />
        </button>
    );
}

function Rule({ n, text }: { n: string; text: string }) {
    return (
        <div className="flex gap-3">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-rose-400/15 text-xs font-black text-rose-600 dark:text-rose-300">
                {n}
            </span>
            <p className="text-slate-600 dark:text-slate-300">{text}</p>
        </div>
    );
}

/* -------------------------------------------------------------------------
 * Normaal Mexen — everyone rolls openly, the lowest call of the round drinks.
 * ---------------------------------------------------------------------- */

type NormaalPhase = 'setup' | 'turn' | 'result';

function NormaalMexen() {
    const [phase, setPhase] = useState<NormaalPhase>('setup');
    const [playerCount, setPlayerCount] = useState(4);
    // The loser opens the next round, so turn order rotates around this index.
    const [startIndex, setStartIndex] = useState(0);
    const [turn, setTurn] = useState(0);
    const [throwLimit, setThrowLimit] = useState(MAX_THROWS);
    const [results, setResults] = useState<(Call | null)[]>([]);

    const currentPlayer = (startIndex + turn) % playerCount;

    const beginRound = (firstPlayer: number) => {
        setStartIndex(firstPlayer);
        setResults(new Array(playerCount).fill(null));
        setTurn(0);
        setThrowLimit(MAX_THROWS);
        setPhase('turn');
    };

    // A player keeps their roll; the opener's throw count caps the rest.
    const stand = (call: Call, throwsUsed: number) => {
        setResults((current) =>
            current.map((result, index) =>
                index === currentPlayer ? call : result,
            ),
        );

        if (turn === 0) {
            setThrowLimit(throwsUsed);
        }

        if (turn + 1 >= playerCount) {
            setPhase('result');
        } else {
            setTurn(turn + 1);
        }
    };

    // Calls in throw order, so the turn and result screens read naturally.
    const rolledSoFar = Array.from({ length: turn }, (_, i) => {
        const player = (startIndex + i) % playerCount;

        return { player, call: results[player] as Call };
    });

    return (
        <>
            {phase === 'setup' && (
                <NormaalSetupScreen
                    playerCount={playerCount}
                    setPlayerCount={setPlayerCount}
                    onStart={() => beginRound(0)}
                />
            )}
            {phase === 'turn' && (
                <NormaalTurnScreen
                    key={`${startIndex}-${turn}`}
                    player={currentPlayer}
                    isFirst={turn === 0}
                    isLast={turn + 1 >= playerCount}
                    throwLimit={throwLimit}
                    rolledSoFar={rolledSoFar}
                    onStand={stand}
                />
            )}
            {phase === 'result' && (
                <NormaalResultScreen
                    startIndex={startIndex}
                    calls={results as Call[]}
                    onNext={beginRound}
                />
            )}
        </>
    );
}

function NormaalSetupScreen({
    playerCount,
    setPlayerCount,
    onStart,
}: {
    playerCount: number;
    setPlayerCount: (count: number) => void;
    onStart: () => void;
}) {
    return (
        <div className="flex flex-1 flex-col">
            <header className="mb-6 text-center">
                <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-amber-400/15 px-3 py-1 text-xs font-bold tracking-widest text-amber-600 uppercase ring-1 ring-amber-400/30 dark:text-amber-300">
                    🎲 Normaal Mexen
                </span>
                <h1 className="bg-gradient-to-br from-slate-900 via-amber-700 to-rose-500 bg-clip-text text-5xl font-black tracking-tight text-transparent dark:from-white dark:via-amber-100 dark:to-rose-300">
                    Normaal Mexen
                </h1>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    Iedereen rolt open. Wie de laagste worp op tafel legt,
                    drinkt!
                </p>
            </header>

            <section className="mb-5 space-y-3 rounded-2xl bg-white p-4 text-sm shadow-sm ring-1 ring-slate-200 dark:bg-white/5 dark:shadow-none dark:ring-white/10">
                <Rule
                    n="1"
                    text="De hoogste steen telt als tientallen: 5 en 3 wordt 53. Dubbels verslaan alles, en 2-1 is de Mex — de allerhoogste."
                />
                <Rule
                    n="2"
                    text="De eerste speler mag tot 3 keer rollen. Zo vaak als die rolt, zo vaak mag de rest ook."
                />
                <Rule
                    n="3"
                    text="Elke nieuwe worp vervangt je vorige — blijven staan mag altijd."
                />
                <Rule
                    n="4"
                    text="De laagste worp van de ronde drinkt. Elke Mex op tafel verdubbelt de slokken!"
                />
            </section>

            <section className="mb-5 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-white/5 dark:shadow-none dark:ring-white/10">
                <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm font-medium">
                        <Users className="size-4" /> Spelers
                    </span>
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setPlayerCount(playerCount - 1)}
                            disabled={playerCount <= MIN_PLAYERS}
                            className="flex size-9 items-center justify-center rounded-full bg-slate-100 text-slate-900 transition hover:bg-slate-200 focus-visible:ring-2 focus-visible:ring-rose-400/60 focus-visible:outline-none disabled:opacity-30 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
                        >
                            <Minus className="size-4" />
                        </button>
                        <span className="w-6 text-center text-lg font-bold tabular-nums">
                            {playerCount}
                        </span>
                        <button
                            type="button"
                            onClick={() => setPlayerCount(playerCount + 1)}
                            disabled={playerCount >= MAX_PLAYERS}
                            className="flex size-9 items-center justify-center rounded-full bg-slate-100 text-slate-900 transition hover:bg-slate-200 focus-visible:ring-2 focus-visible:ring-rose-400/60 focus-visible:outline-none disabled:opacity-30 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
                        >
                            <Plus className="size-4" />
                        </button>
                    </div>
                </div>
            </section>

            <div className="mt-auto pt-2">
                <Button
                    onClick={onStart}
                    className="h-14 w-full rounded-2xl bg-gradient-to-r from-amber-500 to-rose-500 text-lg font-bold text-white shadow-lg shadow-amber-900/40 transition hover:from-amber-400 hover:to-rose-400 active:scale-[0.99]"
                >
                    Start het spel
                </Button>
            </div>
        </div>
    );
}

/** One player's open turn: roll, optionally re-roll, then stand. */
function NormaalTurnScreen({
    player,
    isFirst,
    isLast,
    throwLimit,
    rolledSoFar,
    onStand,
}: {
    player: number;
    isFirst: boolean;
    isLast: boolean;
    throwLimit: number;
    rolledSoFar: { player: number; call: Call }[];
    onStand: (call: Call, throwsUsed: number) => void;
}) {
    const [roll, setRoll] = useState<DiePair | null>(null);
    const [throwsUsed, setThrowsUsed] = useState(0);
    const [rolling, setRolling] = useState(false);

    const throwDice = () => {
        setRoll(rollDice());
        setThrowsUsed(throwsUsed + 1);
        setRolling(true);
    };

    if (!roll) {
        return (
            <div className="flex flex-1 flex-col">
                <div className="flex flex-1 flex-col items-center justify-center text-center">
                    <span className="text-5xl">🎲</span>
                    <h1 className="mt-4 text-2xl font-black">
                        Speler {player + 1}, jouw beurt
                    </h1>
                    <p className="mt-2 max-w-xs text-sm text-slate-500 dark:text-slate-400">
                        Rol open, iedereen mag meekijken.
                        {isFirst
                            ? ` Jij opent de ronde: je mag tot ${MAX_THROWS} keer rollen en bepaalt zo het aantal worpen voor de rest.`
                            : ` Je mag ${throwLimit === 1 ? 'één keer' : `tot ${throwLimit} keer`} rollen.`}
                    </p>

                    <Button
                        onClick={throwDice}
                        className="mt-8 h-14 w-full max-w-xs rounded-2xl bg-gradient-to-r from-amber-500 to-rose-500 text-lg font-bold text-white shadow-lg shadow-amber-900/40 transition hover:from-amber-400 hover:to-rose-400 active:scale-[0.99]"
                    >
                        🎲 Rollen
                    </Button>
                </div>

                <RolledSoFar rolledSoFar={rolledSoFar} />
            </div>
        );
    }

    const call = callForRoll(roll);
    const mayRethrow = !call.isMax && throwsUsed < throwLimit;

    return (
        <div className="flex flex-1 flex-col">
            <div className="flex flex-1 flex-col items-center justify-center text-center">
                <span className="text-xs font-semibold tracking-widest text-amber-600 uppercase dark:text-amber-300">
                    Speler {player + 1} · worp {throwsUsed} van {throwLimit}
                </span>
                <div className="mt-4">
                    <RollingDice
                        key={throwsUsed}
                        roll={roll}
                        onSettled={() => setRolling(false)}
                    />
                </div>
                <div className="flex min-h-24 flex-col items-center">
                    {rolling ? (
                        <p className="mt-4 text-sm text-slate-400 dark:text-slate-500">
                            De stenen rollen…
                        </p>
                    ) : call.isMax ? (
                        <>
                            <motion.p
                                initial={{ scale: 0.6, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{
                                    type: 'spring',
                                    stiffness: 220,
                                    damping: 16,
                                }}
                                className="mt-4 text-4xl font-black text-amber-500 dark:text-amber-300"
                            >
                                MEX! 🍻
                            </motion.p>
                            <p className="mt-2 max-w-xs text-sm text-slate-500 dark:text-slate-400">
                                De allerhoogste worp — de slokken verdubbelen!
                            </p>
                        </>
                    ) : (
                        <motion.p
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-4 text-sm text-slate-500 dark:text-slate-400"
                        >
                            Dat is{' '}
                            <span className="text-2xl font-black text-slate-900 dark:text-white">
                                {call.label}
                            </span>
                        </motion.p>
                    )}
                </div>
            </div>

            <RolledSoFar rolledSoFar={rolledSoFar} />

            <div className="mt-auto space-y-3 pt-4">
                {mayRethrow && (
                    <Button
                        onClick={throwDice}
                        disabled={rolling}
                        className="h-14 w-full rounded-2xl bg-white text-lg font-bold text-slate-900 ring-1 ring-slate-200 transition hover:bg-slate-100 active:scale-[0.99] dark:bg-white/10 dark:text-white dark:ring-white/10 dark:hover:bg-white/20"
                    >
                        🎲 Nog een keer rollen
                    </Button>
                )}
                <Button
                    onClick={() => onStand(call, throwsUsed)}
                    disabled={rolling}
                    className="h-14 w-full rounded-2xl bg-gradient-to-r from-amber-500 to-rose-500 text-lg font-bold text-white transition hover:from-amber-400 hover:to-rose-400 active:scale-[0.99]"
                >
                    {isLast
                        ? 'Blijven staan → uitslag'
                        : 'Blijven staan → geef door'}
                </Button>
            </div>
        </div>
    );
}

/** Compact strip of the open rolls earlier in the round. */
function RolledSoFar({
    rolledSoFar,
}: {
    rolledSoFar: { player: number; call: Call }[];
}) {
    if (rolledSoFar.length === 0) {
        return null;
    }

    return (
        <div className="mt-4">
            <p className="mb-2 text-center text-[10px] font-semibold tracking-widest text-slate-400 uppercase">
                Deze ronde
            </p>
            <div className="flex flex-wrap justify-center gap-2">
                {rolledSoFar.map(({ player, call }) => (
                    <span
                        key={player}
                        className={cn(
                            'rounded-full px-3 py-1 text-xs font-bold ring-1',
                            call.isMax
                                ? 'bg-amber-500/15 text-amber-700 ring-amber-400/40 dark:text-amber-300'
                                : 'bg-white text-slate-700 ring-slate-200 dark:bg-white/5 dark:text-slate-300 dark:ring-white/10',
                        )}
                    >
                        Speler {player + 1}: {call.label}
                    </span>
                ))}
            </div>
        </div>
    );
}

function NormaalResultScreen({
    startIndex,
    calls,
    onNext,
}: {
    startIndex: number;
    calls: Call[];
    onNext: (firstPlayer: number) => void;
}) {
    const { loserIndices, sips } = judgeRound(calls);
    const losers = new Set(loserIndices);
    const loserNames = loserIndices
        .map((index) => `Speler ${index + 1}`)
        .join(' & ');
    const inThrowOrder = Array.from({ length: calls.length }, (_, i) => {
        const player = (startIndex + i) % calls.length;

        return { player, call: calls[player] };
    });

    return (
        <div className="flex flex-1 flex-col">
            <div className="mb-6 flex flex-col items-center text-center">
                <motion.span
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 220, damping: 16 }}
                    className="text-6xl drop-shadow-lg"
                >
                    🍺
                </motion.span>
                <h1 className="mt-4 text-3xl font-black">{loserNames}!</h1>
                <AnimatePresence>
                    <motion.p
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 flex items-center gap-2 rounded-full bg-rose-500/15 px-5 py-2 text-lg font-bold text-rose-700 ring-1 ring-rose-400/30 dark:text-rose-200"
                    >
                        <Beer className="size-5" />
                        {loserIndices.length > 1
                            ? `Laagste worp — allebei ${sips} ${sips === 1 ? 'slok' : 'slokken'}!`
                            : `Laagste worp — ${sips} ${sips === 1 ? 'slok' : 'slokken'}!`}
                    </motion.p>
                </AnimatePresence>
                {sips > 1 && (
                    <p className="mt-2 text-sm text-amber-600 dark:text-amber-300">
                        Er lag een Mex op tafel — de slokken zijn verdubbeld!
                    </p>
                )}
            </div>

            <div className="space-y-2">
                {inThrowOrder.map(({ player, call }) => (
                    <div
                        key={player}
                        className={cn(
                            'flex items-center justify-between rounded-xl px-4 py-3 ring-1',
                            losers.has(player)
                                ? 'bg-rose-500/15 ring-rose-400/40'
                                : call.isMax
                                  ? 'bg-amber-500/15 ring-amber-400/40'
                                  : 'bg-white shadow-sm ring-slate-200 dark:bg-white/5 dark:shadow-none dark:ring-white/10',
                        )}
                    >
                        <span className="flex items-center gap-2 text-base font-medium text-slate-900 dark:text-white">
                            {losers.has(player) && (
                                <Beer className="size-4 text-rose-600 dark:text-rose-300" />
                            )}
                            Speler {player + 1}
                        </span>
                        <span
                            className={cn(
                                'text-lg font-black tabular-nums',
                                call.isMax
                                    ? 'text-amber-600 dark:text-amber-300'
                                    : 'text-slate-900 dark:text-white',
                            )}
                        >
                            {call.label}
                        </span>
                    </div>
                ))}
            </div>

            <div className="mt-auto pt-6">
                <Button
                    onClick={() => onNext(loserIndices[0])}
                    className="h-14 w-full rounded-2xl bg-gradient-to-r from-amber-500 to-rose-500 text-lg font-bold text-white transition hover:from-amber-400 hover:to-rose-400 active:scale-[0.99]"
                >
                    <RotateCcw className="size-5" /> Nieuwe ronde
                </Button>
                <p className="mt-2 text-center text-xs text-slate-400 dark:text-slate-500">
                    De verliezer opent de volgende ronde.
                </p>
            </div>
        </div>
    );
}

/* -------------------------------------------------------------------------
 * Bluf Mexen — roll in secret, claim higher than the previous player, or lie.
 * ---------------------------------------------------------------------- */

type BlufPhase = 'setup' | 'turn' | 'decide' | 'result';

/** Everything the phone secretly remembers between hand-offs. */
interface Round {
    /** The bid the next player must beat, or null at the start of a round. */
    previousCall: Call | null;
    /** The last roller's real dice — kept hidden until a challenge. */
    secretRoll: DiePair;
    /** The call that roll actually represents. */
    secretCall: Call;
    /** What the last roller claimed. */
    announced: Call;
}

interface ChallengeOutcome {
    announced: Call;
    secretRoll: DiePair;
    secretCall: Call;
    /** True when the claim held up (real roll ≥ claim). */
    honest: boolean;
}

function BlufMexen() {
    const [phase, setPhase] = useState<BlufPhase>('setup');
    const [previousCall, setPreviousCall] = useState<Call | null>(null);
    const [round, setRound] = useState<Round | null>(null);
    const [outcome, setOutcome] = useState<ChallengeOutcome | null>(null);

    const startGame = () => {
        setPreviousCall(null);
        setPhase('turn');
    };

    // The roller locks in a claim; the phone keeps the real roll for later.
    const announce = (roll: DiePair, call: Call) => {
        setRound({
            previousCall,
            secretRoll: roll,
            secretCall: callForRoll(roll),
            announced: call,
        });
        setPreviousCall(call);
        setPhase('decide');
    };

    // Next player believes: the claim becomes the new bid to beat.
    const believe = () => setPhase('turn');

    // Next player doubts: reveal the truth and hand someone a drink.
    const doubt = () => {
        if (!round) {
            return;
        }

        setOutcome({
            announced: round.announced,
            secretRoll: round.secretRoll,
            secretCall: round.secretCall,
            honest: round.secretCall.rank >= round.announced.rank,
        });
        setPhase('result');
    };

    // Loser starts the next round with a clean slate.
    const nextRound = () => {
        setPreviousCall(null);
        setRound(null);
        setOutcome(null);
        setPhase('turn');
    };

    return (
        <>
            {phase === 'setup' && <BlufSetupScreen onStart={startGame} />}
            {phase === 'turn' && (
                <BlufTurnScreen
                    previousCall={previousCall}
                    onAnnounce={announce}
                />
            )}
            {phase === 'decide' && round && (
                <BlufDecideScreen
                    announced={round.announced}
                    onBelieve={believe}
                    onDoubt={doubt}
                />
            )}
            {phase === 'result' && outcome && (
                <BlufResultScreen outcome={outcome} onNext={nextRound} />
            )}
        </>
    );
}

function BlufSetupScreen({ onStart }: { onStart: () => void }) {
    return (
        <div className="flex flex-1 flex-col">
            <header className="mb-6 text-center">
                <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-rose-400/15 px-3 py-1 text-xs font-bold tracking-widest text-rose-600 uppercase ring-1 ring-rose-400/30 dark:text-rose-300">
                    🕵️ Bluf Mexen
                </span>
                <h1 className="bg-gradient-to-br from-slate-900 via-rose-700 to-amber-500 bg-clip-text text-5xl font-black tracking-tight text-transparent dark:from-white dark:via-rose-100 dark:to-amber-300">
                    Bluf Mexen
                </h1>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    Bluffen met twee dobbelstenen. Rol stiekem, noem iets hogers
                    dan de vorige — of lieg erop los. Wie betrapt wordt, drinkt!
                </p>
            </header>

            <section className="mb-6 space-y-3 rounded-2xl bg-white p-4 text-sm shadow-sm ring-1 ring-slate-200 dark:bg-white/5 dark:shadow-none dark:ring-white/10">
                <Rule
                    n="1"
                    text="De hoogste steen telt als tientallen, de laagste als eenheden: 5 en 3 wordt 53."
                />
                <Rule
                    n="2"
                    text="Dubbels (11-66) verslaan alle gewone worpen. 2-1 is de Mex — de allerhoogste."
                />
                <Rule
                    n="3"
                    text="Elke speler moet hoger noemen dan de vorige. Kun je niet? Dan moet je bluffen."
                />
                <Rule
                    n="4"
                    text="Geloof je de vorige niet? Ontmasker! Klopte de claim, dan drink jij. Was het een leugen, dan drinkt hij."
                />
            </section>

            <div className="mt-auto pt-2">
                <Button
                    onClick={onStart}
                    className="h-14 w-full rounded-2xl bg-gradient-to-r from-rose-500 to-amber-500 text-lg font-bold text-white shadow-lg shadow-rose-900/40 transition hover:from-rose-400 hover:to-amber-400 active:scale-[0.99]"
                >
                    Start het spel
                </Button>
            </div>
        </div>
    );
}

/**
 * The roller's private screen: a hand-off gate, then a secret roll, then the
 * announcement. Only the player holding the phone should look.
 */
function BlufTurnScreen({
    previousCall,
    onAnnounce,
}: {
    previousCall: Call | null;
    onAnnounce: (roll: DiePair, call: Call) => void;
}) {
    const [roll, setRoll] = useState<DiePair | null>(null);

    if (!roll) {
        return (
            <div className="flex flex-1 flex-col items-center justify-center text-center">
                <Eye className="mb-4 size-10 text-rose-500" />
                <h1 className="text-2xl font-black">Jouw beurt</h1>
                <p className="mt-2 max-w-xs text-sm text-slate-500 dark:text-slate-400">
                    Zorg dat niemand meekijkt.
                    {previousCall ? (
                        <>
                            {' '}
                            De vorige speler noemde{' '}
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                                {previousCall.label}
                            </span>
                            . Jij moet hoger.
                        </>
                    ) : (
                        ' Jij opent de ronde.'
                    )}
                </p>

                <Button
                    onClick={() => setRoll(rollDice())}
                    className="mt-8 h-14 w-full max-w-xs rounded-2xl bg-gradient-to-r from-rose-500 to-amber-500 text-lg font-bold text-white shadow-lg shadow-rose-900/40 transition hover:from-rose-400 hover:to-amber-400 active:scale-[0.99]"
                >
                    🎲 Rol stiekem
                </Button>
            </div>
        );
    }

    return (
        <BlufAnnounceScreen
            roll={roll}
            previousCall={previousCall}
            onAnnounce={onAnnounce}
        />
    );
}

function BlufAnnounceScreen({
    roll,
    previousCall,
    onAnnounce,
}: {
    roll: DiePair;
    previousCall: Call | null;
    onAnnounce: (roll: DiePair, call: Call) => void;
}) {
    const [rolling, setRolling] = useState(true);
    const realCall = callForRoll(roll);
    const options = callsAbove(previousCall?.rank ?? 0);
    const canTellTruth = realCall.rank > (previousCall?.rank ?? 0);

    return (
        <div className="flex flex-1 flex-col">
            <div className="mb-4 flex flex-col items-center">
                <span className="text-xs font-semibold tracking-widest text-rose-600 uppercase dark:text-rose-300">
                    Jouw geheime worp
                </span>
                <div className="mt-3">
                    <RollingDice
                        roll={roll}
                        onSettled={() => setRolling(false)}
                    />
                </div>
                {rolling ? (
                    <p className="mt-3 text-sm text-slate-400 dark:text-slate-500">
                        De stenen rollen…
                    </p>
                ) : (
                    <motion.p
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-3 text-sm text-slate-500 dark:text-slate-400"
                    >
                        Dat is{' '}
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                            {realCall.label}
                        </span>
                        {canTellTruth
                            ? ' — de waarheid is genoeg.'
                            : ' — te laag, je moet bluffen.'}
                    </motion.p>
                )}
            </div>

            <motion.div
                animate={{ opacity: rolling ? 0 : 1 }}
                className={cn(
                    'mb-2 text-center text-sm font-semibold text-slate-600 dark:text-slate-300',
                    rolling && 'pointer-events-none',
                )}
            >
                Wat noem je?
            </motion.div>
            <motion.div
                animate={{ opacity: rolling ? 0 : 1 }}
                className={cn(
                    'grid grid-cols-3 gap-2 overflow-y-auto',
                    rolling && 'pointer-events-none',
                )}
            >
                {options.map((call) => {
                    const isReal = call.code === realCall.code;

                    return (
                        <button
                            key={call.code}
                            onClick={() => onAnnounce(roll, call)}
                            className={cn(
                                'relative rounded-xl py-3 text-lg font-black ring-1 transition active:scale-[0.97]',
                                call.isMax
                                    ? 'bg-amber-500/15 text-amber-700 ring-amber-400/40 dark:text-amber-300'
                                    : call.isDouble
                                      ? 'bg-rose-500/10 text-rose-700 ring-rose-400/30 dark:text-rose-200'
                                      : 'bg-white text-slate-900 ring-slate-200 hover:bg-slate-100 dark:bg-white/5 dark:text-white dark:ring-white/10 dark:hover:bg-white/10',
                                isReal &&
                                    'ring-2 ring-emerald-400 dark:ring-emerald-400',
                            )}
                        >
                            {call.label}
                            {isReal && (
                                <span className="absolute -top-1.5 -right-1.5 rounded-full bg-emerald-500 px-1.5 py-0.5 text-[9px] font-bold text-white">
                                    echt
                                </span>
                            )}
                        </button>
                    );
                })}
            </motion.div>
        </div>
    );
}

/** The next player's screen: believe the bid, or call the bluff. */
function BlufDecideScreen({
    announced,
    onBelieve,
    onDoubt,
}: {
    announced: Call;
    onBelieve: () => void;
    onDoubt: () => void;
}) {
    const [revealed, setRevealed] = useState(false);

    if (!revealed) {
        return (
            <div className="flex flex-1 flex-col items-center justify-center text-center">
                <span className="text-5xl">📱</span>
                <h1 className="mt-4 text-2xl font-black">Geef door</h1>
                <p className="mt-2 max-w-xs text-sm text-slate-500 dark:text-slate-400">
                    De volgende speler pakt de telefoon. Tik pas als jij het
                    bent.
                </p>
                <Button
                    onClick={() => setRevealed(true)}
                    className="mt-8 h-14 w-full max-w-xs rounded-2xl bg-gradient-to-r from-rose-500 to-amber-500 text-lg font-bold text-white shadow-lg shadow-rose-900/40 transition hover:from-rose-400 hover:to-amber-400 active:scale-[0.99]"
                >
                    Ik ben aan de beurt
                </Button>
            </div>
        );
    }

    return (
        <div className="flex flex-1 flex-col">
            <div className="flex flex-1 flex-col items-center justify-center text-center">
                <span className="text-xs font-semibold tracking-widest text-rose-600 uppercase dark:text-rose-300">
                    De vorige speler claimt
                </span>
                <div
                    className={cn(
                        'mt-4 flex size-40 items-center justify-center rounded-3xl shadow-2xl ring-1',
                        announced.isMax
                            ? 'bg-gradient-to-br from-amber-400 to-orange-500 ring-white/20'
                            : 'bg-gradient-to-br from-rose-500 to-rose-700 ring-white/20',
                    )}
                >
                    <span className="text-6xl font-black text-white">
                        {announced.label}
                    </span>
                </div>
                <p className="mt-4 max-w-xs text-sm text-slate-500 dark:text-slate-400">
                    {announced.isMax
                        ? 'Een Mex! Onmogelijk te overtreffen — geloof je het?'
                        : 'Geloof je het? Dan rol jij en noem je hoger. Zo niet: ontmasker!'}
                </p>
            </div>

            <div className="mt-auto space-y-3 pt-4">
                {!announced.isMax && (
                    <Button
                        onClick={onBelieve}
                        className="h-14 w-full rounded-2xl bg-emerald-500 text-lg font-bold text-white transition hover:bg-emerald-400 active:scale-[0.99]"
                    >
                        Ik geloof het → ik rol
                    </Button>
                )}
                <Button
                    onClick={onDoubt}
                    className="h-14 w-full rounded-2xl bg-gradient-to-r from-rose-500 to-amber-500 text-lg font-bold text-white transition hover:from-rose-400 hover:to-amber-400 active:scale-[0.99]"
                >
                    <ShieldQuestion className="size-5" /> Ik geloof het niet
                </Button>
            </div>
        </div>
    );
}

function BlufResultScreen({
    outcome,
    onNext,
}: {
    outcome: ChallengeOutcome;
    onNext: () => void;
}) {
    const { announced, secretRoll, secretCall, honest } = outcome;

    return (
        <div className="flex flex-1 flex-col">
            <div className="flex flex-1 flex-col items-center justify-center text-center">
                <motion.span
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 220, damping: 16 }}
                    className="text-6xl drop-shadow-lg"
                >
                    {honest ? '🎯' : '🤥'}
                </motion.span>
                <h1 className="mt-4 text-3xl font-black">
                    {honest ? 'De claim klopte!' : 'Betrapt op een leugen!'}
                </h1>

                <div className="mt-6 flex items-center gap-4">
                    <div className="flex flex-col items-center">
                        <span className="mb-1 text-[10px] font-semibold tracking-widest text-slate-400 uppercase">
                            Claim
                        </span>
                        <span className="text-2xl font-black">
                            {announced.label}
                        </span>
                    </div>
                    <span className="text-slate-400">vs</span>
                    <div className="flex flex-col items-center">
                        <span className="mb-1 text-[10px] font-semibold tracking-widest text-slate-400 uppercase">
                            Echte worp
                        </span>
                        <div className="flex gap-2">
                            <Die value={secretRoll[0]} small />
                            <Die value={secretRoll[1]} small />
                        </div>
                    </div>
                </div>

                <AnimatePresence>
                    <motion.p
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-6 flex items-center gap-2 rounded-full bg-rose-500/15 px-5 py-2 text-lg font-bold text-rose-700 ring-1 ring-rose-400/30 dark:text-rose-200"
                    >
                        <Beer className="size-5" />
                        {honest
                            ? 'De twijfelaar drinkt!'
                            : 'De bluffer drinkt!'}
                    </motion.p>
                </AnimatePresence>
                <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                    Echte worp was{' '}
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {secretCall.label}
                    </span>
                    .
                </p>
            </div>

            <div className="mt-auto pt-4">
                <Button
                    onClick={onNext}
                    className="h-14 w-full rounded-2xl bg-gradient-to-r from-rose-500 to-amber-500 text-lg font-bold text-white transition hover:from-rose-400 hover:to-amber-400 active:scale-[0.99]"
                >
                    <RotateCcw className="size-5" /> Nieuwe ronde
                </Button>
                <p className="mt-2 text-center text-xs text-slate-400 dark:text-slate-500">
                    De verliezer begint de volgende ronde.
                </p>
            </div>
        </div>
    );
}

/** How long the dice tumble before they land on the real roll. */
const ROLL_MS = 900;

/**
 * Two dice that tumble with random faces before landing on the real roll.
 * Remount (via a key) to play the animation again for a new roll.
 */
function RollingDice({
    roll,
    onSettled,
}: {
    roll: DiePair;
    onSettled?: () => void;
}) {
    // Start on random faces so the real roll never flashes early.
    const [faces, setFaces] = useState<DiePair>(() => rollDice());
    const [settled, setSettled] = useState(false);

    useEffect(() => {
        const spin = window.setInterval(() => setFaces(rollDice()), 90);
        const stop = window.setTimeout(() => {
            window.clearInterval(spin);
            setFaces(roll);
            setSettled(true);
            onSettled?.();
        }, ROLL_MS);

        return () => {
            window.clearInterval(spin);
            window.clearTimeout(stop);
        };
        // Mount-only: a new roll remounts the component via its key.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="flex gap-3">
            {([0, 1] as const).map((index) => (
                <motion.div
                    key={index}
                    animate={
                        settled
                            ? {
                                  rotate: index === 0 ? -720 : 720,
                                  y: 0,
                                  scale: 1,
                              }
                            : {
                                  rotate:
                                      index === 0
                                          ? [0, -340, -700]
                                          : [0, 340, 700],
                                  y: [0, -22, 0, -10, 0],
                                  scale: [1, 1.15, 1.05],
                              }
                    }
                    transition={
                        settled
                            ? { type: 'spring', stiffness: 260, damping: 14 }
                            : { duration: ROLL_MS / 1000, ease: 'easeOut' }
                    }
                >
                    <Die value={faces[index]} />
                </motion.div>
            ))}
        </div>
    );
}

/** A single pip die drawn from a 3×3 dot grid. */
function Die({ value, small = false }: { value: number; small?: boolean }) {
    // Which of the 9 grid cells hold a pip for each face.
    const pips: Record<number, number[]> = {
        1: [4],
        2: [0, 8],
        3: [0, 4, 8],
        4: [0, 2, 6, 8],
        5: [0, 2, 4, 6, 8],
        6: [0, 2, 3, 5, 6, 8],
    };
    const lit = new Set(pips[value] ?? []);

    return (
        <div
            className={cn(
                'grid grid-cols-3 grid-rows-3 gap-1 rounded-2xl bg-white p-2 shadow-lg ring-1 ring-slate-200 dark:bg-slate-100',
                small ? 'size-12' : 'size-20',
            )}
        >
            {Array.from({ length: 9 }, (_, i) => (
                <span
                    key={i}
                    className={cn(
                        'rounded-full',
                        lit.has(i) ? 'bg-slate-900' : 'bg-transparent',
                    )}
                />
            ))}
        </div>
    );
}
