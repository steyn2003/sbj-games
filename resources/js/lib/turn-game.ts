import type { PersistableState } from '@/lib/use-persisted-game';

/**
 * Shared rules for the timed pass-the-phone guessing games (Verboden Woord,
 * Hints): every player gets a fixed number of turns, each turn is one timer,
 * and every card is dealt at most once per game.
 */

/** Inclusive bounds for the number of players. */
export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 12;

/** Turn lengths offered in setup, in seconds. */
export const TURN_SECONDS_OPTIONS = [30, 60, 90] as const;

/** How many turns each player gets, offered in setup. */
export const ROUNDS_OPTIONS = [2, 3, 4] as const;

export type TurnPhase = 'play' | 'turnover' | 'gameover';

export interface TurnGameState<Card> extends PersistableState {
    phase: TurnPhase;
    names: string[];
    scores: number[];
    seconds: number;
    totalRounds: number;
    round: number;
    currentPlayer: number;
    /** Points the current (or just-finished) player earned this turn. */
    turnScore: number;
    currentCard: Card;
    /**
     * Keys of every card dealt so far in this game, so no word comes up
     * twice. Resets once the whole deck has been played.
     */
    usedWords: string[];
}

/** A card plus the used-word list that now includes it. */
export interface Draw<Card> {
    card: Card;
    usedWords: string[];
}

/**
 * Deals a random card that has not been dealt yet. Once every card has been
 * used the pool starts over (still avoiding the card that was just shown).
 */
export function drawCard<Card>(
    cards: Card[],
    keyOf: (card: Card) => string,
    usedWords: string[],
): Draw<Card> {
    const used = new Set(usedWords);
    let pool = cards.filter((card) => !used.has(keyOf(card)));
    let nextUsed = usedWords;

    if (pool.length === 0) {
        const last = usedWords[usedWords.length - 1];
        pool = cards.filter((card) => keyOf(card) !== last);
        nextUsed = [];

        if (pool.length === 0) {
            pool = cards;
        }
    }

    const card = pool[Math.floor(Math.random() * pool.length)];

    return { card, usedWords: [...nextUsed, keyOf(card)] };
}

/** The used-word list of a saved game, tolerant of games saved before it existed. */
export function usedWordsOf<Card>(
    state: Pick<TurnGameState<Card>, 'usedWords' | 'currentCard'>,
    keyOf: (card: Card) => string,
): string[] {
    if (Array.isArray(state.usedWords)) {
        return state.usedWords;
    }

    return state.currentCard ? [keyOf(state.currentCard)] : [];
}
