/** Statements and helpers for the "Wie in de groep…?" (Most Likely To) game. */

export const STATEMENTS: string[] = [
    'Wie wordt vanavond als eerste dronken?',
    'Wie verslaapt zich het vaakst?',
    'Wie checkt het meest zijn telefoon?',
    'Wie durft het snelst iets geks te doen?',
    'Wie is het vaakst te laat?',
    'Wie kan het slechtst tegen verlies?',
    'Wie geeft het meeste geld uit aan onzin?',
    'Wie zou een week zonder telefoon niet overleven?',
    'Wie lacht het hardst om zijn eigen grappen?',
    'Wie is de grootste flirt?',
    'Wie kan het beste dansen?',
    'Wie zingt vals maar doet het toch?',
    'Wie wordt later miljonair?',
    'Wie belt zijn ouders het vaakst?',
    'Wie eet het meest ongezond?',
    'Wie is het meest dramatisch?',
    'Wie vergeet altijd zijn spullen?',
    'Wie zou beroemd kunnen worden?',
    'Wie neemt de meeste selfies?',
    'Wie zegt het vaakst “nog eentje dan”?',
    'Wie valt als eerste in slaap op een feestje?',
    'Wie is het meest competitief?',
    'Wie heeft de gekste verhalen?',
    'Wie zou alles doen voor een weddenschap?',
    'Wie is het snelst boos?',
    'Wie maakt de slechtste grappen?',
    'Wie kan het langst praten zonder pauze?',
    'Wie is het meest verlegen?',
    'Wie zou het langst overleven op een onbewoond eiland?',
    'Wie raakt het snelst verdwaald?',
    'Wie geeft het vaakst een rondje?',
    'Wie heeft de meeste matches op datingapps?',
    'Wie kan het slechtst een geheim bewaren?',
    'Wie wordt het snelst verliefd?',
    'Wie kan het meest drinken?',
    'Wie doet het vaakst iets doms na een paar biertjes?',
    'Wie is de echte leider van de groep?',
    'Wie zou de zombie-apocalyps overleven?',
    'Wie klaagt het meest?',
    'Wie is altijd in voor een avontuur?',
];

export function pickStatement(avoid?: string): string {
    if (STATEMENTS.length <= 1) {
        return STATEMENTS[0];
    }

    let choice = STATEMENTS[Math.floor(Math.random() * STATEMENTS.length)];

    while (choice === avoid) {
        choice = STATEMENTS[Math.floor(Math.random() * STATEMENTS.length)];
    }

    return choice;
}

export const MIN_PLAYERS = 3;
export const MAX_PLAYERS = 12;

export interface VoteResult {
    /** Names with the most votes (ties included). */
    winners: string[];
    maxVotes: number;
}

/**
 * Tallies votes (an array of vote counts aligned to the player list) and
 * returns the leading player name(s).
 */
export function tallyVotes(names: string[], votes: number[]): VoteResult {
    const maxVotes = Math.max(0, ...votes);
    const winners = names.filter((_, index) => votes[index] === maxVotes && maxVotes > 0);

    return { winners, maxVotes };
}
