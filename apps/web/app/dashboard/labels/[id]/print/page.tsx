import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { currentOrgId } from "@/auth";

const STORAGE_LABEL: Record<string, string> = {
  AMBIENT: "AMBIENTE",
  REFRIGERATED: "REFRIGERADO 0-4°C",
  FROZEN: "CONGELADO -18°C",
};

export default async function LabelPrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const orgId = await currentOrgId();
  if (!orgId) notFound();

  const l = await prisma.productLabel.findFirst({
    where: { id, ownerId: orgId },
    include: {
      location: { select: { name: true } },
      createdBy: { select: { name: true } },
    },
  });
  if (!l) notFound();

  const prod = new Date(l.productionDate);
  const exp = l.expiryDate ? new Date(l.expiryDate) : null;

  return (
    <>
      {/* Estilos: ocultar todo lo demás en print y respetar tamaño etiqueta */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
@page { size: 80mm 120mm; margin: 0; }
@media print {
  html, body { background: white; }
  aside, header, nav, .no-print { display: none !important; }
  .label-print { width: 80mm; height: 120mm; padding: 6mm; box-shadow: none; border: none; margin: 0; }
}
`,
        }}
      />

      <div className="p-6 print:p-0 bg-gray-100 min-h-screen flex flex-col items-center gap-4">
        <div className="no-print w-full max-w-md flex items-center justify-between">
          <a
            href="/dashboard/labels"
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            ← Volver
          </a>
          <button
            type="button"
            onClick={undefined as any}
            className="bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-indigo-700"
            // server-side, sin onClick: usamos JS embebido abajo
            id="print-btn"
          >
            🖨 Imprimir
          </button>
        </div>

        <div
          className="label-print bg-white shadow-lg rounded-lg p-6 w-[80mm] min-h-[120mm] flex flex-col"
          style={{ fontFamily: "system-ui, sans-serif" }}
        >
          <div className="text-center border-b-2 border-gray-800 pb-1 mb-2">
            <p className="text-[10px] uppercase tracking-widest text-gray-600">
              {l.location?.name ?? "Cocina"}
            </p>
          </div>

          <h1 className="text-lg font-extrabold text-gray-900 leading-tight">
            {l.productName}
          </h1>

          {l.weight && <p className="text-sm font-semibold mt-1">{l.weight}</p>}

          {l.lotNumber && (
            <p className="text-xs text-gray-700 mt-2">
              <span className="font-semibold">LOTE:</span> {l.lotNumber}
            </p>
          )}

          <div className="mt-2 space-y-0.5 text-xs">
            <p>
              <span className="font-semibold">ELAB.:</span>{" "}
              {prod.toLocaleDateString("es-ES")}
            </p>
            {exp && (
              <p className="font-bold">
                <span>CAD.:</span> {exp.toLocaleDateString("es-ES")}
              </p>
            )}
          </div>

          <div className="mt-2 bg-gray-100 px-2 py-1 rounded">
            <p className="text-xs font-bold text-center tracking-wider">
              {STORAGE_LABEL[l.storageMode]}
            </p>
          </div>

          {l.allergens.length > 0 && (
            <div className="mt-2">
              <p className="text-[10px] font-semibold uppercase">Alérgenos:</p>
              <p className="text-xs text-amber-700 font-medium">
                {l.allergens.join(" · ")}
              </p>
            </div>
          )}

          {l.ingredients && (
            <div className="mt-1">
              <p className="text-[10px] font-semibold uppercase">Ingredientes:</p>
              <p className="text-[10px] leading-tight">{l.ingredients}</p>
            </div>
          )}

          {l.note && (
            <p className="mt-2 text-[10px] italic text-gray-600">{l.note}</p>
          )}

          <div className="mt-auto pt-2 border-t border-dashed border-gray-300 text-[9px] text-gray-500 text-center">
            {l.createdBy?.name && `Resp.: ${l.createdBy.name}`}
          </div>
        </div>

        <script
          dangerouslySetInnerHTML={{
            __html: `
document.getElementById('print-btn').addEventListener('click', () => window.print());
setTimeout(() => window.print(), 250);
`,
          }}
        />
      </div>
    </>
  );
}
