import { Form } from '@inertiajs/react';
import { ShieldCheck } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { ActionButton, Panel } from '@/components/game-ui';
import TwoFactorRecoveryCodes from '@/components/two-factor-recovery-codes';
import TwoFactorSetupModal from '@/components/two-factor-setup-modal';
import { useTwoFactorAuth } from '@/hooks/use-two-factor-auth';
import { disable, enable } from '@/routes/two-factor';

export type Props = {
    canManageTwoFactor?: boolean;
    requiresConfirmation?: boolean;
    twoFactorEnabled?: boolean;
};

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
        <Panel className="space-y-5 p-5">
            <div className="flex items-start gap-3">
                <span
                    aria-hidden
                    className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-400/12 text-amber-300 ring-1 ring-amber-400/25"
                >
                    <ShieldCheck className="size-5" />
                </span>
                <div>
                    <h2 className="text-lg font-bold text-white">
                        Twee-factor-authenticatie
                    </h2>
                    <p className="mt-0.5 text-sm text-slate-400">
                        Beheer je instellingen voor twee-factor-authenticatie.
                    </p>
                </div>
            </div>
            {twoFactorEnabled ? (
                <div className="space-y-4">
                    <p className="text-sm text-slate-400">
                        Bij het inloggen wordt om een veilige, willekeurige code
                        gevraagd die je ophaalt uit een TOTP-app op je telefoon.
                    </p>

                    <Form {...disable.form()} className="w-full">
                        {({ processing }) => (
                            <ActionButton
                                variant="danger"
                                type="submit"
                                disabled={processing}
                            >
                                2FA uitschakelen
                            </ActionButton>
                        )}
                    </Form>

                    <TwoFactorRecoveryCodes
                        recoveryCodesList={recoveryCodesList}
                        fetchRecoveryCodes={fetchRecoveryCodes}
                        errors={errors}
                    />
                </div>
            ) : (
                <div className="space-y-4">
                    <p className="text-sm text-slate-400">
                        Als je twee-factor-authenticatie inschakelt, wordt bij
                        het inloggen om een veilige code gevraagd. Deze haal je
                        op uit een TOTP-app op je telefoon.
                    </p>

                    {hasSetupData ? (
                        <ActionButton onClick={() => setShowSetupModal(true)}>
                            <ShieldCheck className="size-5" aria-hidden />
                            Verder met instellen
                        </ActionButton>
                    ) : (
                        <Form
                            {...enable.form()}
                            onSuccess={() => setShowSetupModal(true)}
                            className="w-full"
                        >
                            {({ processing }) => (
                                <ActionButton
                                    type="submit"
                                    disabled={processing}
                                >
                                    2FA inschakelen
                                </ActionButton>
                            )}
                        </Form>
                    )}
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
        </Panel>
    );
}
