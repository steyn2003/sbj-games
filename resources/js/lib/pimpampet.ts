/** Content and helpers for the Pim Pam Pet category-and-letter game. */

export const CATEGORIES: string[] = [
    // ── Algemeen ────────────────────────────────────────────
    'Dieren',
    'Landen',
    'Steden',
    'Jongensnamen',
    'Meisjesnamen',
    'Beroepen',
    'Merken',
    'Films',
    'Sporten',
    'Kleuren',
    'Schoolvakken',
    'Talen',
    'Nationaliteiten',
    'Hobby’s',
    'Emoties',
    'Karaktereigenschappen',
    'Bijnamen',
    'Scheldwoorden (netjes)',

    // ── Dieren & natuur ─────────────────────────────────────
    'Vogels',
    'Insecten',
    'Vissen',
    'Reptielen',
    'Huisdieren',
    'Wilde dieren',
    'Boerderijdieren',
    'Dieren in de zee',
    'Dieren in de jungle',
    'Bloemen of planten',
    'Bomen',
    'Kamerplanten',
    'Groenten',
    'Fruit',
    'Tropisch fruit',
    'Noten',
    'Kruiden en specerijen',
    'Paddenstoelen',
    'Edelstenen',

    // ── Eten & drinken ──────────────────────────────────────
    'Eten',
    'Drankjes',
    'Warme dranken',
    'Cocktails',
    'Frisdranken',
    'Nagerechten',
    'Snacks',
    'Snoep',
    'Soorten brood',
    'Soorten kaas',
    'Pastasoorten',
    'Soorten soep',
    'Sauzen',
    'Pizza’s',
    'Ontbijtproducten',
    'Fastfood',
    'Gerechten uit de wereld',

    // ── Plaatsen & wereld ───────────────────────────────────
    'Steden in Nederland',
    'Wereldsteden',
    'Hoofdsteden',
    'Provincies van Nederland',
    'Belgische steden',
    'Landen in Europa',
    'Landen in Azië',
    'Landen in Afrika',
    'Rivieren',
    'Bergen',
    'Zeeën en oceanen',
    'Eilanden',
    'Vakantiebestemmingen',
    'Bezienswaardigheden',
    'Pretparken',
    'Werelddelen',

    // ── Dingen op een plek ──────────────────────────────────
    'Dingen op het strand',
    'Dingen in de keuken',
    'Dingen in de badkamer',
    'Dingen in de slaapkamer',
    'Dingen in de woonkamer',
    'Dingen in de tuin',
    'Dingen in de garage',
    'Dingen in de supermarkt',
    'Dingen in een kroeg',
    'Dingen in een ziekenhuis',
    'Dingen op school',
    'Dingen in een auto',
    'Dingen op een camping',
    'Dingen op een festival',
    'Dingen in de klas',
    'Dingen op een bureau',
    'Dingen in een rugzak',
    'Dingen in de ruimte',

    // ── Eigenschappen van dingen ────────────────────────────
    'Dingen die rond zijn',
    'Dingen die vliegen',
    'Dingen die drijven',
    'Dingen met wielen',
    'Dingen die licht geven',
    'Dingen die geluid maken',
    'Dingen die je kunt opvouwen',
    'Dingen die nat kunnen worden',
    'Dingen die kapot kunnen',
    'Dingen die plakken',
    'Dingen die je kunt gooien',
    'Dingen die op batterijen werken',

    // ── Spullen & techniek ──────────────────────────────────
    'Kledingstukken',
    'Schoenen',
    'Accessoires',
    'Gereedschap',
    'Muziekinstrumenten',
    'Speelgoed',
    'Kaartspellen',
    'Bordspellen',
    'Videogames',
    'Apps',
    'Sociale media',
    'Vervoersmiddelen',
    'Automerken',
    'Telefoonmerken',
    'Kledingmerken',
    'Supermarkten',

    // ── Mensen & cultuur ────────────────────────────────────
    'Lichaamsdelen',
    'Organen',
    'Artiesten of bands',
    'Bekende Nederlanders',
    'Beroemde acteurs',
    'Beroemde zangers',
    'Beroemde voetballers',
    'YouTubers',
    'Superhelden',
    'Stripfiguren',
    'Tekenfilmfiguren',
    'Disney-films',
    'Sprookjes',
    'Tv-programma’s',
    'Tv-zenders',
    'Musicals',
    'Filmgenres',
    'Muziekgenres',

    // ── Tijd & gelegenheden ─────────────────────────────────
    'Feestdagen',
    'Dingen met kerst',
    'Dingen met Sinterklaas',
    'Dingen op een verjaardag',
    'Dingen in de winter',
    'Dingen in de zomer',
    'Maanden',
    'Sterrenbeelden',
    'Planeten',
    'Weersverschijnselen',
];

/** Letters that comfortably start common Dutch words. */
export const LETTERS: string[] = [
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J',
    'K', 'L', 'M', 'N', 'O', 'P', 'R', 'S', 'T', 'V', 'W', 'Z',
];

/** Picks a random element, optionally avoiding the previous value. */
export function pickRandom(items: string[], avoid?: string): string {
    if (items.length <= 1) {
        return items[0];
    }

    let choice = items[Math.floor(Math.random() * items.length)];

    while (choice === avoid) {
        choice = items[Math.floor(Math.random() * items.length)];
    }

    return choice;
}

export const TURN_SECONDS_OPTIONS = [5, 10, 15] as const;
