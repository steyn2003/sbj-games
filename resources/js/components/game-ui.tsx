import { Head, Link } from '@inertiajs/react';
import {
    AnimatePresence,
    motion,
    useReducedMotion,
    animate as motionAnimate,
} from 'framer-motion';
import {
    ArrowLeft,
    Ban,
    Dice5,
    Drama,
    Eye,
    Minus,
    Plus,
    Rabbit,
    Smartphone,
    Timer,
    Users,
    VenetianMask,
    Volume2,
    VolumeX,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { feel, useSoundMuted } from '@/hooks/use-game-feel';
import { cn } from '@/lib/utils';
import {
    charades,
    forbiddenWord,
    home,
    horseRace,
    mexen,
    pimPamPet,
    spyLocation,
    undercover,
    wieInDeGroep,
} from '@/routes';

/**
 * House style for all game screens: one committed game-night theme.
 *
 * Ink-indigo table, a lamp glow in the game's accent color, Lilita One for
 * the big game moments, gold as the house accent. Every game gets its own
 * accent via GameShell's `accent` prop — components below pick it up through
 * the --glow custom properties (see app.css).
 */

export type GameAccent =
    | 'gold'
    | 'violet'
    | 'cyan'
    | 'rose'
    | 'orange'
    | 'pink'
    | 'emerald'
    | 'lime';

export interface GameInfo {
    title: string;
    tagline: string;
    description: string;
    href: string;
    icon: LucideIcon;
    accent: GameAccent;
}

export const GAMES: GameInfo[] = [
    {
        title: 'Undercover',
        tagline: 'Wie speelt vals?',
        description:
            'Vind de geheime bedrieger. Iedereen krijgt een woord, behalve de Undercover.',
        href: undercover().url,
        icon: Eye,
        accent: 'violet',
    },
    {
        title: 'Spion',
        tagline: 'Eén kent de locatie niet',
        description:
            'Iedereen kent de geheime locatie — behalve de Spion. Ontmasker hem of bluf je naar de winst.',
        href: spyLocation().url,
        icon: VenetianMask,
        accent: 'cyan',
    },
    {
        title: 'Verboden Woord',
        tagline: 'Omschrijf zonder te zondigen',
        description:
            'Laat de groep het woord raden zonder de verboden woorden te zeggen.',
        href: forbiddenWord().url,
        icon: Ban,
        accent: 'rose',
    },
    {
        title: 'Hints',
        tagline: 'Handen en voeten, geen woorden',
        description:
            'Beeld het woord uit zonder te praten. Wie laat de groep het meest raden binnen de tijd?',
        href: charades().url,
        icon: Drama,
        accent: 'lime',
    },
    {
        title: 'Pim Pam Pet',
        tagline: 'Snel woorden schieten',
        description:
            'Categorie + letter. Noem op tijd een passend woord en geef door.',
        href: pimPamPet().url,
        icon: Timer,
        accent: 'orange',
    },
    {
        title: 'Wie in de groep…?',
        tagline: 'Stem en drink',
        description:
            'Stem op wie de stelling het beste past. De winnaar drinkt!',
        href: wieInDeGroep().url,
        icon: Users,
        accent: 'pink',
    },
    {
        title: 'Paardenrace',
        tagline: 'Zet in en race',
        description:
            'Twee telefoons: één toont de baan, de ander deelt de kaarten. Zet in op een kleur en race!',
        href: horseRace().url,
        icon: Rabbit,
        accent: 'emerald',
    },
    {
        title: 'Mexen',
        tagline: 'Rol, bluf, drink',
        description:
            'Twee dobbelstenen, twee varianten: rol open en de laagste drinkt, of bluf stiekem en betrap de leugenaar.',
        href: mexen().url,
        icon: Dice5,
        accent: 'gold',
    },
];

export function SoundToggle({ className }: { className?: string }) {
    const { muted, toggleMuted } = useSoundMuted();

    return (
        <button
            type="button"
            onClick={toggleMuted}
            aria-label={muted ? 'Geluid aanzetten' : 'Geluid uitzetten'}
            className={cn(
                'flex size-9 items-center justify-center rounded-full bg-white/5 text-slate-400 ring-1 ring-white/10 transition hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-(--glow,var(--primary))',
                className,
            )}
        >
            {muted ? (
                <VolumeX className="size-4" aria-hidden />
            ) : (
                <Volume2 className="size-4" aria-hidden />
            )}
        </button>
    );
}

export function GameShell({
    title,
    accent = 'gold',
    back = true,
    topRight,
    children,
    className,
}: {
    title: string;
    accent?: GameAccent;
    back?: boolean;
    topRight?: ReactNode;
    children: ReactNode;
    className?: string;
}) {
    return (
        <>
            <Head title={title} />
            <div
                data-accent={accent}
                className="relative flex min-h-[100dvh] flex-col bg-background felt text-foreground"
            >
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 lamp-glow"
                />
                <main
                    className={cn(
                        'relative mx-auto flex w-full max-w-md flex-1 flex-col px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]',
                        className,
                    )}
                >
                    <div className="mb-3 flex min-h-9 items-center justify-between gap-2">
                        {back ? (
                            <Link
                                href={home()}
                                className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/5 pr-4 pl-3 text-sm font-medium text-slate-300 ring-1 ring-white/10 transition hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-(--glow)"
                            >
                                <ArrowLeft className="size-4" aria-hidden />
                                Spellen
                            </Link>
                        ) : (
                            <span />
                        )}
                        <div className="flex items-center gap-2">
                            {topRight}
                            <SoundToggle />
                        </div>
                    </div>
                    {children}
                </main>
            </div>
        </>
    );
}

export function GameHeader({
    kicker,
    title,
    description,
    className,
}: {
    kicker?: string;
    title: string;
    description?: string;
    className?: string;
}) {
    return (
        <header className={cn('mb-6', className)}>
            {kicker && (
                <p className="text-xs font-semibold tracking-widest text-(--glow-strong,var(--primary)) uppercase">
                    {kicker}
                </p>
            )}
            <h1 className="mt-1 font-display text-4xl text-white">{title}</h1>
            {description && (
                <p className="mt-2 text-sm leading-relaxed text-slate-400">
                    {description}
                </p>
            )}
        </header>
    );
}

export function Panel({
    children,
    className,
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <section
            className={cn(
                'rounded-2xl bg-white/[0.045] p-4 ring-1 ring-white/10 backdrop-blur-sm',
                className,
            )}
        >
            {children}
        </section>
    );
}

/** The accent-tinted icon disc that opens most game screens. */
export function IconBadge({
    icon: Icon,
    size = 'md',
    pulse = false,
    className,
}: {
    icon: LucideIcon;
    size?: 'md' | 'lg';
    pulse?: boolean;
    className?: string;
}) {
    return (
        <span
            aria-hidden
            className={cn(
                'flex items-center justify-center rounded-2xl bg-(--glow)/12 text-(--glow-strong) ring-1 ring-(--glow)/25',
                size === 'md' ? 'size-14' : 'size-20',
                pulse && 'animate-glow-pulse',
                className,
            )}
        >
            <Icon className={size === 'md' ? 'size-7' : 'size-10'} />
        </span>
    );
}

type ActionVariant = 'primary' | 'neutral' | 'danger' | 'success';

const actionVariants: Record<ActionVariant, string> = {
    primary:
        'bg-(--glow,var(--primary)) text-slate-950 shadow-[0_10px_32px_-12px_var(--glow,var(--primary))] hover:brightness-110',
    neutral: 'bg-white/5 text-white ring-1 ring-white/10 hover:bg-white/10',
    danger: 'bg-rose-500 text-white shadow-[0_10px_32px_-12px_var(--color-rose-500)] hover:bg-rose-400',
    success:
        'bg-emerald-400 text-slate-950 shadow-[0_10px_32px_-12px_var(--color-emerald-400)] hover:bg-emerald-300',
};

const actionBase =
    'flex h-14 w-full select-none items-center justify-center gap-2 rounded-2xl text-base font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-(--glow,var(--primary)) focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-40';

export function ActionButton({
    variant = 'primary',
    href,
    silent = false,
    className,
    children,
    onClick,
    ...props
}: {
    variant?: ActionVariant;
    href?: string;
    /** Skip the built-in tap sound/haptic. */
    silent?: boolean;
    className?: string;
    children: ReactNode;
} & Omit<
    React.ComponentPropsWithoutRef<'button'>,
    | 'className'
    | 'children'
    | 'onDrag'
    | 'onDragStart'
    | 'onDragEnd'
    | 'onAnimationStart'
>) {
    const classes = cn(actionBase, actionVariants[variant], className);

    if (href) {
        return (
            <Link
                href={href}
                className={cn(classes, 'active:scale-[0.97]')}
                onClick={() => {
                    if (!silent) {
                        feel.tap();
                    }
                }}
            >
                {children}
            </Link>
        );
    }

    return (
        <motion.button
            type="button"
            whileTap={{ scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            className={classes}
            onClick={(event) => {
                if (!silent) {
                    if (variant === 'neutral') {
                        feel.select();
                    } else {
                        feel.tap();
                    }
                }

                onClick?.(event);
            }}
            {...props}
        >
            {children}
        </motion.button>
    );
}

/**
 * Animates phase/screen changes: the old screen slips away, the new one
 * springs up. Key it on the game's phase string.
 */
export function PhaseTransition({
    phaseKey,
    children,
    className,
}: {
    phaseKey: string | number;
    children: ReactNode;
    className?: string;
}) {
    const reduceMotion = useReducedMotion();

    return (
        <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
                key={phaseKey}
                className={cn('flex min-h-0 flex-1 flex-col', className)}
                initial={
                    reduceMotion
                        ? { opacity: 0 }
                        : { opacity: 0, y: 26, scale: 0.985 }
                }
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={
                    reduceMotion
                        ? { opacity: 0 }
                        : { opacity: 0, y: -20, scale: 0.985 }
                }
                transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            >
                {children}
            </motion.div>
        </AnimatePresence>
    );
}

/**
 * A 3D flip card for secret reveals. Render the hidden side in `front` and
 * the secret in `back`; flip it by toggling `revealed`. The secret face is
 * only mounted while revealed (or mid-flip), so it can never flash early.
 */
export function FlipCard({
    revealed,
    front,
    back,
    onTap,
    className,
}: {
    revealed: boolean;
    front: ReactNode;
    back: ReactNode;
    onTap?: () => void;
    className?: string;
}) {
    const reduceMotion = useReducedMotion();

    return (
        <div
            className={cn('relative', className)}
            style={{ perspective: 1200 }}
        >
            <motion.div
                className="relative size-full"
                style={{ transformStyle: 'preserve-3d' }}
                animate={{ rotateY: revealed ? 180 : 0 }}
                transition={
                    reduceMotion
                        ? { duration: 0 }
                        : { type: 'spring', stiffness: 260, damping: 26 }
                }
                onClick={onTap}
            >
                <div
                    className="absolute inset-0"
                    style={{ backfaceVisibility: 'hidden' }}
                >
                    {front}
                </div>
                <div
                    className="absolute inset-0"
                    style={{
                        backfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)',
                    }}
                >
                    {revealed && back}
                </div>
            </motion.div>
        </div>
    );
}

/**
 * The shared pass-the-phone ritual: a full-screen gate that names who gets
 * the phone next, and only continues when they claim it.
 */
export function PassPhoneGate({
    name,
    instruction = 'Geef de telefoon door.',
    buttonLabel,
    onReady,
    children,
}: {
    name?: string;
    instruction?: string;
    buttonLabel?: string;
    onReady: () => void;
    children?: ReactNode;
}) {
    const reduceMotion = useReducedMotion();

    return (
        <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
            <motion.span
                aria-hidden
                animate={reduceMotion ? undefined : { rotate: [0, -8, 8, 0] }}
                transition={{
                    duration: 1.8,
                    repeat: Infinity,
                    ease: 'easeInOut',
                }}
                className="flex size-20 items-center justify-center rounded-3xl bg-(--glow)/12 text-(--glow-strong) ring-1 ring-(--glow)/25"
            >
                <Smartphone className="size-10" />
            </motion.span>
            <div>
                <p className="text-sm font-medium text-slate-400">
                    {instruction}
                </p>
                {name && (
                    <p className="mt-2 font-display text-5xl text-white">
                        {name}
                    </p>
                )}
            </div>
            {children}
            <div className="w-full pt-2">
                <ActionButton onClick={onReady}>
                    {buttonLabel ?? (name ? `Ik ben ${name}` : 'Ik ben klaar')}
                </ActionButton>
            </div>
        </div>
    );
}

const CONFETTI_COLORS = [
    '#fbbf24',
    '#f472b6',
    '#34d399',
    '#60a5fa',
    '#fb7185',
    '#a78bfa',
    '#ffffff',
];

/**
 * A one-shot confetti burst. Mount it with `fire` truthy (change the value to
 * fire again). Renders on a full-screen canvas, cleans itself up, and skips
 * entirely under reduced motion.
 */
export function Confetti({
    fire,
    colors = CONFETTI_COLORS,
}: {
    fire: boolean | number;
    colors?: string[];
}) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const reduceMotion = useReducedMotion();

    useEffect(() => {
        const canvas = canvasRef.current;

        if (!fire || reduceMotion || !canvas) {
            return;
        }

        const ctx = canvas.getContext('2d');

        if (!ctx) {
            return;
        }

        const scale = window.devicePixelRatio || 1;
        canvas.width = canvas.clientWidth * scale;
        canvas.height = canvas.clientHeight * scale;
        ctx.scale(scale, scale);

        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        const particles = Array.from({ length: 140 }, () => ({
            x: width / 2 + (Math.random() - 0.5) * width * 0.5,
            y: height * 0.35,
            vx: (Math.random() - 0.5) * 11,
            vy: -(4 + Math.random() * 9),
            size: 4 + Math.random() * 5,
            color: colors[Math.floor(Math.random() * colors.length)],
            rotation: Math.random() * Math.PI,
            spin: (Math.random() - 0.5) * 0.3,
        }));

        let frame = 0;
        let rafId = 0;

        const step = () => {
            frame += 1;
            ctx.clearRect(0, 0, width, height);

            for (const particle of particles) {
                particle.x += particle.vx;
                particle.y += particle.vy;
                particle.vy += 0.28;
                particle.vx *= 0.99;
                particle.rotation += particle.spin;

                ctx.save();
                ctx.translate(particle.x, particle.y);
                ctx.rotate(particle.rotation);
                ctx.fillStyle = particle.color;
                ctx.globalAlpha = Math.max(0, 1 - frame / 130);
                ctx.fillRect(
                    -particle.size / 2,
                    -particle.size / 2,
                    particle.size,
                    particle.size * 0.6,
                );
                ctx.restore();
            }

            if (frame < 140) {
                rafId = requestAnimationFrame(step);
            } else {
                ctx.clearRect(0, 0, width, height);
            }
        };

        rafId = requestAnimationFrame(step);

        return () => cancelAnimationFrame(rafId);
    }, [fire, colors, reduceMotion]);

    if (!fire || reduceMotion) {
        return null;
    }

    return (
        <canvas
            ref={canvasRef}
            aria-hidden
            className="pointer-events-none fixed inset-0 z-50 size-full"
        />
    );
}

/** A number that counts up to its value. Give it a stable key per "moment". */
export function CountUp({
    value,
    duration = 0.7,
    className,
}: {
    value: number;
    duration?: number;
    className?: string;
}) {
    const reduceMotion = useReducedMotion();
    const ref = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        const node = ref.current;

        if (!node) {
            return;
        }

        if (reduceMotion) {
            node.textContent = String(value);

            return;
        }

        const controls = motionAnimate(0, value, {
            duration,
            ease: 'easeOut',
            onUpdate: (latest) => {
                node.textContent = String(Math.round(latest));
            },
        });

        return () => controls.stop();
    }, [value, duration, reduceMotion]);

    return (
        <span ref={ref} className={cn('tabular-nums', className)}>
            0
        </span>
    );
}

/**
 * SVG countdown ring. Turns rose and pulses in the final stretch. Pure
 * presentation — the parent owns the interval.
 */
export function TimerRing({
    seconds,
    total,
    size = 176,
    className,
}: {
    seconds: number;
    total: number;
    size?: number;
    className?: string;
}) {
    const stroke = 10;
    const radius = (size - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    const fraction = total > 0 ? Math.max(0, seconds / total) : 0;
    const urgent = seconds <= 30 && seconds > 0;
    const done = seconds <= 0;
    const minutes = Math.floor(seconds / 60);
    const rest = seconds % 60;

    return (
        <div
            className={cn(
                'relative inline-flex items-center justify-center',
                className,
            )}
            style={{ width: size, height: size }}
        >
            <svg width={size} height={size} className="-rotate-90">
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    strokeWidth={stroke}
                    className="stroke-white/10"
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    strokeWidth={stroke}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference * (1 - fraction)}
                    className={cn(
                        'transition-[stroke-dashoffset,stroke] duration-1000 ease-linear',
                        urgent || done
                            ? 'stroke-rose-400'
                            : 'stroke-(--glow,var(--primary))',
                    )}
                />
            </svg>
            <span
                className={cn(
                    'absolute font-display text-4xl tabular-nums',
                    done
                        ? 'text-rose-400'
                        : urgent
                          ? 'animate-pulse text-rose-300'
                          : 'text-white',
                )}
            >
                {minutes}:{String(rest).padStart(2, '0')}
            </span>
        </div>
    );
}

/**
 * The shared celebration ritual for results and winners: confetti (when it's
 * a win), a springing icon, and a display-type verdict.
 */
export function CelebrationHeader({
    icon: Icon,
    title,
    subtitle,
    tone = 'win',
    className,
    children,
}: {
    icon: LucideIcon;
    title: string;
    subtitle?: ReactNode;
    tone?: 'win' | 'lose' | 'neutral';
    className?: string;
    children?: ReactNode;
}) {
    const reduceMotion = useReducedMotion();
    const played = useRef(false);

    useEffect(() => {
        if (played.current) {
            return;
        }

        played.current = true;

        if (tone === 'win') {
            feel.win();
        } else if (tone === 'lose') {
            feel.fail();
        }
    }, [tone]);

    return (
        <div
            className={cn(
                'flex flex-col items-center gap-4 text-center',
                className,
            )}
        >
            <Confetti fire={tone === 'win'} />
            <motion.span
                aria-hidden
                initial={
                    reduceMotion ? { opacity: 0 } : { scale: 0, rotate: -14 }
                }
                animate={
                    reduceMotion
                        ? { opacity: 1 }
                        : { scale: 1, rotate: 0, opacity: 1 }
                }
                transition={{ type: 'spring', stiffness: 300, damping: 16 }}
                className={cn(
                    'flex size-20 items-center justify-center rounded-3xl ring-1',
                    tone === 'lose'
                        ? 'bg-rose-400/12 text-rose-300 ring-rose-400/25'
                        : 'bg-(--glow)/12 text-(--glow-strong) ring-(--glow)/25',
                )}
            >
                <Icon className="size-10" />
            </motion.span>
            <div>
                <h2 className="font-display text-4xl text-white">{title}</h2>
                {subtitle && (
                    <div className="mt-2 text-sm text-slate-400">
                        {subtitle}
                    </div>
                )}
            </div>
            {children}
        </div>
    );
}

/** Shared +/- stepper for player counts and the like. */
export function Stepper({
    label,
    value,
    onChange,
    min,
    max,
    format,
}: {
    label: string;
    value: number;
    onChange: (value: number) => void;
    min: number;
    max: number;
    format?: (value: number) => string;
}) {
    const step = (delta: number) => {
        const next = Math.min(max, Math.max(min, value + delta));

        if (next !== value) {
            feel.select();
            onChange(next);
        }
    };

    return (
        <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-slate-300">{label}</span>
            <div className="flex items-center gap-1">
                <StepperButton
                    label={`${label} verlagen`}
                    disabled={value <= min}
                    onClick={() => step(-1)}
                >
                    <Minus className="size-4" aria-hidden />
                </StepperButton>
                <span className="w-12 text-center font-display text-2xl text-white tabular-nums">
                    {format ? format(value) : value}
                </span>
                <StepperButton
                    label={`${label} verhogen`}
                    disabled={value >= max}
                    onClick={() => step(1)}
                >
                    <Plus className="size-4" aria-hidden />
                </StepperButton>
            </div>
        </div>
    );
}

function StepperButton({
    label,
    disabled,
    onClick,
    children,
}: {
    label: string;
    disabled: boolean;
    onClick: () => void;
    children: ReactNode;
}) {
    return (
        <motion.button
            type="button"
            aria-label={label}
            disabled={disabled}
            whileTap={{ scale: 0.88 }}
            onClick={onClick}
            className="flex size-10 items-center justify-center rounded-xl bg-white/5 text-white ring-1 ring-white/10 transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-(--glow) disabled:pointer-events-none disabled:opacity-30"
        >
            {children}
        </motion.button>
    );
}
