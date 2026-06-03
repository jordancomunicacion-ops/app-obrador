import { notFound } from "next/navigation";
import { prisma } from "@/app/lib/prisma";
import { currentOrgId } from "@/auth";

const STORAGE_LABEL: Record<string, string> = {
  AMBIENT: "AMBIENTE",
  REFRIGERATED: "REFRIGERADO 0-4°C",
  FROZEN: "CONGELADO -18°C",
};

// Tamaños físicos de etiqueta de venta (ancho × alto en mm).
const TEMPLATE_MM: Record<string, { w: number; h: number }> = {
  "100x70": { w: 100, h: 70 },
  "100x50": { w: 100, h: 50 },
  "80x50": { w: 80, h: 50 },
  "60x40": { w: 60, h: 40 },
};

type Nutrition = {
  energyKj?: number | null;
  energyKcal?: number | null;
  fat?: number | null;
  saturatedFat?: number | null;
  carbs?: number | null;
  sugars?: number | null;
  protein?: number | null;
  salt?: number | null;
};

// Resalta los alérgenos (negrita + mayúscula) dentro del texto de ingredientes.
function renderIngredients(text: string, allergens: string[]) {
  if (!allergens.length) return text;
  const escaped = allergens
    .filter(Boolean)
    .map((a) => a.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  if (!escaped.length) return text;
  const regex = new RegExp(`(${escaped.join("|")})`, "gi");
  const parts = text.split(regex);
  return parts.map((part, i) =>
    allergens.some((a) => a.toLowerCase() === part.toLowerCase()) ? (
      <strong key={i} className="font-extrabold uppercase">
        {part}
      </strong>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

export default async function LabelPrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const orgId = await currentOrgId();
  if (!orgId) notFound();

  const l = await prisma.productLabel.findFirst({
    where: { id, businessId: orgId },
    include: {
      location: { select: { name: true } },
      createdBy: { select: { name: true } },
    },
  });
  if (!l) notFound();

  const prod = new Date(l.productionDate);
  const exp = l.expiryDate ? new Date(l.expiryDate) : null;

  // ---------------------------------------------------------------------------
  // ETIQUETA DE VENTA (destination = SALE): diseño legal completo.
  // ---------------------------------------------------------------------------
  if (l.destination === "SALE") {
    const tpl = TEMPLATE_MM[l.labelTemplate ?? "100x70"] ?? TEMPLATE_MM["100x70"];
    const n = (l.nutritionSnapshot as Nutrition | null) ?? null;
    const hasNutrition =
      n && Object.values(n).some((v) => v !== null && v !== undefined);

    return (
      <>
        <style
          dangerouslySetInnerHTML={{
            __html: `
@page { size: ${tpl.w}mm ${tpl.h}mm; margin: 0; }
@media print {
  html, body { background: white; }
  aside, header, nav, .no-print { display: none !important; }
  .label-print { width: ${tpl.w}mm; height: ${tpl.h}mm; box-shadow: none; border: none; margin: 0; }
}
`,
          }}
        />

        <div className="p-6 print:p-0 bg-gray-100 min-h-screen flex flex-col items-center gap-4">
          <div className="no-print w-full max-w-2xl flex items-center justify-between">
            <a href="/dashboard/labels" className="text-sm text-gray-600 hover:text-gray-800">
              ← Volver
            </a>
            <span className="text-xs text-gray-500">Plantilla {l.labelTemplate ?? "100x70"} mm</span>
            <button
              type="button"
              className="bg-emerald-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-emerald-700"
              id="print-btn"
            >
              🖨 Imprimir
            </button>
          </div>

          <div
            className="label-print bg-white shadow-lg border border-slate-300 flex flex-col"
            style={{
              width: `${tpl.w}mm`,
              height: `${tpl.h}mm`,
              padding: "3mm",
              fontFamily: "system-ui, sans-serif",
            }}
          >
            <div className="flex justify-between items-start border-b border-black pb-0.5 mb-1">
              <h1 className="text-[11px] font-black uppercase leading-tight">{l.productName}</h1>
              {l.registryNumber && (
                <div className="text-[6px] border border-black px-0.5 font-bold whitespace-nowrap">
                  {l.registryNumber}
                </div>
              )}
            </div>

            {l.legalDenomination && (
              <p className="text-[7px] font-bold italic mb-0.5 leading-tight">
                {l.legalDenomination}
              </p>
            )}

            {l.ingredients && (
              <p className="text-[6.5px] leading-tight text-justify mb-0.5">
                <strong>Ingredientes:</strong>{" "}
                {renderIngredients(l.ingredients, l.allergens)}
              </p>
            )}

            <div className="grid grid-cols-2 gap-2 text-[6.5px] border-y border-slate-300 py-0.5 my-0.5">
              <div>
                <p>
                  <strong>Cad/Cons.pref:</strong>{" "}
                  <span className="text-[8px] font-black">
                    {exp ? exp.toLocaleDateString("es-ES") : "—"}
                  </span>
                </p>
                <p>
                  <strong>Lote:</strong>{" "}
                  <span className="font-mono font-bold">{l.lotNumber ?? "—"}</span>
                </p>
              </div>
              <div className="text-right">
                {l.weight && (
                  <p>
                    <strong>Peso neto:</strong>{" "}
                    <span className="text-[8px] font-black">{l.weight}</span>
                  </p>
                )}
                <p>
                  <strong>Elab.:</strong> {prod.toLocaleDateString("es-ES")}
                </p>
              </div>
            </div>

            {hasNutrition && n && (
              <p className="text-[6px] leading-tight mb-0.5">
                <strong>Valores medios/100g:</strong>{" "}
                {n.energyKcal != null && `${n.energyKcal} kcal · `}
                {n.fat != null && `Grasas ${n.fat}g `}
                {n.saturatedFat != null && `(sat. ${n.saturatedFat}g) · `}
                {n.carbs != null && `H.C. ${n.carbs}g `}
                {n.sugars != null && `(azúc. ${n.sugars}g) · `}
                {n.protein != null && `Prot. ${n.protein}g · `}
                {n.salt != null && `Sal ${n.salt}g`}
              </p>
            )}

            <div className="text-[6px] leading-snug">
              <p>
                <strong>Conservación:</strong> {STORAGE_LABEL[l.storageMode]}
                {l.requiresCooking && " · Cocinar antes de consumir"}
              </p>
              {(l.origin || l.usageInstructions) && (
                <p>
                  {l.origin && (
                    <>
                      <strong>Origen:</strong> {l.origin}
                    </>
                  )}
                  {l.origin && l.usageInstructions && " | "}
                  {l.usageInstructions && (
                    <>
                      <strong>Uso:</strong> {l.usageInstructions}
                    </>
                  )}
                </p>
              )}
            </div>

            <div className="mt-auto flex justify-between items-end pt-0.5 border-t border-slate-200">
              <p className="text-[5.5px] font-bold uppercase text-slate-600 leading-tight max-w-[70%]">
                {l.location?.name ?? "Obrador"}
              </p>
              <div className="text-[5px] text-slate-400">{l.lotNumber ?? ""}</div>
            </div>
          </div>

          <p className="no-print text-xs text-gray-400">
            ZPL/Zebra: exporta a PDF e imprime, o usa el envío industrial (próximamente).
          </p>

          <script
            dangerouslySetInnerHTML={{
              __html: `
document.getElementById('print-btn').addEventListener('click', () => window.print());
setTimeout(() => window.print(), 300);
`,
            }}
          />
        </div>
      </>
    );
  }

  // ---------------------------------------------------------------------------
  // ETIQUETA INTERNA (destination = INTERNAL): diseño simple 80×120.
  // ---------------------------------------------------------------------------
  return (
    <>
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
          <a href="/dashboard/labels" className="text-sm text-gray-600 hover:text-gray-800">
            ← Volver
          </a>
          <button
            type="button"
            className="bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-indigo-700"
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

          <h1 className="text-lg font-extrabold text-gray-900 leading-tight">{l.productName}</h1>

          {l.weight && <p className="text-sm font-semibold mt-1">{l.weight}</p>}

          {l.lotNumber && (
            <p className="text-xs text-gray-700 mt-2">
              <span className="font-semibold">LOTE:</span> {l.lotNumber}
            </p>
          )}

          <div className="mt-2 space-y-0.5 text-xs">
            <p>
              <span className="font-semibold">ELAB.:</span> {prod.toLocaleDateString("es-ES")}
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
              <p className="text-xs text-amber-700 font-medium">{l.allergens.join(" · ")}</p>
            </div>
          )}

          {l.ingredients && (
            <div className="mt-1">
              <p className="text-[10px] font-semibold uppercase">Ingredientes:</p>
              <p className="text-[10px] leading-tight">{l.ingredients}</p>
            </div>
          )}

          {l.note && <p className="mt-2 text-[10px] italic text-gray-600">{l.note}</p>}

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
