import { Link } from '@inertiajs/react';
import type { PropsWithChildren } from 'react';
import AppLogoIcon from '@/components/app-logo-icon';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { home } from '@/routes';

export default function AuthCardLayout({
    children,
    title,
    description,
}: PropsWithChildren<{
    name?: string;
    title?: string;
    description?: string;
}>) {
    return (
        <div
            data-accent="gold"
            className="relative flex min-h-[100dvh] flex-col items-center justify-center gap-6 bg-background felt p-6 text-foreground md:p-10"
        >
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 lamp-glow"
            />
            <div className="relative flex w-full max-w-md flex-col gap-6">
                <Link
                    href={home()}
                    aria-label="Naar de spellen"
                    className="flex items-center justify-center self-center rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-(--glow)"
                >
                    <span
                        aria-hidden
                        className="flex size-14 items-center justify-center rounded-2xl bg-(--glow)/12 ring-1 ring-(--glow)/25"
                    >
                        <AppLogoIcon className="size-9" />
                    </span>
                </Link>

                <Card className="rounded-2xl border-0 bg-white/[0.045] shadow-none ring-1 ring-white/10 backdrop-blur-sm">
                    <CardHeader className="px-8 pt-8 pb-0 text-center">
                        <CardTitle className="font-display text-2xl text-white">
                            {title}
                        </CardTitle>
                        <CardDescription className="text-slate-400">
                            {description}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="px-8 py-8">{children}</CardContent>
                </Card>
            </div>
        </div>
    );
}
