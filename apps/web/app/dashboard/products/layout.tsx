import { requirePermission } from "@/app/lib/auth/business";

/** Guard: requiere `canViewCatalog` sobre la empresa activa. */
export default async function ProductsLayout({ children }: { children: React.ReactNode }) {
  await requirePermission("canViewCatalog");
  return <>{children}</>;
}
