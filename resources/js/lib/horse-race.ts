/**
 * Horse Race (Kentucky Derby) — the dealer phone owns all of this logic and
 * pushes the resulting state to the server; the board phone only renders it.
 */

export type Suit = 'hearts' | 'spades' | 'clubs' | 'diamonds';

export interface SuitInfo {
    key: Suit;
    symbol: string;
    label: string;
    /** Tailwind text colour for the pip. */
    color: string;
}

export const SUITS: SuitInfo[] = [
    { key: 'hearts', symbol: '♥', label: 'Harten', color: 'text-red-500' },
    { key: 'spades', symbol: '♠', label: 'Schoppen', color: 'text-foreground' },
    { key: 'clubs', symbol: '♣', label: 'Klaveren', color: 'text-foreground' },
    { key: 'diamonds', symbol: '♦', label: 'Ruiten', color: 'text-red-500' },
];

export const SUIT_KEYS: Suit[] = SUITS.map((s) => s.key);

export function suitInfo(key: Suit): SuitInfo {
    return SUITS.find((s) => s.key === key)!;
}

/** Steps a horse must take to win. Backfires sit on the even rows in between. */
export const TRACK_LENGTH = 7;

const BACKFIRE_ROWS = [2, 4, 6];

export interface Bet {
    id: number;
    player: string;
    suit: Suit;
    sips: number;
}

export interface Backfire {
    row: number;
    suit: Suit;
    revealed: boolean;
}

export interface RaceState {
    phase: 'lobby' | 'betting' | 'racing' | 'finished';
    positions: Record<Suit, number>;
    backfires: Backfire[];
    bets: Bet[];
    /** Remaining suits to draw, shuffled. */
    deck: Suit[];
    /** Last card the dealer flipped, for the board to flash. */
    drawn: Suit | null;
    /** Human-readable note about the last step (e.g. a backfire). */
    lastEvent: string | null;
    winner: Suit | null;
}

function shuffle<T>(items: T[]): T[] {
    const copy = [...items];

    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }

    return copy;
}

/** 48 cards: 12 of each suit (the four aces are the horses, not in the deck). */
function buildDeck(): Suit[] {
    return shuffle(SUIT_KEYS.flatMap((suit) => Array<Suit>(12).fill(suit)));
}

function randomSuit(): Suit {
    return SUIT_KEYS[Math.floor(Math.random() * SUIT_KEYS.length)];
}

/** A fresh race ready for the first flip, keeping the bets already placed. */
export function startRace(bets: Bet[]): RaceState {
    return {
        phase: 'racing',
        positions: { hearts: 0, spades: 0, clubs: 0, diamonds: 0 },
        backfires: BACKFIRE_ROWS.map((row) => ({ row, suit: randomSuit(), revealed: false })),
        bets,
        deck: buildDeck(),
        drawn: null,
        lastEvent: null,
        winner: null,
    };
}

/**
 * Flip one card: the drawn suit steps forward, then any backfire row every
 * horse has now passed flips and sets its suit back one. First to the finish
 * line wins.
 */
export function flip(state: RaceState): RaceState {
    if (state.phase !== 'racing') {
        return state;
    }

    const deck = state.deck.length > 0 ? [...state.deck] : buildDeck();
    const drawn = deck.pop()!;

    const positions = { ...state.positions };
    positions[drawn] = Math.min(TRACK_LENGTH, positions[drawn] + 1);

    let lastEvent: string | null = null;
    const backfires = state.backfires.map((b) => ({ ...b }));
    const passedAll = Math.min(...SUIT_KEYS.map((s) => positions[s]));

    for (const backfire of backfires) {
        if (!backfire.revealed && passedAll >= backfire.row) {
            backfire.revealed = true;
            positions[backfire.suit] = Math.max(0, positions[backfire.suit] - 1);
            lastEvent = `${suitInfo(backfire.suit).symbol} ${suitInfo(backfire.suit).label} stapt terug! (backfire)`;
        }
    }

    const winner = SUIT_KEYS.find((s) => positions[s] >= TRACK_LENGTH) ?? null;

    return {
        ...state,
        positions,
        backfires,
        deck,
        drawn,
        lastEvent,
        winner,
        phase: winner ? 'finished' : 'racing',
    };
}

export interface Outcome {
    bet: Bet;
    won: boolean;
    /** Sips to hand out (winner) or to drink yourself (loser). */
    sips: number;
}

/** Winning bets hand out double; losing bets drink their own stake. */
export function outcomes(state: RaceState): Outcome[] {
    return state.bets.map((bet) => {
        const won = bet.suit === state.winner;

        return { bet, won, sips: won ? bet.sips * 2 : bet.sips };
    });
}
