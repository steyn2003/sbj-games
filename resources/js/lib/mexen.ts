/** Dice, ranking and helpers for Mexen (a.k.a. Mexicano / Mäxchen). */

export type DiePair = [number, number];

export interface Call {
    /** Canonical two-digit code, e.g. 53, 66, 21 (Mäx). */
    code: number;
    /** Higher rank beats lower rank. */
    rank: number;
    /** Short label for the announcement, e.g. "53", "600", "Mex". */
    label: string;
    /** True for the unbeatable 2-1 roll. */
    isMax: boolean;
    /** True for a double (11, 22, … 66). */
    isDouble: boolean;
}

export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 12;

/** Every round starts with up to this many throws for the opening player. */
export const MAX_THROWS = 3;

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
        // Doubles count as hundreds in Mexen: 3-3 is "300", not "33".
        return {
            code,
            rank: 100 + high,
            label: `${high}00`,
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
    return [
        1 + Math.floor(Math.random() * 6),
        1 + Math.floor(Math.random() * 6),
    ];
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

export interface RoundOutcome {
    /** Indices of the players sharing the lowest call — they all drink. */
    loserIndices: number[];
    /** Sips for the losers: 1, doubled for every Mex on the table. */
    sips: number;
}

/** Judges an open round of Normaal Mexen: lowest call drinks, Mexen double. */
export function judgeRound(calls: Call[]): RoundOutcome {
    const lowestRank = Math.min(...calls.map((call) => call.rank));
    const mexCount = calls.filter((call) => call.isMax).length;

    return {
        loserIndices: calls.flatMap((call, index) =>
            call.rank === lowestRank ? [index] : [],
        ),
        sips: 2 ** mexCount,
    };
}
