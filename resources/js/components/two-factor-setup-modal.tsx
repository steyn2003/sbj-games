import { Form } from '@inertiajs/react';
import { REGEXP_ONLY_DIGITS } from 'input-otp';
import { Check, Copy, ScanLine } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AlertError from '@/components/alert-error';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from '@/components/ui/input-otp';
import { Spinner } from '@/components/ui/spinner';
import { useAppearance } from '@/hooks/use-appearance';
import { useClipboard } from '@/hooks/use-clipboard';
import { OTP_MAX_LENGTH } from '@/hooks/use-two-factor-auth';
import { confirm } from '@/routes/two-factor';

const darkPrimaryButton =
    'rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 font-bold text-white shadow-lg shadow-amber-900/40 hover:from-amber-400 hover:to-orange-400';

function GridScanIcon() {
    return (
        <div className="mb-3 rounded-full border border-slate-200 bg-white p-0.5 dark:border-white/10 dark:bg-white/5">
            <div className="relative overflow-hidden rounded-full border border-slate-200 bg-white p-2.5 dark:border-white/10 dark:bg-white/5">
                <div className="absolute inset-0 grid grid-cols-5 opacity-30">
                    {Array.from({ length: 5 }, (_, i) => (
                        <div
                            key={`col-${i + 1}`}
                            className="border-r border-slate-200 last:border-r-0 dark:border-white/10"
                        />
                    ))}
                </div>
                <div className="absolute inset-0 grid grid-rows-5 opacity-30">
                    {Array.from({ length: 5 }, (_, i) => (
                        <div
                            key={`row-${i + 1}`}
                            className="border-b border-slate-200 last:border-b-0 dark:border-white/10"
                        />
                    ))}
                </div>
                <ScanLine className="relative z-20 size-6 text-amber-600 dark:text-amber-300" />
            </div>
        </div>
    );
}

function TwoFactorSetupStep({
    qrCodeSvg,
    manualSetupKey,
    buttonText,
    onNextStep,
    errors,
}: {
    qrCodeSvg: string | null;
    manualSetupKey: string | null;
    buttonText: string;
    onNextStep: () => void;
    errors: string[];
}) {
    const { resolvedAppearance } = useAppearance();
    const [copiedText, copy] = useClipboard();
    const IconComponent = copiedText === manualSetupKey ? Check : Copy;

    return (
        <>
            {errors?.length ? (
                <AlertError errors={errors} />
            ) : (
                <>
                    <div className="mx-auto flex max-w-md overflow-hidden">
                        <div className="mx-auto aspect-square w-64 rounded-lg border border-slate-200 dark:border-white/10">
                            <div className="z-10 flex h-full w-full items-center justify-center p-5">
                                {qrCodeSvg ? (
                                    <div
                                        className="aspect-square w-full rounded-lg bg-white p-2 [&_svg]:size-full"
                                        dangerouslySetInnerHTML={{
                                            __html: qrCodeSvg,
                                        }}
                                        style={{
                                            filter:
                                                resolvedAppearance === 'dark'
                                                    ? 'invert(1) brightness(1.5)'
                                                    : undefined,
                                        }}
                                    />
                                ) : (
                                    <Spinner />
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex w-full space-x-5">
                        <Button
                            className={`w-full ${darkPrimaryButton}`}
                            onClick={onNextStep}
                        >
                            {buttonText}
                        </Button>
                    </div>

                    <div className="relative flex w-full items-center justify-center">
                        <div className="absolute inset-0 top-1/2 h-px w-full bg-slate-200 dark:bg-white/10" />
                        <span className="relative bg-white px-2 py-1 text-sm text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                            of voer de code handmatig in
                        </span>
                    </div>

                    <div className="flex w-full space-x-2">
                        <div className="flex w-full items-stretch overflow-hidden rounded-xl border border-slate-200 dark:border-white/10">
                            {!manualSetupKey ? (
                                <div className="flex h-full w-full items-center justify-center bg-white p-3 dark:bg-white/5">
                                    <Spinner />
                                </div>
                            ) : (
                                <>
                                    <input
                                        type="text"
                                        readOnly
                                        value={manualSetupKey}
                                        className="h-full w-full bg-white p-3 text-slate-900 outline-none dark:bg-white/5 dark:text-white"
                                    />
                                    <button
                                        onClick={() => copy(manualSetupKey)}
                                        className="border-l border-slate-200 px-3 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white"
                                    >
                                        <IconComponent className="w-4" />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </>
            )}
        </>
    );
}

function TwoFactorVerificationStep({
    onClose,
    onBack,
}: {
    onClose: () => void;
    onBack: () => void;
}) {
    const [code, setCode] = useState<string>('');
    const pinInputContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setTimeout(() => {
            pinInputContainerRef.current?.querySelector('input')?.focus();
        }, 0);
    }, []);

    return (
        <Form
            {...confirm.form()}
            onSuccess={() => onClose()}
            resetOnError
            resetOnSuccess
        >
            {({
                processing,
                errors,
            }: {
                processing: boolean;
                errors?: { confirmTwoFactorAuthentication?: { code?: string } };
            }) => (
                <>
                    <div
                        ref={pinInputContainerRef}
                        className="relative w-full space-y-3"
                    >
                        <div className="flex w-full flex-col items-center space-y-3 py-2">
                            <InputOTP
                                id="otp"
                                name="code"
                                maxLength={OTP_MAX_LENGTH}
                                onChange={setCode}
                                disabled={processing}
                                pattern={REGEXP_ONLY_DIGITS}
                                autoFocus
                            >
                                <InputOTPGroup>
                                    {Array.from(
                                        { length: OTP_MAX_LENGTH },
                                        (_, index) => (
                                            <InputOTPSlot
                                                key={index}
                                                index={index}
                                                className="border-slate-300 bg-white text-slate-900 dark:border-white/15 dark:bg-white/5 dark:text-white"
                                            />
                                        ),
                                    )}
                                </InputOTPGroup>
                            </InputOTP>
                            <InputError
                                className="text-rose-600 dark:text-rose-400"
                                message={
                                    errors?.confirmTwoFactorAuthentication?.code
                                }
                            />
                        </div>

                        <div className="flex w-full space-x-5">
                            <Button
                                type="button"
                                variant="outline"
                                className="flex-1 rounded-2xl border-slate-200 bg-white font-semibold text-slate-800 hover:bg-slate-200 hover:text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10 dark:hover:text-white"
                                onClick={onBack}
                                disabled={processing}
                            >
                                Terug
                            </Button>
                            <Button
                                type="submit"
                                className={`flex-1 ${darkPrimaryButton}`}
                                disabled={
                                    processing || code.length < OTP_MAX_LENGTH
                                }
                            >
                                Bevestigen
                            </Button>
                        </div>
                    </div>
                </>
            )}
        </Form>
    );
}

type Props = {
    isOpen: boolean;
    onClose: () => void;
    requiresConfirmation: boolean;
    twoFactorEnabled: boolean;
    qrCodeSvg: string | null;
    manualSetupKey: string | null;
    clearSetupData: () => void;
    fetchSetupData: () => Promise<void>;
    errors: string[];
};

export default function TwoFactorSetupModal({
    isOpen,
    onClose,
    requiresConfirmation,
    twoFactorEnabled,
    qrCodeSvg,
    manualSetupKey,
    clearSetupData,
    fetchSetupData,
    errors,
}: Props) {
    const [showVerificationStep, setShowVerificationStep] =
        useState<boolean>(false);

    const modalConfig = useMemo<{
        title: string;
        description: string;
        buttonText: string;
    }>(() => {
        if (twoFactorEnabled) {
            return {
                title: 'Twee-factor-authenticatie ingeschakeld',
                description:
                    'Twee-factor-authenticatie is nu ingeschakeld. Scan de QR-code of voer de sleutel in je authenticator-app in.',
                buttonText: 'Sluiten',
            };
        }

        if (showVerificationStep) {
            return {
                title: 'Verifieer de authenticatiecode',
                description:
                    'Voer de 6-cijferige code uit je authenticator-app in.',
                buttonText: 'Verder',
            };
        }

        return {
            title: 'Twee-factor-authenticatie inschakelen',
            description:
                'Scan de QR-code of voer de sleutel in je authenticator-app in om twee-factor-authenticatie te voltooien.',
            buttonText: 'Verder',
        };
    }, [twoFactorEnabled, showVerificationStep]);

    const resetModalState = useCallback(() => {
        setShowVerificationStep(false);
        clearSetupData();
    }, [clearSetupData]);

    const handleClose = useCallback(() => {
        resetModalState();
        onClose();
    }, [onClose, resetModalState]);

    const handleModalNextStep = useCallback(() => {
        if (requiresConfirmation) {
            setShowVerificationStep(true);

            return;
        }

        handleClose();
    }, [requiresConfirmation, handleClose]);

    const fetchSetupDataRef = useRef(fetchSetupData);

    useEffect(() => {
        fetchSetupDataRef.current = fetchSetupData;
    }, [fetchSetupData]);

    useEffect(() => {
        if (isOpen && !qrCodeSvg) {
            fetchSetupDataRef.current();
        }
    }, [isOpen, qrCodeSvg]);

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="border-slate-200 bg-white text-slate-900 ring-1 ring-slate-200 sm:max-w-md dark:border-white/10 dark:bg-slate-900 dark:text-slate-100 dark:ring-white/10">
                <DialogHeader className="flex items-center justify-center">
                    <GridScanIcon />
                    <DialogTitle className="text-slate-900 dark:text-white">
                        {modalConfig.title}
                    </DialogTitle>
                    <DialogDescription className="text-center text-slate-500 dark:text-slate-400">
                        {modalConfig.description}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col items-center space-y-5">
                    {showVerificationStep ? (
                        <TwoFactorVerificationStep
                            onClose={handleClose}
                            onBack={() => setShowVerificationStep(false)}
                        />
                    ) : (
                        <TwoFactorSetupStep
                            qrCodeSvg={qrCodeSvg}
                            manualSetupKey={manualSetupKey}
                            buttonText={modalConfig.buttonText}
                            onNextStep={handleModalNextStep}
                            errors={errors}
                        />
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
