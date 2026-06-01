import { redirect } from "next/navigation";

// El resumen de Obrador se consolidó en el Dashboard principal.
// La sección entra directa al primer detalle.
export default function ObradorRoot() {
  redirect("/dashboard/obrador/intake");
}
