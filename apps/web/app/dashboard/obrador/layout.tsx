import { requirePermission } from "@/app/lib/auth/business";

// Tema de sección + guard: requiere `canViewObrador`.
export default async function ObradorLayout({ children }: { children: React.ReactNode }) {
  await requirePermission("canViewObrador");
  return <div className="theme-obrador">{children}</div>;
}
