import { KeyRound, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import type { Passkey } from '@/types/auth';

type Props = {
    passkey: Passkey;
    onDelete: (id: number, onError: () => void) => void;
};

const darkDialog =
    'border-slate-200 bg-white text-slate-900 ring-1 ring-slate-200 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100 dark:ring-white/10';

export default function PasskeyItem({ passkey, onDelete }: Props) {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = () => {
        setIsDeleting(true);
        onDelete(passkey.id, () => setIsDeleting(false));
    };

    return (
        <div className="flex items-center justify-between border-b border-slate-200 bg-white p-4 last:border-b-0 dark:border-white/10 dark:bg-white/5">
            <div className="flex items-center gap-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white ring-1 ring-slate-200 dark:bg-white/5 dark:ring-white/10">
                    <KeyRound className="size-5 text-slate-500 dark:text-slate-400" />
                </div>
                <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                        <p className="font-semibold tracking-tight text-slate-900 dark:text-white">
                            {passkey.name}
                        </p>
                        {passkey.authenticator && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium tracking-wide text-slate-600 uppercase ring-1 ring-slate-200 ring-inset dark:bg-white/10 dark:text-slate-300 dark:ring-white/10">
                                {passkey.authenticator}
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Toegevoegd {passkey.created_at_diff}
                        {passkey.last_used_at_diff && (
                            <>
                                <span className="mx-1 text-slate-300 dark:text-slate-600">
                                    /
                                </span>
                                Laatst gebruikt {passkey.last_used_at_diff}
                            </>
                        )}
                    </p>
                </div>
            </div>

            <Dialog>
                <DialogTrigger asChild>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-rose-600 hover:bg-rose-500/10 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300"
                    >
                        <Trash2 className="size-4" />
                        <span className="sr-only">Verwijderen</span>
                    </Button>
                </DialogTrigger>
                <DialogContent className={darkDialog}>
                    <DialogTitle className="text-slate-900 dark:text-white">
                        Toegangssleutel verwijderen
                    </DialogTitle>
                    <DialogDescription className="text-slate-500 dark:text-slate-400">
                        Weet je zeker dat je de toegangssleutel "{passkey.name}"
                        wilt verwijderen? Je kunt er daarna niet meer mee
                        inloggen.
                    </DialogDescription>
                    <DialogFooter className="gap-2">
                        <DialogClose asChild>
                            <Button
                                variant="secondary"
                                className="rounded-2xl bg-slate-100 px-5 font-semibold text-slate-800 hover:bg-slate-200 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/15"
                            >
                                Annuleren
                            </Button>
                        </DialogClose>
                        <Button
                            variant="destructive"
                            className="rounded-2xl bg-rose-500 px-5 font-bold text-white hover:bg-rose-400"
                            onClick={handleDelete}
                            disabled={isDeleting}
                        >
                            {isDeleting
                                ? 'Verwijderen...'
                                : 'Toegangssleutel verwijderen'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
