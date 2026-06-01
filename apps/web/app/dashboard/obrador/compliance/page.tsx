import { redirect } from "next/navigation";

// El resumen de Controles sanitarios se consolidó en el Dashboard principal.
// La sección entra directa al primer detalle.
export default function ComplianceRoot() {
  redirect("/dashboard/obrador/compliance/temperatures");
}
