import Link from "next/link";
import clsx from "clsx";
import type { ReactNode } from "react";

const BASE = "bg-white border border-gray-200 rounded-xl shadow-sm";
const INTERACTIVE =
  "transition-all hover:shadow-md hover:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]";

export default function Card({
  href,
  interactive,
  className,
  children,
}: {
  href?: string;
  interactive?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const cls = clsx(BASE, (interactive || href) && INTERACTIVE, className);
  if (href) {
    return (
      <Link href={href} className={clsx(cls, "block group")}>
        {children}
      </Link>
    );
  }
  return <div className={cls}>{children}</div>;
}
