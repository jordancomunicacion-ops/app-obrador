import { requirePermission } from "@/app/lib/auth/business";

/** Guard: gestión de locales requiere `canEditSettings` (modelo CRM). */
export default async function LocationsLayout({ children }: { children: React.ReactNode }) {
    await requirePermission("canEditSettings");
    return <>{children}</>;
}
