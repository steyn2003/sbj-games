import { Form } from '@inertiajs/react';
import { TriangleAlert } from 'lucide-react';
import { useRef } from 'react';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import { Panel } from '@/components/game-ui';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
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
import { Label } from '@/components/ui/label';
import { feel } from '@/hooks/use-game-feel';

const nightDialog =
    'border-white/10 bg-popover text-slate-100 ring-1 ring-white/10';

const nightPasswordInput =
    'h-auto rounded-xl border-white/10 bg-white/5 py-3 pl-4 pr-11 text-base text-white placeholder:text-slate-500 focus-visible:border-rose-400 focus-visible:ring-2 focus-visible:ring-rose-400/40';

const dangerCta =
    'h-14 w-full rounded-2xl bg-rose-500 text-base font-semibold text-white shadow-[0_10px_32px_-12px_var(--color-rose-500)] transition hover:bg-rose-400 active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-rose-400';

const dialogCancelButton =
    'h-12 rounded-xl bg-white/5 px-5 font-semibold text-slate-200 ring-1 ring-white/10 hover:bg-white/10 hover:text-white';

const dialogDangerButton =
    'h-12 rounded-xl bg-rose-500 px-5 font-semibold text-white hover:bg-rose-400';

export default function DeleteUser() {
    const passwordInput = useRef<HTMLInputElement>(null);

    return (
        <Panel className="space-y-4 bg-rose-500/10 p-5 ring-rose-500/30">
            <div className="flex items-start gap-3">
                <span
                    aria-hidden
                    className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/12 text-rose-300 ring-1 ring-rose-500/25"
                >
                    <TriangleAlert className="size-5" />
                </span>
                <div>
                    <h2 className="text-lg font-bold text-white">
                        Account verwijderen
                    </h2>
                    <p className="mt-0.5 text-sm text-slate-400">
                        Verwijder je account en alle bijbehorende gegevens.
                    </p>
                </div>
            </div>

            <div className="rounded-xl bg-rose-500/10 p-4 ring-1 ring-rose-500/20">
                <p className="font-semibold text-rose-100">Let op</p>
                <p className="mt-0.5 text-sm text-rose-200/80">
                    Ga voorzichtig te werk, dit kan niet ongedaan worden
                    gemaakt.
                </p>
            </div>

            <Dialog>
                <DialogTrigger asChild>
                    <Button
                        variant="destructive"
                        className={dangerCta}
                        data-test="delete-user-button"
                        onClick={() => feel.tap()}
                    >
                        Account verwijderen
                    </Button>
                </DialogTrigger>
                <DialogContent className={nightDialog}>
                    <DialogTitle className="text-white">
                        Weet je zeker dat je je account wilt verwijderen?
                    </DialogTitle>
                    <DialogDescription className="text-slate-400">
                        Zodra je account is verwijderd, worden alle bijbehorende
                        gegevens permanent gewist. Voer je wachtwoord in om te
                        bevestigen dat je je account definitief wilt
                        verwijderen.
                    </DialogDescription>

                    <Form
                        {...ProfileController.destroy.form()}
                        options={{
                            preserveScroll: true,
                        }}
                        onError={() => passwordInput.current?.focus()}
                        resetOnSuccess
                        className="space-y-6"
                    >
                        {({ resetAndClearErrors, processing, errors }) => (
                            <>
                                <div className="grid gap-2">
                                    <Label
                                        htmlFor="password"
                                        className="sr-only"
                                    >
                                        Wachtwoord
                                    </Label>

                                    <PasswordInput
                                        id="password"
                                        name="password"
                                        ref={passwordInput}
                                        placeholder="Wachtwoord"
                                        autoComplete="current-password"
                                        className={nightPasswordInput}
                                    />

                                    <InputError message={errors.password} />
                                </div>

                                <DialogFooter className="gap-2">
                                    <DialogClose asChild>
                                        <Button
                                            variant="secondary"
                                            className={dialogCancelButton}
                                            onClick={() =>
                                                resetAndClearErrors()
                                            }
                                        >
                                            Annuleren
                                        </Button>
                                    </DialogClose>

                                    <Button
                                        variant="destructive"
                                        className={dialogDangerButton}
                                        disabled={processing}
                                        asChild
                                    >
                                        <button
                                            type="submit"
                                            data-test="confirm-delete-user-button"
                                        >
                                            Account verwijderen
                                        </button>
                                    </Button>
                                </DialogFooter>
                            </>
                        )}
                    </Form>
                </DialogContent>
            </Dialog>
        </Panel>
    );
}
