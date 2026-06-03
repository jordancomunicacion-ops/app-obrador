import { requirePermission } from "@/app/lib/auth/business";

/** Guard: requiere `canViewCatalog` sobre la empresa activa. */
export default async function RecipesLayout({ children }: { children: React.ReactNode }) {
  await requirePermission("canViewCatalog");
  return <>{children}</>;
}
