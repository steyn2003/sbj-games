import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, Beer, Minus, Plus, Users } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MAX_PLAYERS, MIN_PLAYERS, pickStatement, tallyVotes } from '@/lib/most-likely';
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
        setVotes((current) => current.map((count, index) => (index === targetIndex ? count + 1 : count)));

        if (voterIndex + 1 >= names.length) {
            setPhase('reveal');
        } else {
            setVoterIndex(voterIndex + 1);
        }
    };

    return (
        <>
            <Head title="Wie in de groep…?" />
            <div className="relative flex min-h-[100dvh] flex-col overflow-hidden bg-slate-950 text-slate-100">
                <div className="pointer-events-none absolute -top-32 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-fuchsia-600/25 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-40 -right-24 h-80 w-80 rounded-full bg-amber-500/20 blur-3xl" />
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
                            statement={statement}
                            voter={names[voterIndex]}
                            voterIndex={voterIndex}
                            total={names.length}
                            names={names}
                            onVote={castVote}
                        />
                    )}
                    {phase === 'reveal' && (
                        <RevealScreen
                            statement={statement}
                            names={names}
                            votes={votes}
                            onNext={() => startQuestion(names)}
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
        setNames((current) => current.map((name, i) => (i === index ? value : name)));
    };

    const error = names.some((name) => name.trim() === '') ? 'Elke speler heeft een naam nodig.' : null;

    return (
        <div className="flex flex-1 flex-col">
            <div className="mb-2">
                <Link
                    href={dashboard()}
                    className="inline-flex items-center gap-1 text-sm text-slate-400 transition hover:text-slate-200"
                >
                    <ArrowLeft className="size-4" /> Dashboard
                </Link>
            </div>

            <header className="mb-6 text-center">
                <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-amber-400/15 px-3 py-1 text-xs font-bold tracking-widest text-amber-300 uppercase ring-1 ring-amber-400/30">
                    <Beer className="size-3.5" /> Pim Pam Pet
                </span>
                <h1 className="bg-gradient-to-br from-white via-fuchsia-200 to-amber-200 bg-clip-text text-4xl font-black tracking-tight text-transparent">
                    Wie in de groep…?
                </h1>
                <p className="mt-2 text-sm text-slate-400">
                    Een stelling verschijnt. Geef de telefoon rond — iedereen stemt stiekem op wie het het beste past.
                    Daarna onthullen we de winnaar!
                </p>
            </header>

            <section className="mb-5 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
                <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm font-medium">
                        <Users className="size-4" /> Spelers
                    </span>
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setPlayerCount(names.length - 1)}
                            disabled={names.length <= MIN_PLAYERS}
                            className="flex size-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 disabled:opacity-30"
                        >
                            <Minus className="size-4" />
                        </button>
                        <span className="w-6 text-center text-lg font-bold tabular-nums">{names.length}</span>
                        <button
                            type="button"
                            onClick={() => setPlayerCount(names.length + 1)}
                            disabled={names.length >= MAX_PLAYERS}
                            className="flex size-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 disabled:opacity-30"
                        >
                            <Plus className="size-4" />
                        </button>
                    </div>
                </div>
            </section>

            <section className="mb-5 space-y-2">
                <h2 className="px-1 text-xs font-semibold tracking-wide text-slate-400 uppercase">Namen</h2>
                {names.map((name, index) => (
                    <input
                        key={index}
                        value={name}
                        onChange={(event) => updateName(index, event.target.value)}
                        maxLength={20}
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-base text-white placeholder:text-slate-500 focus:border-amber-400 focus:ring-2 focus:ring-amber-500/40 focus:outline-none"
                        placeholder={`Speler ${index + 1}`}
                    />
                ))}
            </section>

            <div className="mt-auto pt-2">
                {error && <p className="mb-3 text-center text-sm text-rose-400">{error}</p>}
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
}: {
    statement: string;
    voter: string;
    voterIndex: number;
    total: number;
    names: string[];
    onVote: (index: number) => void;
}) {
    return (
        <div className="flex flex-1 flex-col">
            <p className="mb-4 text-center text-xs font-semibold tracking-widest text-amber-300 uppercase">
                Stem {voterIndex + 1} van {total}
            </p>

            <div className="mb-5 rounded-2xl bg-white/5 p-5 text-center ring-1 ring-white/10">
                <p className="text-xl font-bold text-white">{statement}</p>
            </div>

            <p className="mb-3 text-center text-sm text-slate-400">
                <span className="font-semibold text-white">{voter}</span>, op wie stem jij?
            </p>

            <div className="grid grid-cols-2 gap-3">
                {names.map((name, index) => (
                    <button
                        key={index}
                        type="button"
                        onClick={() => onVote(index)}
                        className="rounded-2xl bg-white/5 px-4 py-5 text-center text-base font-semibold text-white ring-1 ring-white/10 transition hover:bg-white/10 active:scale-[0.98]"
                    >
                        {name}
                    </button>
                ))}
            </div>

            <p className="mt-auto pt-4 text-center text-xs text-slate-500">Tik en geef de telefoon door</p>
        </div>
    );
}

function RevealScreen({
    statement,
    names,
    votes,
    onNext,
}: {
    statement: string;
    names: string[];
    votes: number[];
    onNext: () => void;
}) {
    const { winners, maxVotes } = tallyVotes(names, votes);
    const ranked = names
        .map((name, index) => ({ name, count: votes[index] }))
        .sort((a, b) => b.count - a.count);

    return (
        <div className="flex flex-1 flex-col">
            <div className="mb-5 rounded-2xl bg-white/5 p-5 text-center ring-1 ring-white/10">
                <p className="text-lg font-semibold text-white">{statement}</p>
            </div>

            <div className="mb-6 text-center">
                <span className="text-5xl">🍺</span>
                <h1 className="mt-2 text-2xl font-black text-white">
                    {winners.length === 1 ? `${winners[0]}!` : winners.join(' & ') + '!'}
                </h1>
                <p className="mt-1 text-sm text-slate-400">
                    {winners.length > 1 ? 'Gelijkspel — allebei drinken!' : 'Drinken! 🍻'}
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
                                : 'bg-white/5 ring-white/10',
                        )}
                    >
                        <span className="text-base font-medium text-white">{entry.name}</span>
                        <span className="text-sm font-bold tabular-nums text-amber-300">
                            {entry.count} {entry.count === 1 ? 'stem' : 'stemmen'}
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
