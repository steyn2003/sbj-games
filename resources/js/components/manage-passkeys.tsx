import { router } from '@inertiajs/react';
import { KeyRound } from 'lucide-react';
import { destroy } from '@/actions/Laravel/Passkeys/Http/Controllers/PasskeyRegistrationController';
import { Panel } from '@/components/game-ui';
import PasskeyItem from '@/components/passkey-item';
import PasskeyRegistration from '@/components/passkey-register';
import type { Passkey } from '@/types/auth';

export type Props = {
    canManagePasskeys?: boolean;
    passkeys?: Passkey[];
};

const EmptyState = () => {
    return (
        <div className="p-8 text-center">
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-white/5 ring-1 ring-white/10">
                <KeyRound className="size-7 text-slate-400" />
            </div>
            <p className="font-semibold text-white">
                Nog geen toegangssleutels
            </p>
            <p className="mt-1 text-sm text-slate-400">
                Voeg een toegangssleutel toe om zonder wachtwoord in te loggen.
            </p>
        </div>
    );
};

export default function ManagePasskeys(props: Props) {
    const passkeys = props.passkeys ?? [];

    const handleDelete = (id: number, onError: () => void) => {
        router.delete(destroy.url(id), {
            preserveScroll: true,
            onError,
        });
    };

    const handleRegisterSuccess = () => {
        router.reload();
    };

    if (!(props.canManagePasskeys ?? false)) {
        return null;
    }

    return (
        <Panel className="space-y-5 p-5">
            <div className="flex items-start gap-3">
                <span
                    aria-hidden
                    className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-400/12 text-amber-300 ring-1 ring-amber-400/25"
                >
                    <KeyRound className="size-5" />
                </span>
                <div>
                    <h2 className="text-lg font-bold text-white">
                        Toegangssleutels
                    </h2>
                    <p className="mt-0.5 text-sm text-slate-400">
                        Beheer je toegangssleutels om zonder wachtwoord in te
                        loggen.
                    </p>
                </div>
            </div>

            <div className="overflow-hidden rounded-xl ring-1 ring-white/10">
                {passkeys.length > 0 ? (
                    passkeys.map((passkey) => (
                        <PasskeyItem
                            key={passkey.id}
                            passkey={passkey}
                            onDelete={handleDelete}
                        />
                    ))
                ) : (
                    <EmptyState />
                )}
            </div>

            <PasskeyRegistration onSuccess={handleRegisterSuccess} />
        </Panel>
    );
}
