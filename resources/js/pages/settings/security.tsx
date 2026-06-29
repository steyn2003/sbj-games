import { Form, Head } from '@inertiajs/react';
import { useRef } from 'react';
import SecurityController from '@/actions/App/Http/Controllers/Settings/SecurityController';
import InputError from '@/components/input-error';
import type { Props as ManagePasskeysProps } from '@/components/manage-passkeys';
import ManagePasskeys from '@/components/manage-passkeys';
import type { Props as ManageTwoFactorProps } from '@/components/manage-two-factor';
import ManageTwoFactor from '@/components/manage-two-factor';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { edit } from '@/routes/security';

type Props = {
    passwordRules: string;
} & ManagePasskeysProps &
    ManageTwoFactorProps;

const darkPasswordInput =
    'h-auto rounded-xl border border-slate-200 bg-white py-3 pl-4 pr-11 text-base text-slate-900 placeholder:text-slate-400 focus-visible:border-indigo-400 focus-visible:ring-2 focus-visible:ring-indigo-500/40 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-500';

const darkLabel = 'text-sm font-medium text-slate-800 dark:text-slate-200';

const darkPrimaryButton =
    'h-12 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 text-base font-bold text-white shadow-lg shadow-amber-900/40 hover:from-amber-400 hover:to-orange-400';

export default function Security(props: Props) {
    const passwordInput = useRef<HTMLInputElement>(null);
    const currentPasswordInput = useRef<HTMLInputElement>(null);

    return (
        <>
            <Head title="Beveiligingsinstellingen" />

            <h1 className="sr-only">Beveiligingsinstellingen</h1>

            <section className="space-y-5 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 dark:bg-white/5 dark:shadow-none dark:ring-white/10">
                <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                        Wachtwoord wijzigen
                    </h2>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Gebruik een lang, willekeurig wachtwoord om je account
                        veilig te houden.
                    </p>
                </div>

                <Form
                    {...SecurityController.update.form()}
                    options={{
                        preserveScroll: true,
                    }}
                    resetOnError={[
                        'password',
                        'password_confirmation',
                        'current_password',
                    ]}
                    resetOnSuccess
                    onError={(errors) => {
                        if (errors.password) {
                            passwordInput.current?.focus();
                        }

                        if (errors.current_password) {
                            currentPasswordInput.current?.focus();
                        }
                    }}
                    className="space-y-6"
                >
                    {({ errors, processing }) => (
                        <>
                            <div className="grid gap-2">
                                <Label
                                    htmlFor="current_password"
                                    className={darkLabel}
                                >
                                    Huidig wachtwoord
                                </Label>

                                <PasswordInput
                                    id="current_password"
                                    ref={currentPasswordInput}
                                    name="current_password"
                                    className={darkPasswordInput}
                                    autoComplete="current-password"
                                    placeholder="Huidig wachtwoord"
                                />

                                <InputError
                                    className="text-rose-600 dark:text-rose-400"
                                    message={errors.current_password}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password" className={darkLabel}>
                                    Nieuw wachtwoord
                                </Label>

                                <PasswordInput
                                    id="password"
                                    ref={passwordInput}
                                    name="password"
                                    className={darkPasswordInput}
                                    autoComplete="new-password"
                                    placeholder="Nieuw wachtwoord"
                                    passwordrules={props.passwordRules}
                                />

                                <InputError
                                    className="text-rose-600 dark:text-rose-400"
                                    message={errors.password}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label
                                    htmlFor="password_confirmation"
                                    className={darkLabel}
                                >
                                    Bevestig wachtwoord
                                </Label>

                                <PasswordInput
                                    id="password_confirmation"
                                    name="password_confirmation"
                                    className={darkPasswordInput}
                                    autoComplete="new-password"
                                    placeholder="Bevestig wachtwoord"
                                    passwordrules={props.passwordRules}
                                />

                                <InputError
                                    className="text-rose-600 dark:text-rose-400"
                                    message={errors.password_confirmation}
                                />
                            </div>

                            <div className="flex items-center gap-4">
                                <Button
                                    disabled={processing}
                                    className={darkPrimaryButton}
                                    data-test="update-password-button"
                                >
                                    Opslaan
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </section>

            <ManageTwoFactor
                canManageTwoFactor={props.canManageTwoFactor}
                requiresConfirmation={props.requiresConfirmation}
                twoFactorEnabled={props.twoFactorEnabled}
            />

            <ManagePasskeys
                canManagePasskeys={props.canManagePasskeys}
                passkeys={props.passkeys}
            />
        </>
    );
}

Security.layout = {
    breadcrumbs: [
        {
            title: 'Beveiligingsinstellingen',
            href: edit(),
        },
    ],
};
