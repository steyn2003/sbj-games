import { Form } from '@inertiajs/react';
import { TriangleAlert } from 'lucide-react';
import { useRef } from 'react';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
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

const darkDialog =
    'border-slate-200 bg-white text-slate-900 ring-1 ring-slate-200 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100 dark:ring-white/10';

const darkPasswordInput =
    'h-auto rounded-xl border border-slate-200 bg-white py-3 pl-4 pr-11 text-base text-slate-900 placeholder:text-slate-400 focus-visible:border-indigo-400 focus-visible:ring-2 focus-visible:ring-indigo-500/40 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-500';

const roseButton =
    'rounded-2xl bg-rose-500 px-5 font-bold text-white hover:bg-rose-400';

export default function DeleteUser() {
    const passwordInput = useRef<HTMLInputElement>(null);

    return (
        <section className="space-y-4 rounded-2xl bg-rose-500/10 p-5 ring-1 ring-rose-500/30">
            <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    Account verwijderen
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Verwijder je account en alle bijbehorende gegevens.
                </p>
            </div>

            <div className="flex items-start gap-3 rounded-xl bg-rose-500/10 p-4 ring-1 ring-rose-500/20">
                <TriangleAlert
                    className="size-5 shrink-0 text-rose-600 dark:text-rose-300"
                    aria-hidden
                />
                <div className="space-y-0.5 text-rose-900 dark:text-rose-100">
                    <p className="font-semibold">Let op</p>
                    <p className="text-sm text-rose-700 dark:text-rose-200/80">
                        Ga voorzichtig te werk, dit kan niet ongedaan worden
                        gemaakt.
                    </p>
                </div>
            </div>

            <Dialog>
                <DialogTrigger asChild>
                    <Button
                        variant="destructive"
                        className={roseButton}
                        data-test="delete-user-button"
                    >
                        Account verwijderen
                    </Button>
                </DialogTrigger>
                <DialogContent className={darkDialog}>
                    <DialogTitle className="text-slate-900 dark:text-white">
                        Weet je zeker dat je je account wilt verwijderen?
                    </DialogTitle>
                    <DialogDescription className="text-slate-500 dark:text-slate-400">
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
                                        className={darkPasswordInput}
                                    />

                                    <InputError
                                        className="text-rose-600 dark:text-rose-400"
                                        message={errors.password}
                                    />
                                </div>

                                <DialogFooter className="gap-2">
                                    <DialogClose asChild>
                                        <Button
                                            variant="secondary"
                                            className="rounded-2xl bg-slate-100 px-5 font-semibold text-slate-800 hover:bg-slate-200 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/15"
                                            onClick={() =>
                                                resetAndClearErrors()
                                            }
                                        >
                                            Annuleren
                                        </Button>
                                    </DialogClose>

                                    <Button
                                        variant="destructive"
                                        className={roseButton}
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
        </section>
    );
}
