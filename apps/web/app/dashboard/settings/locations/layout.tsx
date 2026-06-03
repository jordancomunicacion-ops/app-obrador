import { requirePermission } from "@/app/lib/auth/business";

/** Guard: requiere `canEditSettings` sobre la empresa activa. */
export default async function LocationsLayout({ children }: { children: React.ReactNode }) {
  await requirePermission("canEditSettings");
  return <>{children}</>;
}
