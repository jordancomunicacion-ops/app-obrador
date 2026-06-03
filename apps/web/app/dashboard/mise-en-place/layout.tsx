import { requirePermission } from "@/app/lib/auth/business";

/** Guard: requiere `canViewOperations` sobre la empresa activa. */
export default async function MiseEnPlaceLayout({ children }: { children: React.ReactNode }) {
  await requirePermission("canViewOperations");
  return <>{children}</>;
}
