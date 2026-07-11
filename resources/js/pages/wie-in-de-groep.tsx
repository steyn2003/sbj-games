import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Beer, RotateCcw } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
    ActionButton,
    CelebrationHeader,
    CountUp,
    GameHeader,
    GameShell,
    Panel,
    PassPhoneGate,
    PhaseTransition,
    Stepper,
} from '@/components/game-ui';
import { feel } from '@/hooks/use-game-feel';
import {
    MAX_PLAYERS,
    MIN_PLAYERS,
    pickStatement,
    tallyVotes,
} from '@/lib/most-likely';
import { cn } from '@/lib/utils';

type Phase = 'setup' | 'vote' | 'reveal';

function defaultNames(count: number): string[] {
    return Array.from({ length: count }, (_, i) => `Speler ${i + 1}`);
}

export default function WieInDeGroep() {
    const [phase, setPhase] = useState<Phase>('setup');
    const [names, setNames] = useState<string[]>(() => defaultNames(4));
    const [statement, setStatement] = useState('');
    const [voterIndex, setVoterIndex] = useState(0);
    const [votes, setVotes] = useState<number[]>([]);

    const startQuestion = (nextNames: string[]) => {
        setStatement((current) => pickStatement(current));
        setVotes(new Array(nextNames.length).fill(0));
        setVoterIndex(0);
        setPhase('vote');
    };

    const castVote = (targetIndex: number) => {
        setVotes((current) =>
            current.map((count, index) =>
                index === targetIndex ? count + 1 : count,
            ),
        );

        if (voterIndex + 1 >= names.length) {
            setPhase('reveal');
        } else {
            setVoterIndex(voterIndex + 1);
        }
    };

    return (
        <GameShell title="Wie in de groep…?" accent="pink">
            <PhaseTransition
                phaseKey={phase === 'vote' ? `vote-${voterIndex}` : phase}
            >
                {phase === 'setup' && (
                    <SetupScreen
                        names={names}
                        setNames={setNames}
                        onStart={() => startQuestion(names)}
                    />
                )}
                {phase === 'vote' && (
                    <VoteScreen
                        key={voterIndex}
                        statement={statement}
                        voter={names[voterIndex]}
                        voterIndex={voterIndex}
                        total={names.length}
                        names={names}
                        onVote={castVote}
                        onReset={() => setPhase('setup')}
                    />
                )}
                {phase === 'reveal' && (
                    <RevealScreen
                        statement={statement}
                        names={names}
                        votes={votes}
                        onNext={() => startQuestion(names)}
                        onReset={() => setPhase('setup')}
                    />
                )}
            </PhaseTransition>
        </GameShell>
    );
}

function SetupScreen({
    names,
    setNames,
    onStart,
}: {
    names: string[];
    setNames: React.Dispatch<React.SetStateAction<string[]>>;
    onStart: () => void;
}) {
    const reduceMotion = useReducedMotion();

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

    const error = names.some((name) => name.trim() === '')
        ? 'Elke speler heeft een naam nodig.'
        : null;

    return (
        <div className="flex flex-1 flex-col">
            <GameHeader
                kicker="Stemspel"
                title="Wie in de groep…?"
                description="Een stelling verschijnt. Geef de telefoon rond — iedereen stemt stiekem op wie het het beste past. Daarna onthullen we de winnaar!"
            />

            <Panel className="mb-5">
                <Stepper
                    label="Spelers"
                    value={names.length}
                    onChange={setPlayerCount}
                    min={MIN_PLAYERS}
                    max={MAX_PLAYERS}
                />
            </Panel>

            <section className="mb-5 space-y-2">
                <h2 className="px-1 text-xs font-semibold tracking-widest text-slate-400 uppercase">
                    Namen
                </h2>
                {names.map((name, index) => (
                    <motion.div
                        key={index}
                        initial={
                            reduceMotion
                                ? { opacity: 0 }
                                : { opacity: 0, y: 8, scale: 0.98 }
                        }
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{
                            type: 'spring',
                            stiffness: 380,
                            damping: 26,
                        }}
                    >
                        <input
                            value={name}
                            onChange={(event) =>
                                updateName(index, event.target.value)
                            }
                            maxLength={20}
                            aria-label={`Naam van speler ${index + 1}`}
                            className="w-full rounded-xl bg-white/5 px-4 py-3 text-base text-white ring-1 ring-white/10 transition-shadow placeholder:text-slate-500 focus:ring-2 focus:ring-(--glow) focus:outline-none"
                            placeholder={`Speler ${index + 1}`}
                        />
                    </motion.div>
                ))}
            </section>

            <div className="mt-auto pt-2">
                {error && (
                    <p className="mb-3 text-center text-sm text-rose-400">
                        {error}
                    </p>
                )}
                <ActionButton
                    onClick={onStart}
                    disabled={Boolean(error)}
                    className="text-lg"
                >
                    Start het spel
                    <ArrowRight className="size-5" aria-hidden />
                </ActionButton>
            </div>
        </div>
    );
}

function VoteScreen({
    statement,
    voter,
    voterIndex,
    total,
    names,
    onVote,
    onReset,
}: {
    statement: string;
    voter: string;
    voterIndex: number;
    total: number;
    names: string[];
    onVote: (index: number) => void;
    onReset: () => void;
}) {
    const reduceMotion = useReducedMotion();
    const [ready, setReady] = useState(false);
    const [selectedId, setSelectedId] = useState<number | null>(null);

    // Pass-the-phone handoff: hide the secret vote grid until the next voter
    // confirms they have the phone, so nobody sees who came before.
    if (!ready) {
        return (
            <div className="flex flex-1 flex-col">
                <Header
                    label={`Stem ${voterIndex + 1} van ${total}`}
                    onReset={onReset}
                />
                <ProgressDots current={voterIndex} total={total} />

                <PassPhoneGate
                    name={voter}
                    instruction="Geef de telefoon aan"
                    onReady={() => {
                        feel.flip();
                        setReady(true);
                    }}
                >
                    <p className="text-xs text-slate-500">
                        Zorg dat niemand meekijkt met je stem.
                    </p>
                </PassPhoneGate>
            </div>
        );
    }

    return (
        <div className="flex flex-1 flex-col">
            <Header
                label={`Stem ${voterIndex + 1} van ${total}`}
                onReset={onReset}
            />
            <ProgressDots current={voterIndex} total={total} />

            <motion.section
                initial={
                    reduceMotion
                        ? { opacity: 0 }
                        : { opacity: 0, y: 14, scale: 0.92 }
                }
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 320, damping: 22 }}
                className="mb-6 rounded-3xl bg-(--glow)/12 p-6 text-center shadow-[0_0_40px_-10px_var(--glow)] ring-1 ring-(--glow)/25"
            >
                <p className="text-xs font-semibold tracking-widest text-(--glow-strong) uppercase">
                    Stelling
                </p>
                <p className="mt-2 font-display text-2xl leading-snug text-white">
                    {statement}
                </p>
            </motion.section>

            <p className="mb-3 text-center text-sm text-slate-400">
                <span className="font-semibold text-white">{voter}</span>, op
                wie stem jij?
            </p>

            <div className="grid grid-cols-2 gap-3">
                {names.map((name, index) => (
                    <motion.button
                        key={index}
                        type="button"
                        initial={
                            reduceMotion
                                ? { opacity: 0 }
                                : { opacity: 0, y: 10 }
                        }
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                            type: 'spring',
                            stiffness: 380,
                            damping: 26,
                            delay: reduceMotion ? 0 : 0.08 + index * 0.035,
                        }}
                        whileTap={{
                            scale: 0.96,
                            transition: {
                                type: 'spring',
                                stiffness: 500,
                                damping: 25,
                                delay: 0,
                            },
                        }}
                        aria-pressed={selectedId === index}
                        onClick={() => {
                            feel.select();
                            setSelectedId(index);
                        }}
                        className={cn(
                            'min-h-14 rounded-2xl px-4 py-4 text-center text-base font-semibold ring-1 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-(--glow)',
                            selectedId === index
                                ? 'bg-(--glow) text-slate-950 shadow-[0_10px_32px_-12px_var(--glow)] ring-(--glow)'
                                : 'bg-white/5 text-white ring-white/10 hover:bg-white/10',
                        )}
                    >
                        {name}
                    </motion.button>
                ))}
            </div>

            <div className="mt-auto pt-5">
                <ActionButton
                    onClick={() => selectedId !== null && onVote(selectedId)}
                    disabled={selectedId === null}
                    className="text-lg"
                >
                    Stem bevestigen
                    <ArrowRight className="size-5" aria-hidden />
                </ActionButton>
            </div>
        </div>
    );
}

function RevealScreen({
    statement,
    names,
    votes,
    onNext,
    onReset,
}: {
    statement: string;
    names: string[];
    votes: number[];
    onNext: () => void;
    onReset: () => void;
}) {
    const reduceMotion = useReducedMotion();
    const { winners, maxVotes } = tallyVotes(names, votes);
    const ranked = names
        .map((name, index) => ({ name, count: votes[index] }))
        .sort((a, b) => b.count - a.count);

    const verdict =
        winners.length > 2
            ? 'Gelijkspel — allemaal drinken!'
            : winners.length === 2
              ? 'Gelijkspel — allebei drinken!'
              : 'Drinken!';

    return (
        <div className="flex flex-1 flex-col">
            <Header label="Uitslag" onReset={onReset} />

            <p className="mb-6 text-center text-sm text-slate-400 italic">
                “{statement}”
            </p>

            <CelebrationHeader
                icon={Beer}
                tone="win"
                title={
                    winners.length === 1
                        ? `${winners[0]}!`
                        : `${winners.join(' & ')}!`
                }
                subtitle={
                    <span role="status" aria-live="polite">
                        {verdict}
                    </span>
                }
            />

            <div className="mt-8 space-y-2">
                {ranked.map((entry, index) => {
                    const isLeader = entry.count === maxVotes && maxVotes > 0;
                    const fraction = maxVotes > 0 ? entry.count / maxVotes : 0;

                    return (
                        <motion.div
                            key={`${entry.name}-${index}`}
                            initial={
                                reduceMotion
                                    ? { opacity: 0 }
                                    : { opacity: 0, x: -14 }
                            }
                            animate={{ opacity: 1, x: 0 }}
                            transition={{
                                type: 'spring',
                                stiffness: 300,
                                damping: 24,
                                delay: reduceMotion ? 0 : 0.4 + index * 0.07,
                            }}
                            className={cn(
                                'relative overflow-hidden rounded-xl bg-white/[0.045] px-4 py-3 ring-1',
                                isLeader ? 'ring-(--glow)/40' : 'ring-white/10',
                            )}
                        >
                            <motion.span
                                aria-hidden
                                initial={{ width: 0 }}
                                animate={{
                                    width: `${entry.count > 0 ? Math.max(fraction * 100, 8) : 0}%`,
                                }}
                                transition={{
                                    duration: reduceMotion ? 0 : 0.6,
                                    ease: 'easeOut',
                                    delay: reduceMotion
                                        ? 0
                                        : 0.55 + index * 0.07,
                                }}
                                className={cn(
                                    'absolute inset-y-0 left-0',
                                    isLeader
                                        ? 'bg-(--glow)/20'
                                        : 'bg-white/[0.06]',
                                )}
                            />
                            <span className="relative flex items-center justify-between">
                                <span className="flex items-center gap-2 text-base font-medium text-white">
                                    {isLeader && (
                                        <Beer
                                            className="size-4 text-(--glow-strong)"
                                            aria-hidden
                                        />
                                    )}
                                    {entry.name}
                                </span>
                                <span
                                    className={cn(
                                        'text-sm font-bold tabular-nums',
                                        isLeader
                                            ? 'text-(--glow-strong)'
                                            : 'text-slate-400',
                                    )}
                                >
                                    <CountUp
                                        value={entry.count}
                                        duration={0.8}
                                    />{' '}
                                    {entry.count === 1 ? 'stem' : 'stemmen'}
                                </span>
                            </span>
                        </motion.div>
                    );
                })}
            </div>

            <div className="mt-auto pt-6">
                <ActionButton onClick={onNext} className="text-lg">
                    Volgende stelling
                    <ArrowRight className="size-5" aria-hidden />
                </ActionButton>
            </div>
        </div>
    );
}

/** How far the secret ballot is around the table. */
function ProgressDots({ current, total }: { current: number; total: number }) {
    return (
        <div
            aria-hidden
            className="mb-6 flex items-center justify-center gap-1.5"
        >
            {Array.from({ length: total }, (_, index) => (
                <span
                    key={index}
                    className={cn(
                        'h-1.5 rounded-full transition-all duration-300',
                        index < current
                            ? 'w-4 bg-(--glow)'
                            : index === current
                              ? 'w-6 bg-(--glow-strong)'
                              : 'w-1.5 bg-white/15',
                    )}
                />
            ))}
        </div>
    );
}

function Header({ label, onReset }: { label: string; onReset?: () => void }) {
    const [armed, setArmed] = useState(false);

    useEffect(() => {
        if (!armed) {
            return;
        }

        const id = window.setTimeout(() => setArmed(false), 3000);

        return () => window.clearTimeout(id);
    }, [armed]);

    return (
        <div className="mb-5 flex items-center justify-between">
            <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-semibold tracking-wide text-slate-300 uppercase ring-1 ring-white/10">
                {label}
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
                        '-my-2 flex min-h-11 items-center gap-1.5 rounded-full px-2 text-xs transition focus:outline-none focus-visible:ring-2 focus-visible:ring-(--glow)',
                        armed
                            ? 'font-semibold text-rose-400'
                            : 'text-slate-400 hover:text-white',
                    )}
                >
                    <RotateCcw className="size-3.5" aria-hidden />
                    {armed ? 'Zeker weten?' : 'Nieuw spel'}
                </button>
            )}
        </div>
    );
}
