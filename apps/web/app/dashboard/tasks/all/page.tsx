import { redirect } from "next/navigation";

// El resumen "Todo el trabajo" se consolidó en el Dashboard principal.
// Se mantiene la ruta por compatibilidad.
export default function AllWorkRedirect() {
  redirect("/dashboard");
}
