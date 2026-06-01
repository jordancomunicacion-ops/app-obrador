"use client";

import { useState, useTransition, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { CameraIcon, PrinterIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { createLabel } from "@/app/lib/actions/product-labels";
import type {
  ObradorLabelSource,
  ObradorProductOption,
} from "@/app/lib/actions/product-labels";
import LabelCardPreview from "@/app/ui/labels/label-card-preview";

const ALLERGENS = [
  "Gluten",
  "Crustáceos",
  "Huevos",
  "Pescado",
  "Cacahuetes",
  "Soja",
  "Lácteos",
  "Frutos cáscara",
  "Apio",
  "Mostaza",
  "Sésamo",
  "Sulfitos",
  "Altramuces",
  "Moluscos",
];

const STORAGE_MODES: { value: "AMBIENT" | "REFRIGERATED" | "FROZEN"; label: string }[] = [
  { value: "AMBIENT", label: "Ambiente" },
  { value: "REFRIGERATED", label: "Refrigerado (0–4ºC)" },
  { value: "FROZEN", label: "Congelado (-18ºC)" },
];

const TEMPLATES = [
  { value: "100x70", label: "100 × 70 mm (Grande)" },
  { value: "100x50", label: "100 × 50 mm (Estándar)" },
  { value: "80x50", label: "80 × 50 mm (Mediana)" },
  { value: "60x40", label: "60 × 40 mm (Pequeña)" },
];

type Destination = "INTERNAL" | "SALE";
type StorageMode = "AMBIENT" | "REFRIGERATED" | "FROZEN";

export default function LabelForm({
  source,
  initialDestination = "INTERNAL",
  initialProductId = "",
  initialBatchId = "",
}: {
  source?: ObradorLabelSource;
  initialDestination?: Destination;
  initialProductId?: string;
  initialBatchId?: string;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const products = source?.products ?? [];
  const hasObrador = products.length > 0;

  const today = new Date().toISOString().slice(0, 10);
  const [destination, setDestination] = useState<Destination>(
    initialDestination === "SALE" && hasObrador ? "SALE" : "INTERNAL",
  );

  const [productName, setProductName] = useState("");
  const [lotNumber, setLotNumber] = useState("");
  const [productionDate, setProductionDate] = useState(today);
  const [expiryDate, setExpiryDate] = useState("");
  const [storageMode, setStorageMode] = useState<StorageMode>("REFRIGERATED");
  const [allergens, setAllergens] = useState<string[]>([]);
  const [ingredients, setIngredients] = useState("");
  const [weight, setWeight] = useState("");
  const [note, setNote] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);

  // Etiqueta de venta
  const [masterProductId, setObradorProductId] = useState("");
  const [obradorBatchId, setObradorBatchId] = useState("");
  const [legalDenomination, setLegalDenomination] = useState("");
  const [registryNumber, setRegistryNumber] = useState("");
  const [origin, setOrigin] = useState("España");
  const [usageInstructions, setUsageInstructions] = useState("");
  const [requiresCooking, setRequiresCooking] = useState(false);
  const [labelTemplate, setLabelTemplate] = useState("100x70");

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === masterProductId) ?? null,
    [products, masterProductId],
  );

  // Lista de chips de alérgenos = los 14 estándar + cualquiera heredado de la receta.
  const allergenChips = useMemo(() => {
    const set = new Set<string>(ALLERGENS);
    allergens.forEach((a) => set.add(a));
    return Array.from(set);
  }, [allergens]);

  function applyProduct(p: ObradorProductOption | null) {
    if (!p) return;
    setProductName(p.name);
    setLegalDenomination(p.legalDenomination ?? "");
    setStorageMode(p.storageMode);
    setIngredients(p.ingredientsText ?? "");
    setAllergens(p.allergens);
    setUsageInstructions(p.usageInstructions ?? "");
    setRequiresCooking(p.requiresCooking);
    setLabelTemplate(p.labelTemplate || "100x70");
    setRegistryNumber(p.registryNumber ?? "");
    setOrigin(p.origin ?? "España");
    if (p.defaultWeight)
      setWeight(`${p.defaultWeight}${p.saleFormat === "peso" ? " kg" : ""}`.trim());
    // Reset lote y deja que el usuario elija uno.
    setObradorBatchId("");
  }

  function applyBatch(p: ObradorProductOption | null, batchId: string) {
    const b = p?.batches.find((x) => x.id === batchId);
    if (!b) return;
    setLotNumber(b.batchCode);
    setProductionDate(b.productionDate);
    setExpiryDate(b.expiryDate);
  }

  function onSelectProduct(id: string) {
    setObradorProductId(id);
    applyProduct(products.find((p) => p.id === id) ?? null);
  }

  function onSelectBatch(id: string) {
    setObradorBatchId(id);
    applyBatch(selectedProduct, id);
  }

  // Preselección desde obrador (deep-link): aplica producto/lote una sola vez.
  const didInit = useRef(false);
  if (!didInit.current && initialDestination === "SALE" && initialProductId && hasObrador) {
    didInit.current = true;
    const p = products.find((x) => x.id === initialProductId) ?? null;
    if (p) {
      setObradorProductId(initialProductId);
      applyProduct(p);
      if (initialBatchId) {
        setObradorBatchId(initialBatchId);
        applyBatch(p, initialBatchId);
      }
    }
  }

  async function uploadPhoto(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("prefix", "labels");
      const res = await fetch("/api/uploads/photo", { method: "POST", body: fd });
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      setPhotoUrl(json.url);
    } catch (e) {
      alert("Error: " + (e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  function toggleAllergen(a: string) {
    setAllergens((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));
  }

  function suggestExpiry(days: number) {
    const d = new Date(productionDate + "T00:00:00Z");
    d.setUTCDate(d.getUTCDate() + days);
    setExpiryDate(d.toISOString().slice(0, 10));
  }

  function resetForm() {
    setProductName("");
    setLotNumber("");
    setExpiryDate("");
    setAllergens([]);
    setIngredients("");
    setWeight("");
    setNote("");
    setPhotoUrl(null);
    setObradorProductId("");
    setObradorBatchId("");
    setLegalDenomination("");
    setOrigin("España");
    setUsageInstructions("");
    setRequiresCooking(false);
  }

  function handleSubmit(printAfter: boolean) {
    if (!productName.trim()) {
      alert("Producto obligatorio");
      return;
    }
    if (destination === "SALE" && !legalDenomination.trim()) {
      alert("La denominación legal es obligatoria en etiquetas de venta");
      return;
    }
    setBusy(true);
    startTransition(async () => {
      try {
        const created = await createLabel({
          destination,
          productName,
          lotNumber,
          productionDate,
          expiryDate: expiryDate || null,
          storageMode,
          allergens,
          ingredients,
          weight,
          note,
          photoUrl,
          ...(destination === "SALE"
            ? {
                masterProductId: masterProductId || null,
                obradorBatchId: obradorBatchId || null,
                legalDenomination,
                registryNumber,
                origin,
                usageInstructions,
                requiresCooking,
                labelTemplate,
                nutritionSnapshot: selectedProduct?.nutrition ?? null,
              }
            : {}),
        });
        if (printAfter) {
          window.open(`/dashboard/labels/${created.id}/print`, "_blank");
        }
        resetForm();
        router.refresh();
      } catch (e) {
        alert((e as Error).message);
      } finally {
        setBusy(false);
      }
    });
  }

  const isSale = destination === "SALE";

  return (
    <div className="space-y-3">
      {/* Selector de destino */}
      <div className="bg-white border border-gray-200 rounded-xl p-1 flex">
        <button
          type="button"
          onClick={() => setDestination("INTERNAL")}
          className={
            (!isSale
              ? "bg-indigo-600 text-white "
              : "text-gray-600 hover:bg-gray-50 ") +
            "flex-1 text-sm font-medium px-3 py-2 rounded-lg transition-colors"
          }
        >
          Producción
        </button>
        <button
          type="button"
          onClick={() => hasObrador && setDestination("SALE")}
          disabled={!hasObrador}
          title={hasObrador ? undefined : "No hay productos de obrador configurados"}
          className={
            (isSale
              ? "bg-emerald-600 text-white "
              : "text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-transparent ") +
            "flex-1 text-sm font-medium px-3 py-2 rounded-lg transition-colors"
          }
        >
          Venta
        </button>
      </div>
      <p className="text-xs text-gray-500 -mt-1">
        {isSale
          ? "Etiqueta legal (Reg. UE 1169/2011) heredada de una ficha de producto y un lote del obrador."
          : "Etiqueta de producción para uso interno y trazabilidad APPCC."}
      </p>

      <div className="bg-white border border-gray-200 rounded-xl p-3 space-y-3">
        {/* Selección de producto/lote de obrador (solo venta) */}
        {isSale && (
          <div className="grid grid-cols-1 gap-2 pb-2 mb-1 border-b border-gray-100">
            <label className="block text-xs font-medium text-gray-600">
              Producto de obrador
              <select
                value={masterProductId}
                onChange={(e) => onSelectProduct(e.target.value)}
                className="mt-1 w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
              >
                <option value="">— Selecciona producto —</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-medium text-gray-600">
              Lote de producción
              <select
                value={obradorBatchId}
                onChange={(e) => onSelectBatch(e.target.value)}
                disabled={!selectedProduct}
                className="mt-1 w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm disabled:opacity-50"
              >
                <option value="">— Sin lote / manual —</option>
                {selectedProduct?.batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.batchCode} · cad {b.expiryDate}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}

        <label className="block text-xs font-medium text-gray-600">
          Producto *
          <input
            type="text"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="Crema de calabaza"
            className="mt-1 w-full border border-gray-300 rounded-lg px-2 py-1.5 text-base"
            required
          />
        </label>

        {isSale && (
          <label className="block text-xs font-medium text-gray-600">
            Denominación legal *
            <input
              type="text"
              value={legalDenomination}
              onChange={(e) => setLegalDenomination(e.target.value)}
              placeholder="Preparado de carne picada de vacuno"
              className="mt-1 w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
            />
          </label>
        )}

        <div className="grid grid-cols-2 gap-2">
          <label className="block text-xs font-medium text-gray-600">
            Lote
            <input
              type="text"
              value={lotNumber}
              onChange={(e) => setLotNumber(e.target.value)}
              placeholder="L-2026-001"
              className="mt-1 w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
            />
          </label>
          <label className="block text-xs font-medium text-gray-600">
            Peso/cantidad
            <input
              type="text"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="500 g"
              className="mt-1 w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <label className="block text-xs font-medium text-gray-600">
            Elaboración *
            <input
              type="date"
              value={productionDate}
              onChange={(e) => setProductionDate(e.target.value)}
              className="mt-1 w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
            />
          </label>
          <label className="block text-xs font-medium text-gray-600">
            {isSale ? "Cad./Cons. pref." : "Caducidad"}
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="mt-1 w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
            />
          </label>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {[
            { d: 1, l: "+1 día" },
            { d: 2, l: "+2 días" },
            { d: 3, l: "+3 días" },
            { d: 5, l: "+5 días" },
            { d: 7, l: "+7 días" },
            { d: 30, l: "+30 días" },
            { d: 90, l: "+90 días" },
          ].map((p) => (
            <button
              key={p.d}
              type="button"
              onClick={() => suggestExpiry(p.d)}
              className="text-xs px-2 py-0.5 border border-gray-300 rounded hover:bg-gray-50"
            >
              {p.l}
            </button>
          ))}
        </div>

        <label className="block text-xs font-medium text-gray-600">
          Conservación
          <select
            value={storageMode}
            onChange={(e) => setStorageMode(e.target.value as StorageMode)}
            className="mt-1 w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
          >
            {STORAGE_MODES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>

        {isSale && (
          <label className="block text-xs font-medium text-gray-600">
            Ingredientes
            <textarea
              value={ingredients}
              onChange={(e) => setIngredients(e.target.value)}
              rows={3}
              placeholder="Carne de vacuno (95%), agua, sal, especias…"
              className="mt-1 w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
            />
            <span className="text-[10px] text-gray-400">
              Los alérgenos seleccionados se resaltarán en negrita dentro del texto.
            </span>
          </label>
        )}

        <div>
          <p className="text-xs font-medium text-gray-600 mb-1">Alérgenos</p>
          <div className="flex flex-wrap gap-1.5">
            {allergenChips.map((a) => {
              const active = allergens.includes(a);
              return (
                <button
                  key={a}
                  type="button"
                  onClick={() => toggleAllergen(a)}
                  className={
                    active
                      ? "px-2 py-0.5 text-xs font-medium rounded-full border bg-amber-50 text-amber-700 border-amber-300"
                      : "px-2 py-0.5 text-xs font-medium rounded-full border bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  }
                >
                  {a}
                </button>
              );
            })}
          </div>
        </div>

        {/* Campos legales adicionales (solo venta) */}
        {isSale && (
          <div className="space-y-3 pt-2 border-t border-gray-100">
            <div className="grid grid-cols-2 gap-2">
              <label className="block text-xs font-medium text-gray-600">
                Nº registro sanitario
                <input
                  type="text"
                  value={registryNumber}
                  onChange={(e) => setRegistryNumber(e.target.value)}
                  placeholder="ES-10.00000/M"
                  className="mt-1 w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
                />
              </label>
              <label className="block text-xs font-medium text-gray-600">
                Origen
                <input
                  type="text"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  placeholder="España"
                  className="mt-1 w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
                />
              </label>
            </div>
            <label className="block text-xs font-medium text-gray-600">
              Modo de empleo
              <input
                type="text"
                value={usageInstructions}
                onChange={(e) => setUsageInstructions(e.target.value)}
                placeholder="Cocinar completamente antes de su consumo."
                className="mt-1 w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
              />
            </label>
            <div className="grid grid-cols-2 gap-2 items-end">
              <label className="block text-xs font-medium text-gray-600">
                Plantilla
                <select
                  value={labelTemplate}
                  onChange={(e) => setLabelTemplate(e.target.value)}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
                >
                  {TEMPLATES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-2 text-xs font-medium text-gray-600 pb-2">
                <input
                  type="checkbox"
                  checked={requiresCooking}
                  onChange={(e) => setRequiresCooking(e.target.checked)}
                  className="rounded border-gray-300"
                />
                Requiere cocinado
              </label>
            </div>
            {selectedProduct && (
              <div className="text-[10px] text-gray-500 bg-gray-50 rounded-lg p-2">
                <span className="font-semibold">Info nutricional (snapshot):</span>{" "}
                {selectedProduct.nutrition.energyKcal != null
                  ? `${selectedProduct.nutrition.energyKcal} kcal · `
                  : ""}
                {selectedProduct.nutrition.fat != null
                  ? `Grasas ${selectedProduct.nutrition.fat}g · `
                  : ""}
                {selectedProduct.nutrition.protein != null
                  ? `Proteínas ${selectedProduct.nutrition.protein}g · `
                  : ""}
                {selectedProduct.nutrition.salt != null
                  ? `Sal ${selectedProduct.nutrition.salt}g`
                  : ""}
                {selectedProduct.nutrition.energyKcal == null && "sin datos en el producto"}
              </div>
            )}
          </div>
        )}

        <label className="block text-xs font-medium text-gray-600">
          Nota
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Opcional..."
            className="mt-1 w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
          />
        </label>

        <div>
          <p className="text-xs font-medium text-gray-600 mb-1">Foto (opcional)</p>
          {photoUrl ? (
            <div className="relative inline-block">
              <img
                src={photoUrl}
                alt=""
                className="w-20 h-20 object-cover rounded-lg border border-gray-200"
              />
              <button
                type="button"
                onClick={() => setPhotoUrl(null)}
                className="absolute -top-1 -right-1 bg-white border border-gray-300 rounded-full p-0.5"
              >
                <XMarkIcon className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                hidden
                onChange={(e) => e.target.files?.[0] && uploadPhoto(e.target.files[0])}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="text-xs px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 inline-flex items-center gap-1"
              >
                <CameraIcon className="w-3.5 h-3.5" />
                {uploading ? "..." : "Foto"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Vista previa en vivo (refleja lo que se imprimirá) */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          Vista previa
        </p>
        <LabelCardPreview
          data={{
            destination,
            productName,
            legalDenomination,
            ingredients,
            allergens,
            weight,
            lotNumber,
            productionDate,
            expiryDate,
            storageMode,
            note,
            registryNumber,
            origin,
            usageInstructions,
            requiresCooking,
            operator: selectedProduct?.operator ?? null,
            nutrition: isSale ? selectedProduct?.nutrition ?? null : null,
          }}
        />
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => handleSubmit(false)}
          disabled={busy}
          className="flex-1 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 text-gray-800 font-medium px-4 py-3 rounded-xl"
        >
          {busy ? "..." : "Solo guardar"}
        </button>
        <button
          type="button"
          onClick={() => handleSubmit(true)}
          disabled={busy}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold px-4 py-3 rounded-xl inline-flex items-center justify-center gap-2"
        >
          <PrinterIcon className="w-5 h-5" />
          {busy ? "..." : "Guardar e imprimir"}
        </button>
      </div>
    </div>
  );
}
