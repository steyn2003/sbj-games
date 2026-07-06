/** Dice, ranking and helpers for Mexen (a.k.a. Mexicano / Mäxchen). */

export type DiePair = [number, number];

export interface Call {
    /** Canonical two-digit code, e.g. 53, 66, 21 (Mäx). */
    code: number;
    /** Higher rank beats lower rank. */
    rank: number;
    /** Short label for the announcement, e.g. "53", "66", "Mex". */
    label: string;
    /** True for the unbeatable 2-1 roll. */
    isMax: boolean;
    /** True for a double (11, 22, … 66). */
    isDouble: boolean;
}

const NON_DOUBLES = [31, 32, 41, 42, 43, 51, 52, 53, 54, 61, 62, 63, 64, 65];
const DOUBLES = [11, 22, 33, 44, 55, 66];

/** Turns a canonical code into a fully described {@link Call}. */
function makeCall(code: number): Call {
    if (code === 21) {
        return { code, rank: 999, label: 'Mex', isMax: true, isDouble: false };
    }

    const high = Math.floor(code / 10);
    const low = code % 10;

    if (high === low) {
        return {
            code,
            rank: 100 + high,
            label: String(code),
            isMax: false,
            isDouble: true,
        };
    }

    return {
        code,
        rank: code,
        label: String(code),
        isMax: false,
        isDouble: false,
    };
}

/** Every possible announcement, ascending from weakest (31) to strongest (Mäx). */
export const CALLS: Call[] = [...NON_DOUBLES, ...DOUBLES, 21].map(makeCall);

/** Rolls two dice, each 1-6. */
export function rollDice(): DiePair {
    return [1 + Math.floor(Math.random() * 6), 1 + Math.floor(Math.random() * 6)];
}

/** The {@link Call} a physical roll actually represents. */
export function callForRoll([a, b]: DiePair): Call {
    const high = Math.max(a, b);
    const low = Math.min(a, b);

    if (high === 2 && low === 1) {
        return makeCall(21);
    }

    return makeCall(high * 10 + low);
}

/** All calls that beat the given rank, weakest first. Pass 0 for a fresh round. */
export function callsAbove(rank: number): Call[] {
    return CALLS.filter((call) => call.rank > rank);
}
