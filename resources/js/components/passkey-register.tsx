import { usePasskeyRegister } from '@laravel/passkeys/react';
import { useState } from 'react';
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
            <div className="text-sm text-slate-500 dark:text-slate-400">
                Toegangssleutels worden niet ondersteund in deze browser.
            </div>
        );
    }

    if (!showForm) {
        return (
            <Button
                variant="outline"
                className="rounded-2xl border-slate-200 bg-white px-5 font-semibold text-slate-800 hover:bg-slate-200 hover:text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10 dark:hover:text-white"
                onClick={() => setShowForm(true)}
            >
                Toegangssleutel toevoegen
            </Button>
        );
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="space-y-4 rounded-xl bg-white p-4 ring-1 ring-slate-200 dark:bg-white/5 dark:ring-white/10"
        >
            <div className="grid gap-2">
                <Label
                    htmlFor="passkey-name"
                    className="text-sm font-medium text-slate-800 dark:text-slate-200"
                >
                    Naam toegangssleutel
                </Label>
                <Input
                    id="passkey-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="bijv. MacBook Pro, iPhone"
                    className="h-auto rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 focus-visible:border-indigo-400 focus-visible:ring-2 focus-visible:ring-indigo-500/40 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-500"
                    autoFocus
                />
                <p className="text-xs text-slate-400 dark:text-slate-500">
                    Met een naam herken je deze toegangssleutel later.
                </p>
            </div>

            {error && (
                <InputError
                    className="text-rose-600 dark:text-rose-400"
                    message={error}
                />
            )}

            <div className="flex gap-2">
                <Button
                    type="submit"
                    className="rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 px-5 font-bold text-white shadow-lg shadow-amber-900/40 hover:from-amber-400 hover:to-orange-400"
                    disabled={isLoading || !name.trim()}
                >
                    {isLoading
                        ? 'Registreren...'
                        : 'Toegangssleutel registreren'}
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    className="rounded-2xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white"
                    onClick={handleCancel}
                >
                    Annuleren
                </Button>
            </div>
        </form>
    );
}
