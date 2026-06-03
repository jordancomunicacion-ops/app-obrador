import SideNav from '@/app/ui/dashboard/sidenav';
import TopBar from '@/app/ui/dashboard/topbar';
import { auth } from '@/auth';
import { prisma } from '@/app/lib/prisma';
import { getBusinessPermissions } from '@/app/lib/auth/business';

export default async function Layout({ children }: { children: React.ReactNode }) {
    const session = await auth();
    let appConfig = null;
    try {
        appConfig = await prisma.appConfig.findUnique({
            where: { id: 'default' },
        });
    } catch (e) {
        console.error("Database connection failed in layout:", e);
    }

    // Permisos granulares del usuario sobre la empresa activa (modelo CRM).
    // El super admin obtiene ALL_PERMISSIONS; el resto, lo que diga su BusinessAccess.
    const permissions = await getBusinessPermissions();

    return (
        <div className="flex h-screen flex-col md:flex-row md:overflow-hidden">
            <div className="w-full flex-none md:w-64">
                <SideNav
                    user={session?.user}
                    logoUrl={appConfig?.logoUrl}
                    permissions={permissions}
                />
            </div>
            <div className="flex-grow flex flex-col md:overflow-y-auto">
                <TopBar />
                <div className="flex-grow p-6 md:p-12">{children}</div>
            </div>
        </div>
    );
}
