import { Form, Head, usePage } from '@inertiajs/react';
import { Link } from '@inertiajs/react';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import DeleteUser from '@/components/delete-user';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { edit } from '@/routes/profile';
import { send } from '@/routes/verification';
import type { Auth } from '@/types';

type PageProps = {
    auth: Auth;
};

const darkInput =
    'h-auto rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 focus-visible:border-indigo-400 focus-visible:ring-2 focus-visible:ring-indigo-500/40 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-500';

const darkLabel = 'text-sm font-medium text-slate-800 dark:text-slate-200';

const darkPrimaryButton =
    'h-12 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 text-base font-bold text-white shadow-lg shadow-amber-900/40 hover:from-amber-400 hover:to-orange-400';

export default function Profile({
    mustVerifyEmail,
    status,
}: {
    mustVerifyEmail: boolean;
    status?: string;
}) {
    const { auth } = usePage<PageProps>().props;

    return (
        <>
            <Head title="Profielinstellingen" />

            <h1 className="sr-only">Profielinstellingen</h1>

            <section className="space-y-5 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 dark:bg-white/5 dark:shadow-none dark:ring-white/10">
                <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Profiel</h2>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Werk je naam en e-mailadres bij.
                    </p>
                </div>

                <Form
                    {...ProfileController.update.form()}
                    options={{
                        preserveScroll: true,
                    }}
                    className="space-y-6"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="name" className={darkLabel}>
                                    Naam
                                </Label>

                                <Input
                                    id="name"
                                    className={darkInput}
                                    defaultValue={auth.user.name}
                                    name="name"
                                    required
                                    autoComplete="name"
                                    placeholder="Volledige naam"
                                />

                                <InputError
                                    className="mt-1 text-rose-600 dark:text-rose-400"
                                    message={errors.name}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="email" className={darkLabel}>
                                    E-mailadres
                                </Label>

                                <Input
                                    id="email"
                                    type="email"
                                    className={darkInput}
                                    defaultValue={auth.user.email}
                                    name="email"
                                    required
                                    autoComplete="username"
                                    placeholder="E-mailadres"
                                />

                                <InputError
                                    className="mt-1 text-rose-600 dark:text-rose-400"
                                    message={errors.email}
                                />
                            </div>

                            {mustVerifyEmail &&
                                auth.user.email_verified_at === null && (
                                    <div>
                                        <p className="-mt-4 text-sm text-slate-500 dark:text-slate-400">
                                            Je e-mailadres is nog niet
                                            geverifieerd.{' '}
                                            <Link
                                                href={send()}
                                                as="button"
                                                className="font-medium text-amber-600 underline underline-offset-4 transition-colors hover:text-amber-700 dark:text-amber-300 dark:hover:text-amber-200"
                                            >
                                                Klik hier om de verificatiemail
                                                opnieuw te versturen.
                                            </Link>
                                        </p>

                                        {status ===
                                            'verification-link-sent' && (
                                            <div className="mt-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                                                Er is een nieuwe verificatielink
                                                naar je e-mailadres verstuurd.
                                            </div>
                                        )}
                                    </div>
                                )}

                            <div className="flex items-center gap-4">
                                <Button
                                    disabled={processing}
                                    className={darkPrimaryButton}
                                    data-test="update-profile-button"
                                >
                                    Opslaan
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </section>

            <DeleteUser />
        </>
    );
}

Profile.layout = {
    breadcrumbs: [
        {
            title: 'Profielinstellingen',
            href: edit(),
        },
    ],
};
