import { Head, Link } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Beer, Eye, RotateCcw, ShieldQuestion } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    type Call,
    callForRoll,
    callsAbove,
    type DiePair,
    rollDice,
} from '@/lib/mexen';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';

type Phase = 'setup' | 'turn' | 'decide' | 'result';

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

export default function Mexen() {
    const [phase, setPhase] = useState<Phase>('setup');
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
            <Head title="Mexen" />
            <div className="relative flex min-h-[100dvh] flex-col overflow-hidden bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
                <div className="pointer-events-none absolute -top-32 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-rose-300/40 blur-3xl dark:bg-rose-600/25" />
                <div className="pointer-events-none absolute -right-24 -bottom-40 h-80 w-80 rounded-full bg-amber-300/40 blur-3xl dark:bg-amber-500/20" />
                <main className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
                    <div className="mb-2">
                        <Link
                            href={dashboard()}
                            className="inline-flex items-center gap-1 text-sm text-slate-500 transition hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                        >
                            <ArrowLeft className="size-4" /> Dashboard
                        </Link>
                    </div>

                    {phase === 'setup' && <SetupScreen onStart={startGame} />}
                    {phase === 'turn' && (
                        <TurnScreen
                            previousCall={previousCall}
                            onAnnounce={announce}
                        />
                    )}
                    {phase === 'decide' && round && (
                        <DecideScreen
                            announced={round.announced}
                            onBelieve={believe}
                            onDoubt={doubt}
                        />
                    )}
                    {phase === 'result' && outcome && (
                        <ResultScreen outcome={outcome} onNext={nextRound} />
                    )}
                </main>
            </div>
        </>
    );
}

function SetupScreen({ onStart }: { onStart: () => void }) {
    return (
        <div className="flex flex-1 flex-col">
            <header className="mb-6 text-center">
                <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-rose-400/15 px-3 py-1 text-xs font-bold tracking-widest text-rose-600 uppercase ring-1 ring-rose-400/30 dark:text-rose-300">
                    🎲 Mexen
                </span>
                <h1 className="bg-gradient-to-br from-slate-900 via-rose-700 to-amber-500 bg-clip-text text-5xl font-black tracking-tight text-transparent dark:from-white dark:via-rose-100 dark:to-amber-300">
                    Mexen
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

/**
 * The roller's private screen: a hand-off gate, then a secret roll, then the
 * announcement. Only the player holding the phone should look.
 */
function TurnScreen({
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
        <AnnounceScreen
            roll={roll}
            previousCall={previousCall}
            onAnnounce={onAnnounce}
        />
    );
}

function AnnounceScreen({
    roll,
    previousCall,
    onAnnounce,
}: {
    roll: DiePair;
    previousCall: Call | null;
    onAnnounce: (roll: DiePair, call: Call) => void;
}) {
    const realCall = callForRoll(roll);
    const options = callsAbove(previousCall?.rank ?? 0);
    const canTellTruth = realCall.rank > (previousCall?.rank ?? 0);

    return (
        <div className="flex flex-1 flex-col">
            <div className="mb-4 flex flex-col items-center">
                <span className="text-xs font-semibold tracking-widest text-rose-600 uppercase dark:text-rose-300">
                    Jouw geheime worp
                </span>
                <div className="mt-3 flex gap-3">
                    <Die value={roll[0]} />
                    <Die value={roll[1]} />
                </div>
                <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                    Dat is{' '}
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                        {realCall.label}
                    </span>
                    {canTellTruth
                        ? ' — de waarheid is genoeg.'
                        : ' — te laag, je moet bluffen.'}
                </p>
            </div>

            <div className="mb-2 text-center text-sm font-semibold text-slate-600 dark:text-slate-300">
                Wat noem je?
            </div>
            <div className="grid grid-cols-3 gap-2 overflow-y-auto">
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
            </div>
        </div>
    );
}

/** The next player's screen: believe the bid, or call the bluff. */
function DecideScreen({
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

function ResultScreen({
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
