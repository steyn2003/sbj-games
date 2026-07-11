import { useSyncExternalStore } from 'react';

/**
 * Sound + haptics for the game suite. All audio is synthesized with the
 * WebAudio API — no assets, nothing to load. Every sound is triggered from a
 * user gesture (tap handlers), which satisfies autoplay policies. Muting is
 * persisted in localStorage and applies suite-wide.
 */

const MUTE_KEY = 'sfx-muted';

let context: AudioContext | null = null;
const listeners = new Set<() => void>();

function isMuted(): boolean {
    if (typeof localStorage === 'undefined') {
        return true;
    }

    return localStorage.getItem(MUTE_KEY) === '1';
}

function setMuted(muted: boolean): void {
    localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
    listeners.forEach((listener) => listener());
}

function audio(): AudioContext | null {
    if (typeof window === 'undefined' || isMuted()) {
        return null;
    }

    try {
        context ??= new AudioContext();

        if (context.state === 'suspended') {
            void context.resume();
        }

        return context;
    } catch {
        return null;
    }
}

interface Note {
    frequency: number;
    /** Seconds after now the note starts. */
    at?: number;
    duration?: number;
    type?: OscillatorType;
    volume?: number;
}

function play(notes: Note[]): void {
    const ctx = audio();

    if (!ctx) {
        return;
    }

    for (const note of notes) {
        const start = ctx.currentTime + (note.at ?? 0);
        const duration = note.duration ?? 0.09;
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();

        oscillator.type = note.type ?? 'triangle';
        oscillator.frequency.setValueAtTime(note.frequency, start);
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(
            note.volume ?? 0.08,
            start + 0.012,
        );
        gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
        oscillator.connect(gain).connect(ctx.destination);
        oscillator.start(start);
        oscillator.stop(start + duration + 0.05);
    }
}

function vibrate(pattern: number | number[]): void {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
            navigator.vibrate(pattern);
        } catch {
            // Haptics are decoration; never let them break a tap.
        }
    }
}

/**
 * Semantic feedback events. Call from tap handlers — each one pairs a short
 * synthesized sound with a matching haptic. Safe to call anywhere, any time.
 */
export const feel = {
    /** Primary action tapped (roll, start, confirm). */
    tap(): void {
        vibrate(12);
        play([
            { frequency: 660, duration: 0.06, type: 'square', volume: 0.035 },
        ]);
    },

    /** Secondary selection (picking an option, stepper). */
    select(): void {
        vibrate(8);
        play([
            { frequency: 520, duration: 0.045, type: 'sine', volume: 0.045 },
        ]);
    },

    /** A card flips / a secret is revealed. */
    flip(): void {
        vibrate(18);
        play([
            { frequency: 420, duration: 0.07, type: 'triangle', volume: 0.06 },
            {
                frequency: 640,
                at: 0.06,
                duration: 0.09,
                type: 'triangle',
                volume: 0.06,
            },
        ]);
    },

    /** Suspense tick (dice tumbling, countdown final seconds). */
    tick(): void {
        play([
            { frequency: 1100, duration: 0.025, type: 'square', volume: 0.02 },
        ]);
    },

    /** Something good happened. */
    success(): void {
        vibrate([18, 40, 24]);
        play([
            { frequency: 659, duration: 0.1, volume: 0.07 },
            { frequency: 880, at: 0.09, duration: 0.16, volume: 0.07 },
        ]);
    },

    /** Something bad happened (busted, foul, time up). */
    fail(): void {
        vibrate([50, 40, 70]);
        play([
            { frequency: 330, duration: 0.12, type: 'sawtooth', volume: 0.045 },
            {
                frequency: 233,
                at: 0.11,
                duration: 0.22,
                type: 'sawtooth',
                volume: 0.045,
            },
        ]);
    },

    /** The big one: a winner, a MEX, a jackpot. */
    win(): void {
        vibrate([24, 40, 24, 40, 90]);
        play([
            { frequency: 523, duration: 0.1, volume: 0.075 },
            { frequency: 659, at: 0.09, duration: 0.1, volume: 0.075 },
            { frequency: 784, at: 0.18, duration: 0.1, volume: 0.075 },
            { frequency: 1047, at: 0.27, duration: 0.28, volume: 0.08 },
        ]);
    },
} as const;

const subscribe = (callback: () => void) => {
    listeners.add(callback);

    return () => {
        listeners.delete(callback);
    };
};

export function useSoundMuted(): {
    readonly muted: boolean;
    readonly toggleMuted: () => void;
} {
    const muted = useSyncExternalStore(
        subscribe,
        () => isMuted(),
        () => true,
    );

    return {
        muted,
        toggleMuted: () => {
            setMuted(!muted);

            if (isMuted()) {
                return;
            }

            feel.select();
        },
    } as const;
}
