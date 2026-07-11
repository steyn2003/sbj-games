import { Link, usePage } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSplitLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    const { name } = usePage().props;

    return (
        <div
            data-accent="gold"
            className="relative grid min-h-[100dvh] items-center justify-center bg-background px-8 text-foreground sm:px-0 lg:max-w-none lg:grid-cols-2 lg:px-0"
        >
            <div className="relative hidden h-full flex-col border-r border-white/10 felt p-10 lg:flex">
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 lamp-glow"
                />
                <Link
                    href={home()}
                    className="relative z-20 flex items-center gap-3 rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-(--glow)"
                >
                    <span
                        aria-hidden
                        className="flex size-10 items-center justify-center rounded-xl bg-(--glow)/12 ring-1 ring-(--glow)/25"
                    >
                        <AppLogoIcon className="size-7" />
                    </span>
                    <span className="font-display text-xl text-white">
                        {name}
                    </span>
                </Link>
            </div>
            <div className="w-full lg:p-8">
                <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
                    <Link
                        href={home()}
                        aria-label="Naar de spellen"
                        className="relative z-20 flex items-center justify-center rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-(--glow) lg:hidden"
                    >
                        <span
                            aria-hidden
                            className="flex size-14 items-center justify-center rounded-2xl bg-(--glow)/12 ring-1 ring-(--glow)/25"
                        >
                            <AppLogoIcon className="size-9" />
                        </span>
                    </Link>
                    <div className="flex flex-col items-start gap-2 text-left sm:items-center sm:text-center">
                        <h1 className="font-display text-2xl text-white">
                            {title}
                        </h1>
                        <p className="text-sm text-balance text-slate-400">
                            {description}
                        </p>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}
