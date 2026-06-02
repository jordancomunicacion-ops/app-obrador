import { KeyIcon } from "@heroicons/react/24/outline";
import PageHeader from "@/app/ui/primitives/page-header";
import { getCurrentIntegrationKey } from "@/app/lib/actions/integration-key";
import IntegrationKeyPanel from "./integration-key-panel";

export const dynamic = "force-dynamic";
export const metadata = { title: "Integración CRM" };

export default async function IntegrationSettingsPage() {
  const current = await getCurrentIntegrationKey();

  return (
    <main>
      <PageHeader icon={<KeyIcon className="w-6 h-6" />} title="Integración CRM" />
      <div className="max-w-2xl">
        <IntegrationKeyPanel initialKey={current?.key ?? null} />
      </div>
    </main>
  );
}
