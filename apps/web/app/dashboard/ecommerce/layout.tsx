import { requirePermission } from "@/app/lib/auth/business";

/** Guard: requiere `canViewEcommerce` sobre la empresa activa. */
export default async function EcommerceLayout({ children }: { children: React.ReactNode }) {
  await requirePermission("canViewEcommerce");
  return <>{children}</>;
}
