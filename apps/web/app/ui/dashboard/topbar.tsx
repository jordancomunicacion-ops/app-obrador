import { listLocations, currentLocationId } from "@/lib/auth/location";
import LocationSwitcher from "@/app/ui/locations/location-switcher";
import PWAInstaller from "@/app/ui/pwa/pwa-installer";
import PendingBadge from "@/app/ui/dashboard/pending-badge";

export default async function TopBar() {
  const [locations, activeId] = await Promise.all([listLocations(), currentLocationId()]);

  return (
    <div className="flex items-center justify-end gap-3 px-6 py-3 border-b border-gray-100 bg-white">
      <PendingBadge />
      <PWAInstaller />
      {locations.length > 0 && (
        <LocationSwitcher locations={locations} activeId={activeId} />
      )}
    </div>
  );
}
