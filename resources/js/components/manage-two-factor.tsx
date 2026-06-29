import { Form } from '@inertiajs/react';
import { ShieldCheck } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import TwoFactorRecoveryCodes from '@/components/two-factor-recovery-codes';
import TwoFactorSetupModal from '@/components/two-factor-setup-modal';
import { Button } from '@/components/ui/button';
import { useTwoFactorAuth } from '@/hooks/use-two-factor-auth';
import { disable, enable } from '@/routes/two-factor';

export type Props = {
    canManageTwoFactor?: boolean;
    requiresConfirmation?: boolean;
    twoFactorEnabled?: boolean;
};

const darkPrimaryButton =
    'h-12 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 text-base font-bold text-white shadow-lg shadow-amber-900/40 hover:from-amber-400 hover:to-orange-400';

const roseButton =
    'h-12 rounded-2xl bg-rose-500 px-6 text-base font-bold text-white hover:bg-rose-400';

export default function ManageTwoFactor(props: Props) {
    const requiresConfirmation = props.requiresConfirmation ?? false;
    const twoFactorEnabled = props.twoFactorEnabled ?? false;

    const {
        qrCodeSvg,
        hasSetupData,
        manualSetupKey,
        clearSetupData,
        clearTwoFactorAuthData,
        fetchSetupData,
        recoveryCodesList,
        fetchRecoveryCodes,
        errors,
    } = useTwoFactorAuth();
    const [showSetupModal, setShowSetupModal] = useState<boolean>(false);
    const prevTwoFactorEnabled = useRef(twoFactorEnabled);

    useEffect(() => {
        if (prevTwoFactorEnabled.current && !twoFactorEnabled) {
            clearTwoFactorAuthData();
        }

        prevTwoFactorEnabled.current = twoFactorEnabled;
    }, [twoFactorEnabled, clearTwoFactorAuthData]);

    if (!(props.canManageTwoFactor ?? false)) {
        return null;
    }

    return (
        <section className="space-y-5 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 dark:bg-white/5 dark:shadow-none dark:ring-white/10">
            <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    Twee-factor-authenticatie
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Beheer je instellingen voor twee-factor-authenticatie.
                </p>
            </div>
            {twoFactorEnabled ? (
                <div className="flex flex-col items-start justify-start space-y-4">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Bij het inloggen wordt om een veilige, willekeurige code
                        gevraagd die je ophaalt uit een TOTP-app op je telefoon.
                    </p>

                    <div className="relative inline">
                        <Form {...disable.form()}>
                            {({ processing }) => (
                                <Button
                                    variant="destructive"
                                    type="submit"
                                    className={roseButton}
                                    disabled={processing}
                                >
                                    2FA uitschakelen
                                </Button>
                            )}
                        </Form>
                    </div>

                    <TwoFactorRecoveryCodes
                        recoveryCodesList={recoveryCodesList}
                        fetchRecoveryCodes={fetchRecoveryCodes}
                        errors={errors}
                    />
                </div>
            ) : (
                <div className="flex flex-col items-start justify-start space-y-4">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Als je twee-factor-authenticatie inschakelt, wordt bij
                        het inloggen om een veilige code gevraagd. Deze haal je
                        op uit een TOTP-app op je telefoon.
                    </p>

                    <div>
                        {hasSetupData ? (
                            <Button
                                className={darkPrimaryButton}
                                onClick={() => setShowSetupModal(true)}
                            >
                                <ShieldCheck />
                                Verder met instellen
                            </Button>
                        ) : (
                            <Form
                                {...enable.form()}
                                onSuccess={() => setShowSetupModal(true)}
                            >
                                {({ processing }) => (
                                    <Button
                                        type="submit"
                                        className={darkPrimaryButton}
                                        disabled={processing}
                                    >
                                        2FA inschakelen
                                    </Button>
                                )}
                            </Form>
                        )}
                    </div>
                </div>
            )}

            <TwoFactorSetupModal
                isOpen={showSetupModal}
                onClose={() => setShowSetupModal(false)}
                requiresConfirmation={requiresConfirmation}
                twoFactorEnabled={twoFactorEnabled}
                qrCodeSvg={qrCodeSvg}
                manualSetupKey={manualSetupKey}
                clearSetupData={clearSetupData}
                fetchSetupData={fetchSetupData}
                errors={errors}
            />
        </section>
    );
}
