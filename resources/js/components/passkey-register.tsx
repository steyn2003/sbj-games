import { usePasskeyRegister } from '@laravel/passkeys/react';
import { useState } from 'react';
import { ActionButton } from '@/components/game-ui';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Props = {
    onSuccess: () => void;
};

export default function PasskeyRegistration({ onSuccess }: Props) {
    const [name, setName] = useState(() => {
        const ua = navigator.userAgent;

        const browser = ['Chrome', 'Firefox', 'Safari', 'Edge', 'Opera'].find(
            (browser) => new RegExp(browser).test(ua),
        );

        const os = ['iPhone', 'iPad', 'Android', 'Mac', 'Windows'].find((os) =>
            new RegExp(os).test(ua),
        );

        return [browser, os].filter(Boolean).join(' on ') || '';
    });

    const [showForm, setShowForm] = useState(false);
    const { register, isLoading, error, isSupported } = usePasskeyRegister({
        onSuccess: () => {
            setName('');
            setShowForm(false);
            onSuccess();
        },
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            return;
        }

        await register(name);
    };

    const handleCancel = () => {
        setShowForm(false);
        setName('');
    };

    if (!isSupported) {
        return (
            <div className="text-sm text-slate-500">
                Toegangssleutels worden niet ondersteund in deze browser.
            </div>
        );
    }

    if (!showForm) {
        return (
            <ActionButton variant="neutral" onClick={() => setShowForm(true)}>
                Toegangssleutel toevoegen
            </ActionButton>
        );
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="space-y-4 rounded-xl bg-white/5 p-4 ring-1 ring-white/10"
        >
            <div className="grid gap-2">
                <Label
                    htmlFor="passkey-name"
                    className="text-sm font-medium text-slate-300"
                >
                    Naam toegangssleutel
                </Label>
                <Input
                    id="passkey-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="bijv. MacBook Pro, iPhone"
                    className="h-auto rounded-xl border-white/10 bg-white/5 px-4 py-3 text-base text-white placeholder:text-slate-500 focus-visible:border-amber-400 focus-visible:ring-2 focus-visible:ring-amber-400/40"
                    autoFocus
                />
                <p className="text-xs text-slate-500">
                    Met een naam herken je deze toegangssleutel later.
                </p>
            </div>

            {error && <InputError message={error} />}

            <div className="flex items-center gap-3">
                <ActionButton
                    type="submit"
                    className="flex-1"
                    disabled={isLoading || !name.trim()}
                >
                    {isLoading
                        ? 'Registreren...'
                        : 'Toegangssleutel registreren'}
                </ActionButton>
                <Button
                    type="button"
                    variant="ghost"
                    className="h-14 rounded-2xl px-5 font-semibold text-slate-400 hover:bg-white/5 hover:text-white"
                    onClick={handleCancel}
                >
                    Annuleren
                </Button>
            </div>
        </form>
    );
}
