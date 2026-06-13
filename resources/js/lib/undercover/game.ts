import { WORD_PAIRS  } from './words';
import type {WordPair} from './words';

export type Role = 'civilian' | 'undercover' | 'mrwhite';

export interface Player {
    id: number;
    name: string;
    role: Role;
    /** The secret word shown to the player. `null` for Mr. White. */
    word: string | null;
    eliminated: boolean;
}

export interface GameSettings {
    /** Display names, in seating order. Length is the player count. */
    names: string[];
    undercoverCount: number;
    includeMrWhite: boolean;
}

export interface DealResult {
    players: Player[];
    /** The word the Civilians received — used to judge a Mr. White guess. */
    civilianWord: string;
    pair: WordPair;
}

export type Winner = 'civilians' | 'undercover';

/** Inclusive bounds for a playable game. */
export const MIN_PLAYERS = 3;
export const MAX_PLAYERS = 12;

/**
 * Validates a settings object, returning a human-readable error or `null`
 * when the configuration produces a fair, playable game.
 */
export function validateSettings(settings: GameSettings): string | null {
    const total = settings.names.length;

    if (total < MIN_PLAYERS) {
        return `Je hebt minstens ${MIN_PLAYERS} spelers nodig.`;
    }

    if (total > MAX_PLAYERS) {
        return `Je kunt maximaal ${MAX_PLAYERS} spelers hebben.`;
    }

    if (settings.names.some((name) => name.trim() === '')) {
        return 'Elke speler heeft een naam nodig.';
    }

    if (settings.undercoverCount < 1) {
        return 'Je hebt minstens één Undercover nodig.';
    }

    const infiltrators = settings.undercoverCount + (settings.includeMrWhite ? 1 : 0);
    const civilians = total - infiltrators;

    if (civilians <= infiltrators) {
        return 'Er moeten meer Burgers zijn dan Undercover + Mr. White.';
    }

    return null;
}

/** Fisher–Yates shuffle returning a new array. */
function shuffle<T>(items: T[], rng: () => number = Math.random): T[] {
    const copy = [...items];

    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }

    return copy;
}

/**
 * Picks a random word pair and assigns roles and secret words to each player.
 * Roles are shuffled so the seating order gives nothing away.
 */
export function dealRoles(settings: GameSettings, rng: () => number = Math.random): DealResult {
    const pair = WORD_PAIRS[Math.floor(rng() * WORD_PAIRS.length)];

    // Randomise which side of the pair the Civilians get, for variety.
    const flip = rng() < 0.5;
    const civilianWord = flip ? pair.undercover : pair.civilian;
    const undercoverWord = flip ? pair.civilian : pair.undercover;

    const total = settings.names.length;
    const mrWhiteCount = settings.includeMrWhite ? 1 : 0;
    const undercoverCount = settings.undercoverCount;

    const roles: Role[] = [
        ...Array<Role>(undercoverCount).fill('undercover'),
        ...Array<Role>(mrWhiteCount).fill('mrwhite'),
        ...Array<Role>(total - undercoverCount - mrWhiteCount).fill('civilian'),
    ];

    const shuffledRoles = shuffle(roles, rng);

    const players: Player[] = settings.names.map((name, index) => {
        const role = shuffledRoles[index];

        return {
            id: index,
            name: name.trim(),
            role,
            word: role === 'mrwhite' ? null : role === 'undercover' ? undercoverWord : civilianWord,
            eliminated: false,
        };
    });

    return { players, civilianWord, pair };
}

export function alivePlayers(players: Player[]): Player[] {
    return players.filter((player) => !player.eliminated);
}

/**
 * Randomly picks which living player describes their word first this round.
 * Chosen purely at random so the choice leaks nothing about roles.
 */
export function pickStarterId(players: Player[], rng: () => number = Math.random): number {
    const alive = alivePlayers(players);

    return alive[Math.floor(rng() * alive.length)].id;
}

/**
 * Returns the living players in speaking order, beginning with the starter
 * and wrapping around the table.
 */
export function orderFromStarter(players: Player[], starterId: number | null): Player[] {
    const alive = alivePlayers(players);

    if (starterId === null) {
        return alive;
    }

    const startIndex = alive.findIndex((player) => player.id === starterId);

    if (startIndex < 0) {
        return alive;
    }

    return [...alive.slice(startIndex), ...alive.slice(0, startIndex)];
}

/**
 * Determines the winner given the current board, or `null` if the game
 * should continue.
 *
 * - Civilians win once every Undercover and Mr. White is eliminated.
 * - The infiltrators (Undercover + Mr. White) win once they reach numeric
 *   parity with the Civilians.
 *
 * A Mr. White correctly guessing the Civilian word is handled separately by
 * the UI and is not represented here.
 */
export function determineWinner(players: Player[]): Winner | null {
    const alive = alivePlayers(players);
    const civilians = alive.filter((player) => player.role === 'civilian').length;
    const infiltrators = alive.length - civilians;

    if (infiltrators === 0) {
        return 'civilians';
    }

    if (infiltrators >= civilians) {
        return 'undercover';
    }

    return null;
}

/** Normalises a word for forgiving comparison of a Mr. White guess. */
export function normaliseWord(word: string): string {
    return word.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function isMrWhiteGuessCorrect(guess: string, civilianWord: string): boolean {
    return normaliseWord(guess) === normaliseWord(civilianWord);
}

export const ROLE_LABEL: Record<Role, string> = {
    civilian: 'Burger',
    undercover: 'Undercover',
    mrwhite: 'Mr. White',
};
