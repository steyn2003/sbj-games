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

    // ── Feest & drank ───────────────────────────────────────
    'Wie is het laatst nog wakker op een feestje?',
    'Wie danst het wildst na een paar drankjes?',
    'Wie neemt altijd te veel shotjes?',
    'Wie heeft de ergste kater de volgende dag?',
    'Wie staat als eerste op de dansvloer?',
    'Wie regelt de muziek op een feestje?',
    'Wie blijft het langst plakken na sluitingstijd?',
    'Wie kent altijd het beste feestje?',
    'Wie verliest als eerste zijn telefoon op een avond uit?',
    'Wie zou een afterparty organiseren midden in de nacht?',
    'Wie zingt het hardst mee met elk lied?',

    // ── Vrienden & groep ────────────────────────────────────
    'Wie reageert het traagst op appjes?',
    'Wie organiseert alles in de groep?',
    'Wie vergeet het vaakst iemands verjaardag?',
    'Wie leent geld en vergeet het terug te geven?',
    'Wie heeft altijd honger?',
    'Wie kiest altijd het restaurant?',
    'Wie stuurt de meeste memes in de groepsapp?',
    'Wie maakt de meeste plannen die niet doorgaan?',
    'Wie is altijd als laatste klaar met aankleden?',
    'Wie laat anderen het vaakst betalen?',
    'Wie is het vaakst de bemiddelaar bij ruzie?',

    // ── Liefde & dating ─────────────────────────────────────
    'Wie heeft de meeste exen?',
    'Wie flirt zonder het door te hebben?',
    'Wie stuurt als eerste een berichtje na een date?',
    'Wie zou trouwen met een beroemdheid als het kon?',
    'Wie valt altijd op de verkeerde types?',
    'Wie is het meest romantisch?',
    'Wie zou het snelst zijn relatie op social media zetten?',
    'Wie geeft de beste relatieadviezen?',
    'Wie wordt verliefd op vakantie?',
    'Wie kan het slechtst flirten?',

    // ── Karakter ────────────────────────────────────────────
    'Wie is het meest koppig?',
    'Wie is de grootste optimist?',
    'Wie is het meest impulsief?',
    'Wie liegt het overtuigendst?',
    'Wie houdt het langst een wrok vast?',
    'Wie is het meest behulpzaam?',
    'Wie neemt de meeste risico’s?',
    'Wie is het meest perfectionistisch?',
    'Wie blijft het kalmst in een crisis?',
    'Wie kan het beste luisteren?',
    'Wie geeft het snelst op?',
    'Wie is het meest geduldig?',

    // ── Grappig & random ────────────────────────────────────
    'Wie zou per ongeluk in de verkeerde bus stappen?',
    'Wie praat in zijn slaap?',
    'Wie zou tegen een glazen deur lopen?',
    'Wie lacht op de verkeerde momenten?',
    'Wie heeft de gekste zoekgeschiedenis?',
    'Wie zingt onder de douche?',
    'Wie heeft de meeste rare gewoontes?',
    'Wie zou verdwalen in zijn eigen stad?',
    'Wie eet iets dat op de grond is gevallen?',
    'Wie maakt de gekste gezichten op foto’s?',
    'Wie praat het meest tegen dieren?',
    'Wie heeft de meeste onnodige spullen?',

    // ── Hypothetisch ────────────────────────────────────────
    'Wie zou het beste een bank kunnen beroven?',
    'Wie wordt later de strengste ouder?',
    'Wie zou de hoofdrol in een film kunnen spelen?',
    'Wie zou viraal gaan op TikTok?',
    'Wie zou een eigen bedrijf starten?',
    'Wie verhuist later naar het buitenland?',
    'Wie zou meedoen aan een realityshow?',
    'Wie wint ooit de loterij en geeft alles uit?',
    'Wie wordt de eerste die kinderen krijgt?',
    'Wie zou het langst zonder internet kunnen?',
    'Wie wordt later een bekende chef-kok?',
    'Wie zou astronaut willen worden?',

    // ── Social media & modern ───────────────────────────────
    'Wie post het vaakst verhaaltjes?',
    'Wie heeft de meeste volgers?',
    'Wie ghostt mensen het vaakst?',
    'Wie kijkt het langst op zijn telefoon op de wc?',
    'Wie filmt alles voor social media?',
    'Wie heeft de meeste apps op zijn telefoon?',
    'Wie zou influencer kunnen worden?',

    // ── Talenten & dagelijks leven ──────────────────────────
    'Wie kookt het lekkerst?',
    'Wie kan het slechtst koken?',
    'Wie ruimt het minst op?',
    'Wie rijdt het slechtst auto?',
    'Wie zou een quiz over onnozele feitjes winnen?',
    'Wie kan het beste iemand imiteren?',
    'Wie wint elk drankspel?',
    'Wie heeft het netste handschrift?',
    'Wie weet altijd de weg?',
    'Wie zou een dansbattle winnen?',
    'Wie kan het beste een verhaal vertellen?',
    'Wie onthoudt de meeste verjaardagen?',
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
