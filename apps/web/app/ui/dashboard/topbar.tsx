import { listLocations, currentLocationId } from "@/app/lib/auth/location";
import {
    listBusinessesForCurrentUser,
    currentBusinessId,
} from "@/app/lib/auth/business";
import { auth } from "@/auth";
import { isPlatformOwner } from "@/app/lib/auth/platform";
import LocationSwitcher from "@/app/ui/locations/location-switcher";
import BusinessSwitcher from "@/app/ui/businesses/business-switcher";
import PWAInstaller from "@/app/ui/pwa/pwa-installer";
import NotificationsToggle from "@/app/ui/pwa/notifications-toggle";
import PendingBadge from "@/app/ui/dashboard/pending-badge";

export default async function TopBar() {
    const session = await auth();
    const isOwner = isPlatformOwner(session);
    const [locations, activeLocationId, businesses, activeBusinessId] = await Promise.all([
        listLocations(),
        currentLocationId(),
        listBusinessesForCurrentUser(),
        currentBusinessId(),
    ]);
    const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

    return (
        <div className="flex items-center justify-end gap-3 px-6 py-3 border-b border-gray-100 bg-white">
            <PendingBadge />
            {vapidPublic && <NotificationsToggle publicKey={vapidPublic} />}
            <PWAInstaller />
            {(businesses.length > 0 || isOwner) && (
                <BusinessSwitcher
                    businesses={businesses}
                    activeId={activeBusinessId}
                    isPlatformOwner={isOwner}
                />
            )}
            {locations.length > 0 && (
                <LocationSwitcher locations={locations} activeId={activeLocationId} />
            )}
        </div>
    );
}
