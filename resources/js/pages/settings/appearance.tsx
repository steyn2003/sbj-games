import { Head } from '@inertiajs/react';
import AppearanceTabs from '@/components/appearance-tabs';
import { edit as editAppearance } from '@/routes/appearance';

export default function Appearance() {
    return (
        <>
            <Head title="Weergave-instellingen" />

            <h1 className="sr-only">Weergave-instellingen</h1>

            <section className="space-y-5 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 dark:bg-white/5 dark:shadow-none dark:ring-white/10">
                <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Weergave</h2>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Kies of de app er licht, donker of volgens je
                        systeeminstelling uitziet.
                    </p>
                </div>
                <AppearanceTabs />
            </section>
        </>
    );
}

Appearance.layout = {
    breadcrumbs: [
        {
            title: 'Weergave-instellingen',
            href: editAppearance(),
        },
    ],
};
