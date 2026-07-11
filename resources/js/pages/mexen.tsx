import { motion, useReducedMotion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import {
    ArrowLeft,
    ArrowRight,
    Beer,
    ChevronRight,
    Crown,
    Dice5,
    Dices,
    RotateCcw,
    ShieldQuestion,
    Target,
    VenetianMask,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import {
    ActionButton,
    CelebrationHeader,
    CountUp,
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

type Variant = 'menu' | 'normaal' | 'bluf';

export default function Mexen() {
    const [variant, setVariant] = useState<Variant>('menu');

    return (
        <GameShell title="Mexen" accent="gold" back={variant === 'menu'}>
            {variant !== 'menu' && (
                <div className="mb-3">
                    <LeaveGameChip onLeave={() => setVariant('menu')} />
                </div>
            )}

            <PhaseTransition phaseKey={variant}>
                {variant === 'menu' && <VariantMenu onPick={setVariant} />}
                {variant === 'normaal' && <NormaalMexen />}
                {variant === 'bluf' && <BlufMexen />}
            </PhaseTransition>
        </GameShell>
    );
}

/**
 * Mid-game escape hatch back to the variant menu. Destroys the running game,
 * so the first tap only arms it — a second tap within 3s confirms.
 */
function LeaveGameChip({ onLeave }: { onLeave: () => void }) {
    const [armed, setArmed] = useState(false);

    useEffect(() => {
        if (!armed) {
            return;
        }

        const timer = window.setTimeout(() => setArmed(false), 3000);

        return () => window.clearTimeout(timer);
    }, [armed]);

    return (
        <button
            type="button"
            onClick={() => {
                feel.select();

                if (armed) {
                    onLeave();
                } else {
                    setArmed(true);
                }
            }}
            className={cn(
                'inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-medium ring-1 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-(--glow)',
                armed
                    ? 'bg-rose-500/15 text-rose-300 ring-rose-400/40'
                    : 'bg-white/5 text-slate-400 ring-white/10 hover:bg-white/10 hover:text-white',
            )}
        >
            <ArrowLeft className="size-4" aria-hidden />
            <span aria-live="polite">
                {armed ? 'Zeker weten? Het spel stopt' : 'Kies variant'}
            </span>
        </button>
    );
}

/** Landing screen: pick the open (normaal) or secret (bluf) variant. */
function VariantMenu({ onPick }: { onPick: (variant: Variant) => void }) {
    return (
        <div className="flex flex-1 flex-col">
            <GameHeader
                kicker="Dobbelspel"
                title="Mexen"
                description="Twee dobbelstenen, twee manieren om te verliezen. Kies je variant."
            />

            <div className="space-y-3">
                <VariantCard
                    title="Normaal Mexen"
                    description="Iedereen rolt open, tot drie keer. De laagste worp van de ronde drinkt — elke Mex verdubbelt de slokken."
                    icon={Dice5}
                    index={0}
                    onClick={() => onPick('normaal')}
                />
                <VariantCard
                    title="Bluf Mexen"
                    description="Rol stiekem en noem iets hogers dan de vorige — of lieg erop los. Wie betrapt wordt, drinkt!"
                    icon={VenetianMask}
                    index={1}
                    onClick={() => onPick('bluf')}
                />
            </div>
        </div>
    );
}

function VariantCard({
    title,
    description,
    icon,
    index,
    onClick,
}: {
    title: string;
    description: string;
    icon: LucideIcon;
    index: number;
    onClick: () => void;
}) {
    return (
        <motion.button
            type="button"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
                delay: index * 0.08,
                type: 'spring',
                stiffness: 300,
                damping: 24,
            }}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
                feel.select();
                onClick();
            }}
            className="flex w-full items-center gap-4 rounded-2xl bg-white/[0.045] p-4 text-left ring-1 ring-white/10 transition hover:bg-white/[0.08] focus:outline-none focus-visible:ring-2 focus-visible:ring-(--glow)"
        >
            <IconBadge icon={icon} className="shrink-0" />
            <span className="flex-1">
                <span className="block text-base font-bold text-white">
                    {title}
                </span>
                <span className="block text-sm text-slate-400">
                    {description}
                </span>
            </span>
            <ChevronRight
                className="size-5 shrink-0 text-slate-500"
                aria-hidden
            />
        </motion.button>
    );
}

function Rule({ n, text }: { n: string; text: string }) {
    return (
        <div className="flex gap-3">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-(--glow)/15 text-xs font-bold text-(--glow-strong)">
                {n}
            </span>
            <p className="text-slate-300">{text}</p>
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
        <PhaseTransition
            phaseKey={phase === 'turn' ? `turn-${startIndex}-${turn}` : phase}
        >
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
        </PhaseTransition>
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
            <GameHeader
                kicker="Dobbelspel"
                title="Normaal Mexen"
                description="Iedereen rolt open. Wie de laagste worp op tafel legt, drinkt!"
            />

            <Panel className="mb-5 space-y-3 text-sm">
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
            </Panel>

            <Panel className="mb-5">
                <Stepper
                    label="Spelers"
                    value={playerCount}
                    onChange={setPlayerCount}
                    min={MIN_PLAYERS}
                    max={MAX_PLAYERS}
                />
            </Panel>

            <div className="mt-auto pt-2">
                <ActionButton onClick={onStart}>Start het spel</ActionButton>
            </div>
        </div>
    );
}

/** One player's open turn: claim the phone, roll, optionally re-roll, stand. */
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
            <PassPhoneGate
                name={`Speler ${player + 1}`}
                instruction="Geef de telefoon aan"
                buttonLabel="Rol de dobbelstenen"
                onReady={throwDice}
            >
                <div className="flex w-full flex-col items-center">
                    <p className="max-w-xs text-sm text-slate-400">
                        Rol open — iedereen kijkt mee.
                        {isFirst
                            ? ` Jij opent de ronde: je mag tot ${MAX_THROWS} keer rollen en bepaalt zo het aantal worpen voor de rest.`
                            : ` Je mag ${throwLimit === 1 ? 'één keer' : `tot ${throwLimit} keer`} rollen.`}
                    </p>
                    <RolledSoFar rolledSoFar={rolledSoFar} />
                </div>
            </PassPhoneGate>
        );
    }

    const call = callForRoll(roll);
    const mayRethrow = !call.isMax && throwsUsed < throwLimit;

    return (
        <div className="flex flex-1 flex-col">
            <div className="flex flex-1 flex-col items-center justify-center text-center">
                <span className="text-xs font-semibold tracking-widest text-(--glow-strong) uppercase">
                    Speler {player + 1} · worp {throwsUsed} van {throwLimit}
                </span>
                <div className="mt-5">
                    <RollingDice
                        key={throwsUsed}
                        roll={roll}
                        onSettled={() => setRolling(false)}
                    />
                </div>
                <div
                    aria-live="polite"
                    className="mt-5 flex min-h-44 w-full flex-col items-center justify-center"
                >
                    {rolling ? (
                        <p className="text-sm text-slate-500">
                            De stenen rollen…
                        </p>
                    ) : call.isMax ? (
                        <MexJackpot />
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-col items-center"
                        >
                            <p className="text-sm text-slate-400">Dat is</p>
                            <p className="mt-1 font-display text-6xl text-white">
                                {call.label}
                            </p>
                        </motion.div>
                    )}
                </div>
            </div>

            <RolledSoFar rolledSoFar={rolledSoFar} />

            <div className="mt-auto space-y-3 pt-4">
                {mayRethrow && (
                    <ActionButton
                        variant="neutral"
                        onClick={throwDice}
                        disabled={rolling}
                    >
                        <Dices className="size-5" aria-hidden /> Nog een keer
                        rollen
                    </ActionButton>
                )}
                <ActionButton
                    onClick={() => onStand(call, throwsUsed)}
                    disabled={rolling}
                >
                    {isLast
                        ? 'Blijven staan → uitslag'
                        : 'Blijven staan → geef door'}
                </ActionButton>
            </div>
        </div>
    );
}

/** The jackpot takeover for an open Mex roll: confetti, fanfare, gold flood. */
function MexJackpot() {
    return (
        <div className="relative flex w-full flex-col items-center">
            <motion.div
                aria-hidden
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6 }}
                className="pointer-events-none fixed inset-0 bg-[radial-gradient(90%_60%_at_50%_35%,color-mix(in_oklab,var(--glow)_20%,transparent),transparent_72%)]"
            />
            <CelebrationHeader
                icon={Crown}
                title="MEX!"
                tone="win"
                subtitle="De allerhoogste worp — de slokken verdubbelen!"
            />
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

    const lowestRank = Math.min(...rolledSoFar.map(({ call }) => call.rank));

    return (
        <div className="mt-4">
            <p className="mb-2 text-center text-[10px] font-semibold tracking-widest text-slate-500 uppercase">
                Deze ronde
            </p>
            <div className="flex flex-wrap justify-center gap-2">
                {rolledSoFar.map(({ player, call }) => {
                    const isLowest = call.rank === lowestRank && !call.isMax;

                    return (
                        <span
                            key={player}
                            className={cn(
                                'rounded-full px-3 py-1 text-xs font-bold ring-1',
                                call.isMax
                                    ? 'bg-(--glow)/12 text-(--glow-strong) ring-(--glow)/30'
                                    : isLowest
                                      ? 'bg-rose-500/10 text-rose-300 ring-rose-400/30'
                                      : 'bg-white/5 text-slate-300 ring-white/10',
                            )}
                        >
                            Speler {player + 1}: {call.label}
                            {isLowest && ' · laagste'}
                        </span>
                    );
                })}
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
    const reduceMotion = useReducedMotion();
    const { loserIndices, sips } = judgeRound(calls);
    const losers = new Set(loserIndices);
    const mexCount = calls.filter((call) => call.isMax).length;
    const loserNames = loserIndices
        .map((index) => `Speler ${index + 1}`)
        .join(' & ');
    const inThrowOrder = Array.from({ length: calls.length }, (_, i) => {
        const player = (startIndex + i) % calls.length;

        return { player, call: calls[player] };
    });

    // The verdict waits until the per-player rows have cascaded in.
    const [verdictShown, setVerdictShown] = useState(false);
    const cascadeMs = 350 + inThrowOrder.length * 90;

    useEffect(() => {
        const timer = window.setTimeout(
            () => {
                setVerdictShown(true);
                feel.fail();
            },
            reduceMotion ? 0 : cascadeMs + 250,
        );

        return () => window.clearTimeout(timer);
        // Mount-only: the staged reveal plays once per result screen.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Every Mex on the table doubles the pot: 1 → 2 → 4 → …
    const doubling = Array.from({ length: mexCount + 1 }, (_, i) => 2 ** i);

    return (
        <div className="flex flex-1 flex-col">
            <p className="mb-4 text-center text-xs font-semibold tracking-widest text-(--glow-strong) uppercase">
                Uitslag
            </p>

            <div
                aria-live="polite"
                className="mb-6 flex min-h-56 flex-col items-center justify-center text-center"
            >
                {verdictShown && (
                    <>
                        <motion.span
                            aria-hidden
                            initial={
                                reduceMotion
                                    ? { opacity: 0 }
                                    : { scale: 0, rotate: -14 }
                            }
                            animate={
                                reduceMotion
                                    ? { opacity: 1 }
                                    : { scale: 1, rotate: 0, opacity: 1 }
                            }
                            transition={{
                                type: 'spring',
                                stiffness: 300,
                                damping: 16,
                            }}
                            className="flex size-20 items-center justify-center rounded-3xl bg-rose-400/12 text-rose-300 ring-1 ring-rose-400/25"
                        >
                            <Beer className="size-10" />
                        </motion.span>
                        <h2 className="mt-4 font-display text-3xl text-white">
                            {loserNames}{' '}
                            {loserIndices.length > 1 ? 'drinken' : 'drinkt'}!
                        </h2>
                        <motion.p
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.12 }}
                            className="mt-3 flex items-center gap-2 rounded-full bg-rose-500/12 px-5 py-2 text-lg font-bold text-rose-200 ring-1 ring-rose-400/30"
                        >
                            <Beer className="size-5" aria-hidden />
                            <span>
                                {loserIndices.length > 1
                                    ? 'Laagste worp — ieder'
                                    : 'Laagste worp —'}
                            </span>
                            <CountUp
                                value={sips}
                                className="font-display text-2xl"
                            />
                            <span>{sips === 1 ? 'slok' : 'slokken'}!</span>
                        </motion.p>
                        {mexCount > 0 && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="mt-3 flex items-center gap-2 text-sm text-(--glow-strong)"
                            >
                                <Crown className="size-4" aria-hidden />
                                <span>
                                    {mexCount === 1
                                        ? 'Mex op tafel:'
                                        : `${mexCount}× Mex op tafel:`}
                                </span>
                                <span className="flex items-center gap-1">
                                    {doubling.map((count, index) => (
                                        <span
                                            key={count}
                                            className="flex items-center gap-1"
                                        >
                                            {index > 0 && (
                                                <ArrowRight
                                                    className="size-3.5"
                                                    aria-hidden
                                                />
                                            )}
                                            <span
                                                className={
                                                    index ===
                                                    doubling.length - 1
                                                        ? 'font-display text-xl'
                                                        : 'text-slate-400'
                                                }
                                            >
                                                {count}
                                            </span>
                                        </span>
                                    ))}
                                </span>
                                <span>slokken</span>
                            </motion.div>
                        )}
                    </>
                )}
            </div>

            <div className="space-y-2">
                {inThrowOrder.map(({ player, call }, index) => (
                    <motion.div
                        key={player}
                        initial={
                            reduceMotion
                                ? { opacity: 0 }
                                : { opacity: 0, x: -18 }
                        }
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                            delay: reduceMotion ? 0 : 0.15 + index * 0.09,
                            type: 'spring',
                            stiffness: 300,
                            damping: 26,
                        }}
                        className="relative"
                    >
                        <motion.div
                            aria-hidden
                            initial={false}
                            animate={{
                                opacity:
                                    verdictShown && losers.has(player) ? 1 : 0,
                            }}
                            className="absolute inset-0 rounded-xl bg-rose-500/15 ring-1 ring-rose-400/40"
                        />
                        <div
                            className={cn(
                                'relative flex items-center justify-between rounded-xl px-4 py-3 ring-1',
                                call.isMax
                                    ? 'bg-(--glow)/10 ring-(--glow)/30'
                                    : 'bg-white/[0.045] ring-white/10',
                            )}
                        >
                            <span className="flex items-center gap-2 text-base font-medium text-white">
                                {losers.has(player) && (
                                    <motion.span
                                        initial={{ scale: 0 }}
                                        animate={{
                                            scale: verdictShown ? 1 : 0,
                                        }}
                                        transition={{
                                            type: 'spring',
                                            stiffness: 400,
                                            damping: 18,
                                        }}
                                    >
                                        <Beer
                                            className="size-4 text-rose-300"
                                            aria-hidden
                                        />
                                    </motion.span>
                                )}
                                Speler {player + 1}
                            </span>
                            <span
                                className={cn(
                                    'font-display text-xl tabular-nums',
                                    call.isMax
                                        ? 'text-(--glow-strong)'
                                        : 'text-white',
                                )}
                            >
                                {call.label}
                            </span>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="mt-auto pt-6">
                <ActionButton onClick={() => onNext(loserIndices[0])}>
                    <RotateCcw className="size-5" aria-hidden /> Nieuwe ronde
                </ActionButton>
                <p className="mt-2 text-center text-xs text-slate-500">
                    Speler {loserIndices[0] + 1} opent de volgende ronde.
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
        <PhaseTransition phaseKey={phase}>
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
        </PhaseTransition>
    );
}

function BlufSetupScreen({ onStart }: { onStart: () => void }) {
    return (
        <div className="flex flex-1 flex-col">
            <GameHeader
                kicker="Blufspel"
                title="Bluf Mexen"
                description="Bluffen met twee dobbelstenen. Rol stiekem, noem iets hogers dan de vorige — of lieg erop los. Wie betrapt wordt, drinkt!"
            />

            <Panel className="mb-6 space-y-3 text-sm">
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
            </Panel>

            <div className="mt-auto pt-2">
                <ActionButton onClick={onStart}>Start het spel</ActionButton>
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
            <PassPhoneGate
                instruction="Geef de telefoon aan de volgende speler."
                buttonLabel="Rol stiekem"
                onReady={() => setRoll(rollDice())}
            >
                {previousCall ? (
                    <div className="flex flex-col items-center">
                        <p className="text-xs font-semibold tracking-widest text-slate-500 uppercase">
                            Te overtreffen
                        </p>
                        <p className="mt-1 font-display text-5xl text-(--glow-strong)">
                            {previousCall.label}
                        </p>
                        <p className="mt-3 max-w-xs text-sm text-slate-400">
                            Zorg dat niemand meekijkt. Rol stiekem en claim
                            hoger — of bluf.
                        </p>
                    </div>
                ) : (
                    <p className="max-w-xs text-sm text-slate-400">
                        Jij opent de ronde. Zorg dat niemand meekijkt en rol
                        stiekem.
                    </p>
                )}
            </PassPhoneGate>
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
            <div className="mb-4 flex flex-col items-center text-center">
                <span className="text-xs font-semibold tracking-widest text-(--glow-strong) uppercase">
                    Jouw geheime worp
                </span>
                <div className="mt-4">
                    <RollingDice
                        roll={roll}
                        onSettled={() => setRolling(false)}
                    />
                </div>
                <div aria-live="polite" className="mt-4 min-h-12 text-sm">
                    {rolling ? (
                        <p className="text-slate-500">De stenen rollen…</p>
                    ) : (
                        <motion.p
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-slate-400"
                        >
                            Dat is{' '}
                            <span className="font-display text-2xl text-white">
                                {realCall.label}
                            </span>
                            {canTellTruth
                                ? ' — de waarheid is genoeg.'
                                : ' — te laag, je moet bluffen.'}
                        </motion.p>
                    )}
                </div>
            </div>

            <motion.div
                animate={{ opacity: rolling ? 0 : 1 }}
                className={cn(
                    'mb-2 text-center text-sm font-semibold text-slate-300',
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
                        <motion.button
                            key={call.code}
                            type="button"
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                                feel.tap();
                                onAnnounce(roll, call);
                            }}
                            className={cn(
                                'relative rounded-xl py-3 text-lg font-bold ring-1 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-(--glow)',
                                call.isMax
                                    ? 'bg-(--glow)/15 text-(--glow-strong) ring-(--glow)/40'
                                    : call.isDouble
                                      ? 'bg-white/5 text-(--glow-strong) ring-(--glow)/25 hover:bg-white/10'
                                      : 'bg-white/5 text-white ring-white/10 hover:bg-white/10',
                                isReal && 'ring-2 ring-emerald-400',
                            )}
                        >
                            {call.label}
                            {isReal && (
                                <span className="absolute -top-1.5 -right-1.5 rounded-full bg-emerald-500 px-1.5 py-0.5 text-[9px] font-bold text-white">
                                    echt
                                </span>
                            )}
                        </motion.button>
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
            <PassPhoneGate
                instruction="Geef de telefoon door."
                buttonLabel="Ik ben aan de beurt"
                onReady={() => setRevealed(true)}
            >
                <p className="max-w-xs text-sm text-slate-400">
                    Tik pas als jij het bent — dan zie je de claim.
                </p>
            </PassPhoneGate>
        );
    }

    return (
        <div className="flex flex-1 flex-col">
            <div className="flex flex-1 flex-col items-center justify-center text-center">
                <span className="text-xs font-semibold tracking-widest text-(--glow-strong) uppercase">
                    De vorige speler claimt
                </span>
                <motion.div
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className="mt-5 flex size-44 animate-glow-pulse items-center justify-center rounded-3xl bg-(--glow) ring-1 ring-white/20"
                >
                    <span className="font-display text-7xl text-slate-950">
                        {announced.label}
                    </span>
                </motion.div>
                <p className="mt-5 max-w-xs text-sm text-slate-400">
                    {announced.isMax
                        ? 'Een Mex is niet te overtreffen — geloven heeft geen zin. Je kunt alleen ontmaskeren!'
                        : 'Geloof je het? Dan rol jij en noem je hoger. Zo niet: ontmasker!'}
                </p>
            </div>

            <div className="mt-auto space-y-3 pt-4">
                {!announced.isMax && (
                    <ActionButton variant="success" onClick={onBelieve}>
                        Ik geloof het → ik rol
                    </ActionButton>
                )}
                <ActionButton variant="danger" onClick={onDoubt}>
                    <ShieldQuestion className="size-5" aria-hidden /> Ik geloof
                    het niet
                </ActionButton>
            </div>
        </div>
    );
}

/** How long the challenge reveal waits before the dice flip over. */
const REVEAL_FLIP_MS = 900;

/** How long after the flip the verdict slams in. */
const REVEAL_VERDICT_MS = 1900;

function BlufResultScreen({
    outcome,
    onNext,
}: {
    outcome: ChallengeOutcome;
    onNext: () => void;
}) {
    const { announced, secretRoll, secretCall, honest } = outcome;
    const reduceMotion = useReducedMotion();
    // Staged reveal: 0 = claim, 1 = dice flipped, 2 = verdict.
    const [stage, setStage] = useState(0);

    useEffect(() => {
        const verdictFeel = () => {
            if (honest) {
                feel.success();
            } else {
                feel.fail();
            }
        };

        const flipTimer = reduceMotion
            ? undefined
            : window.setTimeout(() => {
                  setStage(1);
                  feel.flip();
              }, REVEAL_FLIP_MS);
        const verdictTimer = window.setTimeout(
            () => {
                setStage(2);
                verdictFeel();
            },
            reduceMotion ? 0 : REVEAL_VERDICT_MS,
        );

        return () => {
            window.clearTimeout(flipTimer);
            window.clearTimeout(verdictTimer);
        };
        // Mount-only: the staged reveal plays once per challenge.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="flex flex-1 flex-col">
            <div className="flex flex-1 flex-col items-center justify-center text-center">
                <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center"
                >
                    <span className="text-xs font-semibold tracking-widest text-(--glow-strong) uppercase">
                        De claim
                    </span>
                    <span className="mt-1 font-display text-5xl text-white">
                        {announced.label}
                    </span>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.35 }}
                    className="mt-6 flex flex-col items-center"
                >
                    <span className="text-xs font-semibold tracking-widest text-slate-500 uppercase">
                        De echte worp
                    </span>
                    <div className="mt-3 flex gap-3">
                        {([0, 1] as const).map((index) => (
                            <FlipCard
                                key={index}
                                revealed={stage >= 1}
                                className="size-16"
                                front={
                                    <div className="flex size-full items-center justify-center rounded-2xl bg-white/[0.06] ring-1 ring-white/15">
                                        <Dices
                                            className="size-7 text-slate-500"
                                            aria-hidden
                                        />
                                    </div>
                                }
                                back={
                                    <Die value={secretRoll[index]} size="sm" />
                                }
                            />
                        ))}
                    </div>
                    <div className="mt-2 min-h-5 text-sm text-slate-400">
                        {stage >= 1 && (
                            <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                            >
                                Dat is{' '}
                                <span className="font-semibold text-white">
                                    {secretCall.label}
                                </span>
                            </motion.span>
                        )}
                    </div>
                </motion.div>

                <div
                    aria-live="polite"
                    className="mt-6 flex min-h-48 w-full flex-col items-center justify-start"
                >
                    {stage >= 2 && (
                        <>
                            <motion.span
                                aria-hidden
                                initial={
                                    reduceMotion
                                        ? { opacity: 0 }
                                        : { scale: 0, rotate: -14 }
                                }
                                animate={
                                    reduceMotion
                                        ? { opacity: 1 }
                                        : { scale: 1, rotate: 0, opacity: 1 }
                                }
                                transition={{
                                    type: 'spring',
                                    stiffness: 300,
                                    damping: 16,
                                }}
                                className={cn(
                                    'flex size-20 items-center justify-center rounded-3xl ring-1',
                                    honest
                                        ? 'bg-emerald-400/12 text-emerald-300 ring-emerald-400/25'
                                        : 'bg-rose-400/12 text-rose-300 ring-rose-400/25',
                                )}
                            >
                                {honest ? (
                                    <Target className="size-10" />
                                ) : (
                                    <VenetianMask className="size-10" />
                                )}
                            </motion.span>
                            <h2
                                className={cn(
                                    'mt-4 font-display text-4xl',
                                    honest
                                        ? 'text-emerald-300'
                                        : 'animate-shake text-rose-300',
                                )}
                            >
                                {honest ? 'De claim klopte!' : 'Betrapt!'}
                            </h2>
                            <motion.p
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.15 }}
                                className="mt-3 flex items-center gap-2 rounded-full bg-rose-500/12 px-5 py-2 text-lg font-bold text-rose-200 ring-1 ring-rose-400/30"
                            >
                                <Beer className="size-5" aria-hidden />
                                {honest
                                    ? 'De twijfelaar drinkt!'
                                    : 'De bluffer drinkt!'}
                            </motion.p>
                        </>
                    )}
                </div>
            </div>

            <div className="mt-auto pt-4">
                <ActionButton onClick={onNext}>
                    <RotateCcw className="size-5" aria-hidden /> Nieuwe ronde
                </ActionButton>
                <p className="mt-2 text-center text-xs text-slate-500">
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
    const reduceMotion = useReducedMotion();
    // Start on random faces so the real roll never flashes early.
    const [faces, setFaces] = useState<DiePair>(() => rollDice());
    const [settled, setSettled] = useState(false);

    useEffect(() => {
        const spin = window.setInterval(() => {
            setFaces(rollDice());
            feel.tick();
        }, 90);
        const stop = window.setTimeout(() => {
            window.clearInterval(spin);
            setFaces(roll);
            setSettled(true);
            feel.flip();
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
        <div className="flex gap-4">
            {([0, 1] as const).map((index) => (
                <motion.div
                    key={index}
                    animate={
                        reduceMotion
                            ? undefined
                            : settled
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
                                    y: [0, -26, 0, -12, 0],
                                    scale: [1, 1.18, 1.06],
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

/** A single pip die drawn from a 3×3 dot grid, with a bit of tabletop depth. */
function Die({
    value,
    size = 'lg',
    className,
}: {
    value: number;
    size?: 'sm' | 'lg';
    className?: string;
}) {
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
                'grid grid-cols-3 grid-rows-3 bg-gradient-to-br from-white via-slate-100 to-slate-300 ring-1 ring-slate-950/25',
                'shadow-[inset_0_1px_1px_rgba(255,255,255,0.95),inset_0_-6px_10px_rgba(15,23,42,0.28),0_12px_28px_-10px_rgba(0,0,0,0.65)]',
                size === 'lg'
                    ? 'size-24 gap-1.5 rounded-[1.4rem] p-3'
                    : 'size-16 gap-1 rounded-2xl p-2',
                className,
            )}
        >
            {Array.from({ length: 9 }, (_, i) => (
                <span
                    key={i}
                    className={cn(
                        'rounded-full',
                        lit.has(i) &&
                            'bg-slate-900 shadow-[inset_0_2px_3px_rgba(0,0,0,0.8),inset_0_-1px_1px_rgba(255,255,255,0.25)]',
                    )}
                />
            ))}
        </div>
    );
}
