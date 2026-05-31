import Link from "next/link";
import { prisma } from "@/app/lib/prisma";
import { currentOrgId } from "@/auth";
import { currentLocationId } from "@/app/lib/auth/location";
import { ArrowLeftIcon, BanknotesIcon } from "@heroicons/react/24/outline";
import ClosingForm from "@/app/ui/cash/closing-form";

function startOfDayUTC(d = new Date()) {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

export default async function CashMobilePage() {
  const orgId = await currentOrgId();
  if (!orgId) return null;
  const locationId = await currentLocationId();

  const today = startOfDayUTC();
  // Si ya existe cierre del día (cualquier turno), precargamos el primero
  const existing = await prisma.cashClosing.findFirst({
    where: {
      ownerId: orgId,
      locationId: locationId ?? null,
      date: today,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href="/dashboard/today"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-4"
      >
        <ArrowLeftIcon className="w-4 h-4" />
        Volver
      </Link>

      <h1 className="text-xl font-semibold text-gray-800 mb-1 flex items-center gap-2">
        <BanknotesIcon className="w-5 h-5" />
        Cierre de caja
      </h1>
      <p className="text-sm text-gray-500 mb-4">
        Cuadre del turno con efectivo, tarjeta y propinas
      </p>

      <ClosingForm
        initial={
          existing
            ? {
                date: existing.date.toISOString().slice(0, 10),
                shift: existing.shift,
                cashAmount: existing.cashAmount,
                expectedCashAmount: existing.expectedCashAmount,
                cardAmount: existing.cardAmount,
                otherAmount: existing.otherAmount,
                tips: existing.tips,
                notes: existing.notes ?? "",
                photoUrl: existing.photoUrl,
              }
            : undefined
        }
      />
    </div>
  );
}
