import { requirePermission } from "@/app/lib/auth/business";

/** Guard: requiere `canViewEmployees` sobre la empresa activa. */
export default async function EmployeesLayout({ children }: { children: React.ReactNode }) {
  await requirePermission("canViewEmployees");
  return <>{children}</>;
}
