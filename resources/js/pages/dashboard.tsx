import { Head, Link } from '@inertiajs/react';
import { Play } from 'lucide-react';
import AppLogoIcon from '@/components/app-logo-icon';
import { Button } from '@/components/ui/button';
import { dashboard, home } from '@/routes';

export default function Dashboard() {
    return (
        <>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col items-center justify-center p-4">
                <div className="w-full max-w-md overflow-hidden rounded-2xl border border-sidebar-border/70 bg-gradient-to-b from-slate-900 to-indigo-950 p-8 text-center text-slate-100 shadow-xl dark:border-sidebar-border">
                    <div className="mx-auto mb-4 flex size-20 items-center justify-center rounded-2xl bg-amber-400/15 ring-1 ring-amber-400/30">
                        <AppLogoIcon className="size-14" />
                    </div>
                    <span className="text-xs font-bold tracking-widest text-amber-300 uppercase">Pim Pam Pet</span>
                    <h1 className="mt-1 text-3xl font-black text-white">Klaar om te spelen?</h1>
                    <p className="mx-auto mt-2 max-w-xs text-sm text-slate-400">
                        Undercover — iedereen krijgt een geheim woord, behalve de Undercover. Ontmasker ze!
                    </p>

                    <Button
                        asChild
                        className="mt-6 h-14 w-full rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-lg font-bold text-white hover:from-amber-400 hover:to-orange-400"
                    >
                        <Link href={home()}>
                            <Play className="size-5" /> Speel Undercover
                        </Link>
                    </Button>
                </div>
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
