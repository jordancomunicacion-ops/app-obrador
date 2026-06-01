import clsx from "clsx";

type Tone = "neutral" | "accent" | "success" | "warning" | "danger";

const VALUE_TONE: Record<Tone, string> = {
  neutral: "text-gray-900",
  accent: "text-[var(--accent-soft-contrast)]",
  success: "text-green-600",
  warning: "text-amber-600",
  danger: "text-red-600",
};

export default function StatCard({
  label,
  value,
  tone = "neutral",
  hint,
}: {
  label: string;
  value: string | number;
  tone?: Tone;
  hint?: string;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
      <p className={clsx("text-2xl font-bold mt-1", VALUE_TONE[tone])}>{value}</p>
      {hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
    </div>
  );
}
