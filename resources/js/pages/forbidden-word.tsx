import { Ban, Check, X } from 'lucide-react';
import { TurnGame } from '@/components/turn-game';
import type { TurnGameConfig } from '@/components/turn-game';
import { CARDS } from '@/lib/forbidden-word';
import type { ForbiddenCard } from '@/lib/forbidden-word';

const CONFIG: TurnGameConfig<ForbiddenCard> = {
    type: 'forbidden-word',
    title: 'Verboden Woord',
    kicker: 'Raadspel',
    description:
        'Laat de groep het woord raden — maar gebruik nooit de verboden woorden. Hoeveel punten haal je in jouw beurt?',
    accent: 'rose',
    cards: CARDS,
    keyOf: (card) => card.word,
    passInstruction:
        'Houd de telefoon zo dat alleen jij hem ziet. Laat de groep het woord raden zonder de verboden woorden te zeggen.',
    renderCard: (card) => (
        <>
            <p className="text-xs font-semibold tracking-widest text-(--glow-strong) uppercase">
                Jouw woord
            </p>
            <h1 className="mt-2 mb-5 font-display text-4xl break-words text-white">
                {card.word}
            </h1>
            <p className="mb-2 flex items-center justify-center gap-1.5 text-xs font-bold tracking-widest text-rose-400 uppercase">
                <Ban className="size-3.5" aria-hidden /> Verboden
            </p>
            <ul className="space-y-1.5">
                {card.forbidden.map((word) => (
                    <li
                        key={word}
                        className="flex items-center justify-center gap-2 rounded-xl bg-rose-500/10 px-3 py-2 ring-1 ring-rose-500/25"
                    >
                        <Ban
                            className="size-3.5 shrink-0 text-rose-400"
                            aria-hidden
                        />
                        <span className="text-base font-semibold text-rose-100">
                            {word}
                        </span>
                    </li>
                ))}
            </ul>
        </>
    ),
    actions: [
        { label: 'Fout', icon: X, variant: 'danger', delta: -1, kind: 'foul' },
        {
            label: 'Goed',
            icon: Check,
            variant: 'success',
            delta: 1,
            kind: 'good',
        },
    ],
};

export default function ForbiddenWord() {
    return <TurnGame config={CONFIG} />;
}
