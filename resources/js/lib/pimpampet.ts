/** Content and helpers for the Pim Pam Pet category-and-letter game. */

export const CATEGORIES: string[] = [
    'Dieren',
    'Landen',
    'Steden',
    'Jongensnamen',
    'Meisjesnamen',
    'Eten',
    'Drankjes',
    'Beroepen',
    'Merken',
    'Films',
    'Sporten',
    'Kleuren',
    'Automerken',
    'Artiesten of bands',
    'Groenten',
    'Fruit',
    'Kledingstukken',
    'Dingen op het strand',
    'Tv-programma’s',
    'Steden in Nederland',
    'Dingen in de keuken',
    'Lichaamsdelen',
    'Dieren in de zee',
    'Dingen in de supermarkt',
    'Bekende Nederlanders',
    'Vakantiebestemmingen',
    'Dingen in een kroeg',
    'Schoolvakken',
    'Bordspellen',
    'Bloemen of planten',
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
