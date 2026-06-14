/** Content and helpers for the Spy Location (Spyfall-style) game. */

export interface SpyPlayer {
    id: number;
    name: string;
    /** The Spy receives no location and must blend in. */
    isSpy: boolean;
}

export interface SpySettings {
    /** Display names, in seating order. Length is the player count. */
    names: string[];
    spyCount: number;
}

export type SpyWinner = 'players' | 'spy';

export interface SpyDealResult {
    players: SpyPlayer[];
    location: string;
}

/** Inclusive bounds for a playable game. */
export const MIN_PLAYERS = 3;
export const MAX_PLAYERS = 12;

/** Discussion lengths offered in setup, in minutes. */
export const TIMER_MINUTES_OPTIONS = [3, 5, 8] as const;

/** Possible secret locations. Shown to everyone so the Spy can bluff and guess. */
export const LOCATIONS: string[] = [
    'Vliegtuig',
    'Ziekenhuis',
    'School',
    'Strand',
    'Casino',
    'Restaurant',
    'Voetbalstadion',
    'Politiebureau',
    'Bioscoop',
    'Supermarkt',
    'Zwembad',
    'Hotel',
    'Cruiseschip',
    'Pretpark',
    'Bank',
    'Museum',
    'Nachtclub',
    'Tandarts',
    'Boerderij',
    'Trein',
    'Luchthaven',
    'Kerk',
    'Sportschool',
    'Dierentuin',
    'Universiteit',
    'Bibliotheek',
    'Theater',
    'Circus',
    'Camping',
    'Skigebied',
    'Jacht',
    'Onderzeeër',
    'Ruimtestation',
    'Brandweerkazerne',
    'Gevangenis',
    'Rechtbank',
    'Kasteel',
    'Klooster',
    'Tempel',
    'Begraafplaats',
    'Speeltuin',
    'Bakkerij',
    'Slagerij',
    'Markt',
    'Winkelcentrum',
    'Benzinestation',
    'Parkeergarage',
    'Metrostation',
    'Haven',
    'Vuurtoren',
    'Boorplatform',
    'Fabriek',
    'Kantoor',
    'Tv-studio',
    'Concertzaal',
    'Bowlingbaan',
    'Kartbaan',
    'Sauna',
    'Kapsalon',
    'Schoonheidssalon',
    'Apotheek',
    'Wijngaard',
    'Brouwerij',
    'Aquarium',
    'Planetarium',
    'Safaripark',
    'Veerboot',
    'Strandtent',
];

/**
 * Validates a settings object, returning a human-readable error or `null`
 * when the configuration produces a fair, playable game.
 */
export function validateSettings(settings: SpySettings): string | null {
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

    if (settings.spyCount < 1) {
        return 'Je hebt minstens één Spion nodig.';
    }

    if (settings.spyCount >= total - 1) {
        return 'Er moeten meer gewone spelers dan Spionnen zijn.';
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

/** Picks a random location, optionally avoiding the previous one. */
export function pickLocation(avoid?: string, rng: () => number = Math.random): string {
    let choice = LOCATIONS[Math.floor(rng() * LOCATIONS.length)];

    while (choice === avoid) {
        choice = LOCATIONS[Math.floor(rng() * LOCATIONS.length)];
    }

    return choice;
}

/**
 * Picks a random location and secretly assigns the Spy roles. Roles are
 * shuffled so the seating order gives nothing away.
 */
export function dealSpyLocation(settings: SpySettings, rng: () => number = Math.random): SpyDealResult {
    const location = pickLocation(undefined, rng);

    const flags: boolean[] = [
        ...Array<boolean>(settings.spyCount).fill(true),
        ...Array<boolean>(settings.names.length - settings.spyCount).fill(false),
    ];

    const shuffled = shuffle(flags, rng);

    const players: SpyPlayer[] = settings.names.map((name, index) => ({
        id: index,
        name: name.trim(),
        isSpy: shuffled[index],
    }));

    return { players, location };
}

export function spies(players: SpyPlayer[]): SpyPlayer[] {
    return players.filter((player) => player.isSpy);
}

/** Forgiving comparison of a Spy's location guess. */
export function isLocationGuessCorrect(guess: string, location: string): boolean {
    return guess.trim().toLowerCase() === location.trim().toLowerCase();
}
