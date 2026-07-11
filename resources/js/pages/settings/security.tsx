import { Form, Head } from '@inertiajs/react';
import { LockKeyhole } from 'lucide-react';
import { useRef } from 'react';
import SecurityController from '@/actions/App/Http/Controllers/Settings/SecurityController';
import { ActionButton, Panel } from '@/components/game-ui';
import InputError from '@/components/input-error';
import type { Props as ManagePasskeysProps } from '@/components/manage-passkeys';
import ManagePasskeys from '@/components/manage-passkeys';
import type { Props as ManageTwoFactorProps } from '@/components/manage-two-factor';
import ManageTwoFactor from '@/components/manage-two-factor';
import PasswordInput from '@/components/password-input';
import { Label } from '@/components/ui/label';
import { edit } from '@/routes/security';

type Props = {
    passwordRules: string;
} & ManagePasskeysProps &
    ManageTwoFactorProps;

const nightPasswordInput =
    'h-auto rounded-xl border-white/10 bg-white/5 py-3 pl-4 pr-11 text-base text-white placeholder:text-slate-500 focus-visible:border-amber-400 focus-visible:ring-2 focus-visible:ring-amber-400/40';

const nightLabel = 'text-sm font-medium text-slate-300';

export default function Security(props: Props) {
    const passwordInput = useRef<HTMLInputElement>(null);
    const currentPasswordInput = useRef<HTMLInputElement>(null);

    return (
        <>
            <Head title="Beveiligingsinstellingen" />

            <h1 className="sr-only">Beveiligingsinstellingen</h1>

            <Panel className="space-y-5 p-5">
                <div className="flex items-start gap-3">
                    <span
                        aria-hidden
                        className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-400/12 text-amber-300 ring-1 ring-amber-400/25"
                    >
                        <LockKeyhole className="size-5" />
                    </span>
                    <div>
                        <h2 className="text-lg font-bold text-white">
                            Wachtwoord wijzigen
                        </h2>
                        <p className="mt-0.5 text-sm text-slate-400">
                            Gebruik een lang, willekeurig wachtwoord om je
                            account veilig te houden.
                        </p>
                    </div>
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
                                    className={nightLabel}
                                >
                                    Huidig wachtwoord
                                </Label>

                                <PasswordInput
                                    id="current_password"
                                    ref={currentPasswordInput}
                                    name="current_password"
                                    className={nightPasswordInput}
                                    autoComplete="current-password"
                                    placeholder="Huidig wachtwoord"
                                />

                                <InputError message={errors.current_password} />
                            </div>

                            <div className="grid gap-2">
                                <Label
                                    htmlFor="password"
                                    className={nightLabel}
                                >
                                    Nieuw wachtwoord
                                </Label>

                                <PasswordInput
                                    id="password"
                                    ref={passwordInput}
                                    name="password"
                                    className={nightPasswordInput}
                                    autoComplete="new-password"
                                    placeholder="Nieuw wachtwoord"
                                    passwordrules={props.passwordRules}
                                />

                                <InputError message={errors.password} />
                            </div>

                            <div className="grid gap-2">
                                <Label
                                    htmlFor="password_confirmation"
                                    className={nightLabel}
                                >
                                    Bevestig wachtwoord
                                </Label>

                                <PasswordInput
                                    id="password_confirmation"
                                    name="password_confirmation"
                                    className={nightPasswordInput}
                                    autoComplete="new-password"
                                    placeholder="Bevestig wachtwoord"
                                    passwordrules={props.passwordRules}
                                />

                                <InputError
                                    message={errors.password_confirmation}
                                />
                            </div>

                            <ActionButton
                                type="submit"
                                disabled={processing}
                                data-test="update-password-button"
                            >
                                Opslaan
                            </ActionButton>
                        </>
                    )}
                </Form>
            </Panel>

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
