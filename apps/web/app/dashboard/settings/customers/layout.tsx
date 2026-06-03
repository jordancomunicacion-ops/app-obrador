import { requirePermission } from "@/app/lib/auth/business";

/** Guard: requiere `canManageDirectory` sobre la empresa activa. */
export default async function CustomersLayout({ children }: { children: React.ReactNode }) {
  await requirePermission("canManageDirectory");
  return <>{children}</>;
}
