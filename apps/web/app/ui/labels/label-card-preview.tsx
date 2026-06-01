"use client";

import type { NutritionSnapshot } from "@/app/lib/actions/product-labels";

const STORAGE_LABEL: Record<string, string> = {
  AMBIENT: "AMBIENTE",
  REFRIGERATED: "REFRIGERADO 0-4°C",
  FROZEN: "CONGELADO -18°C",
};

export type LabelPreviewData = {
  destination: "INTERNAL" | "SALE";
  productName: string;
  legalDenomination?: string;
  ingredients?: string;
  allergens: string[];
  weight?: string;
  lotNumber?: string;
  productionDate?: string; // YYYY-MM-DD
  expiryDate?: string; // YYYY-MM-DD
  storageMode: string;
  note?: string;
  // venta
  registryNumber?: string;
  origin?: string;
  usageInstructions?: string;
  requiresCooking?: boolean;
  operator?: string | null;
  nutrition?: NutritionSnapshot | null;
};

function fmt(d?: string) {
  if (!d) return "—";
  const dt = new Date(`${d}T00:00:00`);
  return Number.isNaN(dt.getTime()) ? d : dt.toLocaleDateString("es-ES");
}

// Resalta los alérgenos (negrita + mayúscula) dentro del texto de ingredientes.
function renderIngredients(text: string, allergens: string[]) {
  const list = allergens.filter(Boolean);
  if (!list.length) return text;
  const escaped = list.map((a) => a.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const regex = new RegExp(`(${escaped.join("|")})`, "gi");
  return text.split(regex).map((part, i) =>
    list.some((a) => a.toLowerCase() === part.toLowerCase()) ? (
      <strong key={i} className="font-extrabold uppercase">
        {part}
      </strong>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

export default function LabelCardPreview({ data }: { data: LabelPreviewData }) {
  const isSale = data.destination === "SALE";
  const n = data.nutrition ?? null;
  const hasNutrition = !!n && Object.values(n).some((v) => v !== null && v !== undefined);

  if (isSale) {
    return (
      <div
        className="bg-white border border-slate-300 shadow-sm flex flex-col mx-auto"
        style={{ width: "320px", minHeight: "210px", padding: "12px", fontFamily: "system-ui, sans-serif" }}
      >
        <div className="flex justify-between items-start border-b border-black pb-0.5 mb-1">
          <h2 className="text-[13px] font-black uppercase leading-tight">
            {data.productName || "Producto"}
          </h2>
          {data.registryNumber && (
            <div className="text-[6px] border border-black px-0.5 font-bold whitespace-nowrap">
              {data.registryNumber}
            </div>
          )}
        </div>

        {data.legalDenomination && (
          <p className="text-[8px] font-bold italic mb-0.5 leading-tight">
            {data.legalDenomination}
          </p>
        )}

        {data.ingredients && (
          <p className="text-[7px] leading-tight text-justify mb-0.5">
            <strong>Ingredientes:</strong> {renderIngredients(data.ingredients, data.allergens)}
          </p>
        )}

        <div className="grid grid-cols-2 gap-2 text-[7px] border-y border-slate-300 py-0.5 my-0.5">
          <div>
            <p>
              <strong>Cad/Cons.pref:</strong>{" "}
              <span className="text-[9px] font-black">{fmt(data.expiryDate)}</span>
            </p>
            <p>
              <strong>Lote:</strong>{" "}
              <span className="font-mono font-bold">{data.lotNumber || "—"}</span>
            </p>
          </div>
          <div className="text-right">
            {data.weight && (
              <p>
                <strong>Peso neto:</strong> <span className="text-[9px] font-black">{data.weight}</span>
              </p>
            )}
            <p>
              <strong>Elab.:</strong> {fmt(data.productionDate)}
            </p>
          </div>
        </div>

        {hasNutrition && n && (
          <p className="text-[6.5px] leading-tight mb-0.5">
            <strong>Valores medios/100g:</strong>{" "}
            {n.energyKcal != null && `${n.energyKcal} kcal · `}
            {n.fat != null && `Grasas ${n.fat}g · `}
            {n.protein != null && `Prot. ${n.protein}g · `}
            {n.salt != null && `Sal ${n.salt}g`}
          </p>
        )}

        <div className="text-[6.5px] leading-snug">
          <p>
            <strong>Conservación:</strong> {STORAGE_LABEL[data.storageMode]}
            {data.requiresCooking && " · Cocinar antes de consumir"}
          </p>
          {(data.origin || data.usageInstructions) && (
            <p>
              {data.origin && (
                <>
                  <strong>Origen:</strong> {data.origin}
                </>
              )}
              {data.origin && data.usageInstructions && " | "}
              {data.usageInstructions && (
                <>
                  <strong>Uso:</strong> {data.usageInstructions}
                </>
              )}
            </p>
          )}
          {data.operator && (
            <p className="font-bold border-t border-slate-100 pt-0.5 mt-0.5 uppercase text-slate-500">
              {data.operator}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Etiqueta de producción (interna): diseño simple.
  return (
    <div
      className="bg-white border border-slate-300 shadow-sm rounded-md flex flex-col mx-auto"
      style={{ width: "230px", minHeight: "320px", padding: "16px", fontFamily: "system-ui, sans-serif" }}
    >
      <h2 className="text-base font-extrabold text-gray-900 leading-tight">
        {data.productName || "Producto"}
      </h2>
      {data.weight && <p className="text-sm font-semibold mt-1">{data.weight}</p>}
      {data.lotNumber && (
        <p className="text-xs text-gray-700 mt-2">
          <span className="font-semibold">LOTE:</span> {data.lotNumber}
        </p>
      )}
      <div className="mt-2 space-y-0.5 text-xs">
        <p>
          <span className="font-semibold">ELAB.:</span> {fmt(data.productionDate)}
        </p>
        {data.expiryDate && (
          <p className="font-bold">
            <span>CAD.:</span> {fmt(data.expiryDate)}
          </p>
        )}
      </div>
      <div className="mt-2 bg-gray-100 px-2 py-1 rounded">
        <p className="text-xs font-bold text-center tracking-wider">
          {STORAGE_LABEL[data.storageMode]}
        </p>
      </div>
      {data.allergens.length > 0 && (
        <div className="mt-2">
          <p className="text-[10px] font-semibold uppercase">Alérgenos:</p>
          <p className="text-xs text-amber-700 font-medium">{data.allergens.join(" · ")}</p>
        </div>
      )}
      {data.ingredients && (
        <div className="mt-1">
          <p className="text-[10px] font-semibold uppercase">Ingredientes:</p>
          <p className="text-[10px] leading-tight">{data.ingredients}</p>
        </div>
      )}
      {data.note && <p className="mt-2 text-[10px] italic text-gray-600">{data.note}</p>}
    </div>
  );
}
