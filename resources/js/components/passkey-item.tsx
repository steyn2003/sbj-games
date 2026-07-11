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

const nightDialog =
    'border-white/10 bg-popover text-slate-100 ring-1 ring-white/10';

export default function PasskeyItem({ passkey, onDelete }: Props) {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = () => {
        setIsDeleting(true);
        onDelete(passkey.id, () => setIsDeleting(false));
    };

    return (
        <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-white/[0.03] p-4 last:border-b-0">
            <div className="flex items-center gap-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/5 ring-1 ring-white/10">
                    <KeyRound className="size-5 text-slate-400" />
                </div>
                <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                        <p className="font-semibold tracking-tight text-white">
                            {passkey.name}
                        </p>
                        {passkey.authenticator && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-white/10 px-2 py-0.5 text-[11px] font-medium tracking-wide text-slate-300 uppercase ring-1 ring-white/10 ring-inset">
                                {passkey.authenticator}
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-slate-400">
                        Toegevoegd {passkey.created_at_diff}
                        {passkey.last_used_at_diff && (
                            <>
                                <span className="mx-1 text-slate-600">/</span>
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
                        size="icon"
                        className="size-11 shrink-0 rounded-xl text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
                    >
                        <Trash2 className="size-4" />
                        <span className="sr-only">Verwijderen</span>
                    </Button>
                </DialogTrigger>
                <DialogContent className={nightDialog}>
                    <DialogTitle className="text-white">
                        Toegangssleutel verwijderen
                    </DialogTitle>
                    <DialogDescription className="text-slate-400">
                        Weet je zeker dat je de toegangssleutel "{passkey.name}"
                        wilt verwijderen? Je kunt er daarna niet meer mee
                        inloggen.
                    </DialogDescription>
                    <DialogFooter className="gap-2">
                        <DialogClose asChild>
                            <Button
                                variant="secondary"
                                className="h-12 rounded-xl bg-white/5 px-5 font-semibold text-slate-200 ring-1 ring-white/10 hover:bg-white/10 hover:text-white"
                            >
                                Annuleren
                            </Button>
                        </DialogClose>
                        <Button
                            variant="destructive"
                            className="h-12 rounded-xl bg-rose-500 px-5 font-semibold text-white hover:bg-rose-400"
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
