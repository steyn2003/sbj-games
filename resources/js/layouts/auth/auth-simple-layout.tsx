import { Link, usePage } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import { Panel } from '@/components/game-ui';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    const { name } = usePage().props;

    return (
        <div
            data-accent="gold"
            className="relative flex min-h-[100dvh] flex-col bg-background felt text-foreground"
        >
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 lamp-glow"
            />
            <main className="relative mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 pt-[max(2.5rem,env(safe-area-inset-top))] pb-[max(2.5rem,env(safe-area-inset-bottom))]">
                <header className="mb-8 flex flex-col items-center text-center">
                    <Link
                        href={home()}
                        className="group flex flex-col items-center gap-3 rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-(--glow)"
                    >
                        <span
                            aria-hidden
                            className="flex size-16 items-center justify-center rounded-2xl bg-(--glow)/12 ring-1 ring-(--glow)/25 transition group-hover:bg-(--glow)/20 motion-safe:animate-pop-in"
                        >
                            <AppLogoIcon className="size-10" />
                        </span>
                        <span className="text-xs font-semibold tracking-widest text-(--glow-strong) uppercase">
                            {name}
                        </span>
                    </Link>
                    <h1 className="mt-4 font-display text-3xl text-white">
                        {title}
                    </h1>
                    {description && (
                        <p className="mt-2 max-w-xs text-sm leading-relaxed text-balance text-slate-400">
                            {description}
                        </p>
                    )}
                </header>
                <Panel className="p-6">{children}</Panel>
            </main>
        </div>
    );
}
