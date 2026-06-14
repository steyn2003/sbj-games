import { useEffect, useRef } from 'react';
import { store, update } from '@/actions/App/Http/Controllers/GameController';

/** The minimum shape a persisted game state must expose. */
export interface PersistableState {
    /** Identifies one game session on the client, across persistence calls. */
    localId: number;
    phase: string;
}

function readCookie(name: string): string | null {
    const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));

    return match ? decodeURIComponent(match[1]) : null;
}

/** Sends a JSON request with the Inertia/Laravel CSRF token attached. */
async function sendJson(url: string, method: string, body: unknown): Promise<{ id: number }> {
    const response = await fetch(url, {
        method,
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-XSRF-TOKEN': readCookie('XSRF-TOKEN') ?? '',
        },
        credentials: 'same-origin',
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
    }

    return response.json();
}

/**
 * Persists every change to a game's state to the server, creating the game on
 * the first save and updating it thereafter. A fresh `localId` starts a new
 * server-side game. Saves are chained so they always apply in order, and a
 * failed save never interrupts local play.
 */
export function usePersistedGame<T extends PersistableState>(
    type: string,
    game: T | null,
    initial: { serverId: number | null; localId: number },
): void {
    const serverIdRef = useRef<number | null>(initial.serverId);
    const lastLocalIdRef = useRef<number>(initial.localId);
    const saveChainRef = useRef<Promise<void>>(Promise.resolve());

    useEffect(() => {
        if (!game) {
            return;
        }

        const isNewGame = game.localId !== lastLocalIdRef.current;

        if (isNewGame) {
            lastLocalIdRef.current = game.localId;
            serverIdRef.current = null;
        }

        const snapshot = game;

        saveChainRef.current = saveChainRef.current
            .then(async () => {
                if (serverIdRef.current === null) {
                    const created = await sendJson(store().url, store().method, { type, state: snapshot });
                    serverIdRef.current = created.id;
                } else {
                    const action = update(serverIdRef.current);
                    await sendJson(action.url, action.method, { state: snapshot });
                }
            })
            .catch(() => {
                // The game keeps working locally even if a save fails.
            });
    }, [game, type]);
}
