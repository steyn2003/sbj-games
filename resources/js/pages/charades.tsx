import { Check, MicOff, SkipForward } from 'lucide-react';
import { TurnGame } from '@/components/turn-game';
import type { TurnGameConfig } from '@/components/turn-game';
import { CARDS } from '@/lib/charades';
import type { CharadesCard } from '@/lib/charades';

const CONFIG: TurnGameConfig<CharadesCard> = {
    type: 'charades',
    title: 'Hints',
    kicker: 'Uitbeelden',
    description:
        'Beeld het woord uit met handen en voeten — geen woorden, geen geluiden. Hoeveel raadt de groep in jouw beurt?',
    accent: 'lime',
    cards: CARDS,
    keyOf: (card) => card.word,
    passInstruction:
        'Houd de telefoon zo dat alleen jij hem ziet. Zeg de categorie hardop, en beeld daarna alles uit zonder één woord.',
    renderCard: (card) => (
        <>
            <p className="text-xs font-semibold tracking-widest text-(--glow-strong) uppercase">
                {card.category}
            </p>
            <h1 className="mt-2 mb-5 font-display text-4xl break-words text-white">
                {card.word}
            </h1>
            <p className="flex items-center justify-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-xs font-semibold tracking-wide text-slate-300 uppercase ring-1 ring-white/10">
                <MicOff
                    className="size-3.5 shrink-0 text-(--glow-strong)"
                    aria-hidden
                />
                Niet praten, niet wijzen
            </p>
        </>
    ),
    actions: [
        {
            label: 'Overslaan',
            icon: SkipForward,
            variant: 'neutral',
            delta: 0,
            kind: 'skip',
        },
        {
            label: 'Geraden',
            icon: Check,
            variant: 'success',
            delta: 1,
            kind: 'good',
        },
    ],
};

export default function Charades() {
    return <TurnGame config={CONFIG} />;
}
