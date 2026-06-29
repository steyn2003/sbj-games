import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    ArrowRight,
    Beer,
    Minus,
    Plus,
    RotateCcw,
    Users,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    MAX_PLAYERS,
    MIN_PLAYERS,
    pickStatement,
    tallyVotes,
} from '@/lib/most-likely';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';

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
        <>
            <Head title="Wie in de groep…?" />
            <div className="relative flex min-h-[100dvh] flex-col overflow-hidden bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
                <div className="pointer-events-none absolute -top-32 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-indigo-300/40 blur-3xl dark:bg-indigo-600/30" />
                <div className="pointer-events-none absolute -right-24 -bottom-40 h-80 w-80 rounded-full bg-amber-300/40 blur-3xl dark:bg-amber-500/20" />
                <main className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
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
                </main>
            </div>
        </>
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
            <div className="mb-2">
                <Link
                    href={dashboard()}
                    className="inline-flex items-center gap-1 text-sm text-slate-500 transition hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                >
                    <ArrowLeft className="size-4" /> Dashboard
                </Link>
            </div>

            <header className="mb-6 text-center">
                <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-amber-400/15 px-3 py-1 text-xs font-bold tracking-widest text-amber-700 uppercase ring-1 ring-amber-400/30 dark:text-amber-300">
                    <Beer className="size-3.5" /> Pim Pam Pet
                </span>
                <h1 className="bg-gradient-to-br from-slate-900 via-amber-700 to-amber-500 bg-clip-text text-5xl font-black tracking-tight text-transparent dark:from-white dark:via-amber-100 dark:to-amber-300">
                    Wie in de groep…?
                </h1>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    Een stelling verschijnt. Geef de telefoon rond — iedereen
                    stemt stiekem op wie het het beste past. Daarna onthullen we
                    de winnaar!
                </p>
            </header>

            <section className="mb-5 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-white/5 dark:shadow-none dark:ring-white/10">
                <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm font-medium">
                        <Users className="size-4" /> Spelers
                    </span>
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setPlayerCount(names.length - 1)}
                            disabled={names.length <= MIN_PLAYERS}
                            className="flex size-9 items-center justify-center rounded-full bg-slate-100 text-slate-900 transition hover:bg-slate-200 focus-visible:ring-2 focus-visible:ring-amber-400/60 focus-visible:outline-none disabled:opacity-30 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
                        >
                            <Minus className="size-4" />
                        </button>
                        <span className="w-6 text-center text-lg font-bold tabular-nums">
                            {names.length}
                        </span>
                        <button
                            type="button"
                            onClick={() => setPlayerCount(names.length + 1)}
                            disabled={names.length >= MAX_PLAYERS}
                            className="flex size-9 items-center justify-center rounded-full bg-slate-100 text-slate-900 transition hover:bg-slate-200 focus-visible:ring-2 focus-visible:ring-amber-400/60 focus-visible:outline-none disabled:opacity-30 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
                        >
                            <Plus className="size-4" />
                        </button>
                    </div>
                </div>
            </section>

            <section className="mb-5 space-y-2">
                <h2 className="px-1 text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
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
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-500/40 focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-500"
                        placeholder={`Speler ${index + 1}`}
                    />
                ))}
            </section>

            <div className="mt-auto pt-2">
                {error && (
                    <p className="mb-3 text-center text-sm text-rose-600 dark:text-rose-400">
                        {error}
                    </p>
                )}
                <Button
                    onClick={onStart}
                    disabled={Boolean(error)}
                    className="h-14 w-full rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-lg font-bold text-white shadow-lg shadow-amber-900/40 hover:from-amber-400 hover:to-orange-400"
                >
                    Start
                    <ArrowRight className="size-5" />
                </Button>
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

                <div className="flex flex-1 flex-col items-center justify-center">
                    <button
                        type="button"
                        onClick={() => setReady(true)}
                        className="flex aspect-[3/4] w-full max-w-xs flex-col items-center justify-center gap-4 rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-700 p-6 text-center shadow-2xl ring-1 ring-white/20 transition focus-visible:ring-2 focus-visible:ring-amber-400/60 focus-visible:outline-none active:scale-[0.98]"
                    >
                        <span className="text-2xl font-bold text-white">
                            {voter}, jij bent
                        </span>
                        <span className="flex items-center gap-2 rounded-full bg-black/20 px-4 py-2 text-sm text-white/90">
                            <Beer className="size-4" /> Tik als je de telefoon
                            hebt
                        </span>
                        <span className="text-xs text-white/70">
                            Zorg dat niemand meekijkt met je stem
                        </span>
                    </button>
                </div>

                <p className="mt-auto pt-4 text-center text-sm text-slate-400 dark:text-slate-500">
                    Geef de telefoon aan {voter}
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-1 flex-col">
            <Header
                label={`Stem ${voterIndex + 1} van ${total}`}
                onReset={onReset}
            />

            <div className="mb-5 rounded-2xl bg-white p-5 text-center shadow-sm ring-1 ring-slate-200 dark:bg-white/5 dark:shadow-none dark:ring-white/10">
                <p className="text-xl font-bold text-slate-900 dark:text-white">
                    {statement}
                </p>
            </div>

            <p className="mb-3 text-center text-sm text-slate-500 dark:text-slate-400">
                <span className="font-semibold text-slate-900 dark:text-white">
                    {voter}
                </span>
                , op wie stem jij?
            </p>

            <div className="grid grid-cols-2 gap-3">
                {names.map((name, index) => (
                    <button
                        key={index}
                        type="button"
                        onClick={() => setSelectedId(index)}
                        className={cn(
                            'rounded-2xl px-4 py-5 text-center text-base font-semibold ring-1 transition focus-visible:ring-2 focus-visible:ring-amber-400/60 focus-visible:outline-none active:scale-[0.98]',
                            selectedId === index
                                ? 'bg-amber-500 text-white ring-amber-300'
                                : 'bg-white text-slate-900 shadow-sm ring-slate-200 hover:bg-slate-200 dark:bg-white/5 dark:text-white dark:shadow-none dark:ring-white/10 dark:hover:bg-white/10',
                        )}
                    >
                        {name}
                    </button>
                ))}
            </div>

            <div className="mt-auto pt-4">
                <Button
                    onClick={() => selectedId !== null && onVote(selectedId)}
                    disabled={selectedId === null}
                    className="h-14 w-full rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-lg font-bold text-white hover:from-amber-400 hover:to-orange-400"
                >
                    Stem bevestigen
                    <ArrowRight className="size-5" />
                </Button>
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
    const { winners, maxVotes } = tallyVotes(names, votes);
    const ranked = names
        .map((name, index) => ({ name, count: votes[index] }))
        .sort((a, b) => b.count - a.count);

    return (
        <div className="flex flex-1 flex-col">
            <Header label="Uitslag" onReset={onReset} />

            <div className="mb-5 rounded-2xl bg-white p-5 text-center shadow-sm ring-1 ring-slate-200 dark:bg-white/5 dark:shadow-none dark:ring-white/10">
                <p className="text-xl font-bold text-slate-900 dark:text-white">
                    {statement}
                </p>
            </div>

            <div className="mb-6 text-center">
                <Beer className="mx-auto size-12 text-amber-500 dark:text-amber-400" />
                <h1 className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
                    {winners.length === 1
                        ? `${winners[0]}!`
                        : winners.join(' & ') + '!'}
                </h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {winners.length > 1
                        ? 'Gelijkspel — allebei drinken!'
                        : 'Drinken!'}
                </p>
            </div>

            <div className="space-y-2">
                {ranked.map((entry) => (
                    <div
                        key={entry.name}
                        className={cn(
                            'flex items-center justify-between rounded-xl px-4 py-3 ring-1',
                            entry.count === maxVotes && maxVotes > 0
                                ? 'bg-amber-500/15 ring-amber-400/40'
                                : 'bg-white shadow-sm ring-slate-200 dark:bg-white/5 dark:shadow-none dark:ring-white/10',
                        )}
                    >
                        <span className="flex items-center gap-2 text-base font-medium text-slate-900 dark:text-white">
                            {entry.count === maxVotes && maxVotes > 0 && (
                                <Beer className="size-4 text-amber-600 dark:text-amber-300" />
                            )}
                            {entry.name}
                        </span>
                        <span className="text-sm font-bold text-amber-600 tabular-nums dark:text-amber-300">
                            {entry.count}{' '}
                            {entry.count === 1 ? 'stem' : 'stemmen'}
                        </span>
                    </div>
                ))}
            </div>

            <div className="mt-auto pt-6">
                <Button
                    onClick={onNext}
                    className="h-14 w-full rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-lg font-bold text-white hover:from-amber-400 hover:to-orange-400"
                >
                    Volgende vraag
                    <ArrowRight className="size-5" />
                </Button>
            </div>
        </div>
    );
}

function Header({ label, onReset }: { label: string; onReset?: () => void }) {
    return (
        <div className="mb-5 flex items-center justify-between">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold tracking-wide text-slate-600 uppercase dark:bg-white/10 dark:text-slate-300">
                {label}
            </span>
            {onReset && (
                <button
                    type="button"
                    onClick={onReset}
                    className="flex items-center gap-1 text-xs text-slate-500 transition hover:text-slate-800 focus-visible:ring-2 focus-visible:ring-amber-400/60 focus-visible:outline-none dark:text-slate-400 dark:hover:text-slate-200"
                >
                    <RotateCcw className="size-3.5" /> Nieuw spel
                </button>
            )}
        </div>
    );
}
