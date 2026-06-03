import { requirePermission } from "@/app/lib/auth/business";

/** Guard: requiere `canViewEvents` sobre la empresa activa. */
export default async function EventsLayout({ children }: { children: React.ReactNode }) {
  await requirePermission("canViewEvents");
  return <>{children}</>;
}
