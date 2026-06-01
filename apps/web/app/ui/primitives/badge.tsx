import clsx from "clsx";
import type { ReactNode } from "react";

type Tone = "accent" | "neutral" | "success" | "warning" | "danger";

const TONES: Record<Tone, string> = {
  accent: "bg-[var(--accent-soft)] text-[var(--accent-soft-contrast)]",
  neutral: "bg-gray-100 text-gray-600",
  success: "bg-green-50 text-green-700",
  warning: "bg-amber-50 text-amber-700",
  danger: "bg-red-50 text-red-700",
};

export default function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
