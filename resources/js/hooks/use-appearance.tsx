/**
 * The suite ships a single committed game-night theme. The hook API is kept
 * so components that ask for the resolved theme (QR codes, toasts, canvas
 * colors) keep working — the answer is always 'dark'.
 */
export type ResolvedAppearance = 'dark';
export type Appearance = ResolvedAppearance;

export type UseAppearanceReturn = {
    readonly appearance: Appearance;
    readonly resolvedAppearance: ResolvedAppearance;
};

export function initializeTheme(): void {
    if (typeof document === 'undefined') {
        return;
    }

    document.documentElement.classList.add('dark');
    document.documentElement.style.colorScheme = 'dark';
}

export function useAppearance(): UseAppearanceReturn {
    return { appearance: 'dark', resolvedAppearance: 'dark' } as const;
}
