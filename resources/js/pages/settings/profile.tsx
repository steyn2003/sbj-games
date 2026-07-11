import { Form, Head, usePage } from '@inertiajs/react';
import { Link } from '@inertiajs/react';
import { UserRound } from 'lucide-react';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import DeleteUser from '@/components/delete-user';
import { ActionButton, Panel } from '@/components/game-ui';
import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { edit } from '@/routes/profile';
import { send } from '@/routes/verification';
import type { Auth } from '@/types';

type PageProps = {
    auth: Auth;
};

const nightInput =
    'h-auto rounded-xl border-white/10 bg-white/5 px-4 py-3 text-base text-white placeholder:text-slate-500 focus-visible:border-amber-400 focus-visible:ring-2 focus-visible:ring-amber-400/40';

const nightLabel = 'text-sm font-medium text-slate-300';

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

            <Panel className="space-y-5 p-5">
                <div className="flex items-start gap-3">
                    <span
                        aria-hidden
                        className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-400/12 text-amber-300 ring-1 ring-amber-400/25"
                    >
                        <UserRound className="size-5" />
                    </span>
                    <div>
                        <h2 className="text-lg font-bold text-white">
                            Profiel
                        </h2>
                        <p className="mt-0.5 text-sm text-slate-400">
                            Werk je naam en e-mailadres bij.
                        </p>
                    </div>
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
                                <Label htmlFor="name" className={nightLabel}>
                                    Naam
                                </Label>

                                <Input
                                    id="name"
                                    className={nightInput}
                                    defaultValue={auth.user.name}
                                    name="name"
                                    required
                                    autoComplete="name"
                                    placeholder="Volledige naam"
                                />

                                <InputError message={errors.name} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="email" className={nightLabel}>
                                    E-mailadres
                                </Label>

                                <Input
                                    id="email"
                                    type="email"
                                    className={nightInput}
                                    defaultValue={auth.user.email}
                                    name="email"
                                    required
                                    autoComplete="username"
                                    placeholder="E-mailadres"
                                />

                                <InputError message={errors.email} />
                            </div>

                            {mustVerifyEmail &&
                                auth.user.email_verified_at === null && (
                                    <div>
                                        <p className="-mt-4 text-sm text-slate-400">
                                            Je e-mailadres is nog niet
                                            geverifieerd.{' '}
                                            <Link
                                                href={send()}
                                                as="button"
                                                className="font-medium text-amber-300 underline underline-offset-4 transition-colors hover:text-amber-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70"
                                            >
                                                Klik hier om de verificatiemail
                                                opnieuw te versturen.
                                            </Link>
                                        </p>

                                        {status ===
                                            'verification-link-sent' && (
                                            <div
                                                aria-live="polite"
                                                className="mt-2 text-sm font-medium text-emerald-400"
                                            >
                                                Er is een nieuwe verificatielink
                                                naar je e-mailadres verstuurd.
                                            </div>
                                        )}
                                    </div>
                                )}

                            <ActionButton
                                type="submit"
                                disabled={processing}
                                data-test="update-profile-button"
                            >
                                Opslaan
                            </ActionButton>
                        </>
                    )}
                </Form>
            </Panel>

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
