import { requirePermission } from "@/app/lib/auth/business";

/** Guard: requiere `canViewCommunications` sobre la empresa activa. */
export default async function CommunicationsLayout({ children }: { children: React.ReactNode }) {
  await requirePermission("canViewCommunications");
  return <>{children}</>;
}
