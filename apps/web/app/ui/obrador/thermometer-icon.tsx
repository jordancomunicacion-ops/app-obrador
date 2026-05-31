// Heroicons no incluye un termómetro; este SVG inline mantiene la semántica
// con la misma API (className) que el resto de iconos.
export default function ThermometerIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.75 14.5V5.25a2.25 2.25 0 0 1 4.5 0v9.25a3.75 3.75 0 1 1-4.5 0Z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 17.25a1.5 1.5 0 1 1-.001.001M12 9v6" />
    </svg>
  );
}
