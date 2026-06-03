import { requirePermission } from "@/app/lib/auth/business";

/** Guard: requiere `canViewDashboard` sobre la empresa activa. */
export default async function TodayLayout({ children }: { children: React.ReactNode }) {
  await requirePermission("canViewDashboard");
  return <>{children}</>;
}
