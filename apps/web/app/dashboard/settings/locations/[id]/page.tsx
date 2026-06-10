import Link from "next/link";
import { notFound } from "next/navigation";
import {
    ArrowLeftIcon,
    BuildingStorefrontIcon,
    KeyIcon,
    UserGroupIcon,
    Cog6ToothIcon,
    TruckIcon,
    ClipboardDocumentCheckIcon,
    PlusIcon,
    ArrowUpTrayIcon,
    DocumentIcon,
    PhoneIcon,
    EnvelopeIcon,
    IdentificationIcon,
    MapPinIcon,
} from "@heroicons/react/24/outline";
import { prisma } from "@/app/lib/prisma";
import { currentBusinessId } from "@/app/lib/auth/business";
import { auth } from "@/auth";
import { isPlatformOwner } from "@/app/lib/auth/platform";
import LocationEditForm from "@/app/ui/locations/location-edit-form";
import LocationApiKey from "@/app/ui/locations/location-api-key";
import LocationEmployees from "@/app/ui/locations/location-employees";
import DeleteSupplier from "@/app/ui/suppliers/delete-supplier";
import DeleteCustomer from "@/app/ui/customers/delete-customer";
import DeleteObradorDocument from "@/app/ui/obrador/delete-document";

export const dynamic = "force-dynamic";

const TABS = [
    { key: "general", label: "General", icon: Cog6ToothIcon },
    { key: "empleados", label: "Empleados", icon: UserGroupIcon },
    { key: "proveedores", label: "Proveedores", icon: TruckIcon },
    { key: "clientes", label: "Clientes y PdV", icon: UserGroupIcon },
    { key: "documentos", label: "Documentos", icon: ClipboardDocumentCheckIcon },
] as const;

type TabKey = (typeof TABS)[number]["key"];

function fmtDate(d: Date) {
    return new Date(d).toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
}

/**
 * Detalle de un local organizado en pestañas:
 *  - General: datos básicos + API key del CRM
 *  - Empleados: contratos activos asignados al local + permisos
 *  - Proveedores / Clientes y PdV / Documentos: registros del local
 */
export default async function LocationDetailPage({
    params,
    searchParams,
}: {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ tab?: string }>;
}) {
    const { id } = await params;
    const { tab: rawTab } = await searchParams;
    const tab: TabKey = TABS.some((t) => t.key === rawTab) ? (rawTab as TabKey) : "general";

    const session = await auth();
    const isOwner = isPlatformOwner(session);
    const activeBusinessId = await currentBusinessId();

    const location = await prisma.location.findUnique({
        where: { id },
        include: {
            apiKeys: { orderBy: { createdAt: "desc" }, take: 1 },
            employments: {
                where: { isActive: true, assignedLocations: { some: { id } } },
                orderBy: { createdAt: "asc" },
                select: {
                    id: true,
                    position: true,
                    department: true,
                    canViewDashboard: true,
                    canViewEvents: true,
                    canViewTasks: true,
                    canViewCommunications: true,
                    canViewCatalog: true,
                    canViewOperations: true,
                    canViewObrador: true,
                    canViewEcommerce: true,
                    canViewEmployees: true,
                    canManageDirectory: true,
                    canEditSettings: true,
                    canViewAllNotifications: true,
                    user: {
                        select: {
                            id: true,
                            name: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            dni: true,
                            jobTitle: true,
                            role: true,
                        },
                    },
                },
            },
        },
    });
    if (!location) notFound();
    if (!isOwner && location.businessId !== activeBusinessId) notFound();

    const apiKey = location.apiKeys[0] ?? null;

    const [supplierCount, customerCount, documentCount] = await Promise.all([
        prisma.supplier.count({ where: { locationId: id } }),
        prisma.customer.count({ where: { locationId: id } }),
        prisma.obradorSanitaryDocument.count({ where: { locationId: id } }),
    ]);

    const counts: Record<TabKey, number | null> = {
        general: null,
        empleados: location.employments.length,
        proveedores: supplierCount,
        clientes: customerCount,
        documentos: documentCount,
    };

    return (
        <div className="space-y-6">
            <div>
                <Link
                    href="/dashboard/settings/locations"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-700"
                >
                    <ArrowLeftIcon className="w-4 h-4" />
                    Locales
                </Link>
                <h1 className="mt-3 flex items-center gap-3 text-2xl font-bold tracking-tight text-gray-900">
                    <BuildingStorefrontIcon className="h-7 w-7 text-emerald-600" />
                    {location.name}
                </h1>
                {location.shortCode && (
                    <p className="mt-1 text-sm text-gray-500">{location.shortCode}</p>
                )}
            </div>

            <nav className="flex gap-1 overflow-x-auto border-b border-slate-200" aria-label="Secciones del local">
                {TABS.map(({ key, label, icon: Icon }) => {
                    const active = key === tab;
                    return (
                        <Link
                            key={key}
                            href={`/dashboard/settings/locations/${id}?tab=${key}`}
                            className={`flex flex-none items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
                                active
                                    ? "border-emerald-600 text-emerald-700"
                                    : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
                            }`}
                        >
                            <Icon className="h-4 w-4" />
                            {label}
                            {counts[key] !== null && (
                                <span
                                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                                        active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                                    }`}
                                >
                                    {counts[key]}
                                </span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {tab === "general" && (
                <>
                    <section className="rounded-2xl border border-slate-200 bg-white p-6">
                        <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-slate-900">
                            <Cog6ToothIcon className="h-5 w-5 text-slate-500" />
                            Datos del local
                        </h2>
                        <LocationEditForm location={location} />
                    </section>

                    <section className="rounded-2xl border border-slate-200 bg-white p-6">
                        <h2 className="mb-1 flex items-center gap-2 text-base font-bold text-slate-900">
                            <KeyIcon className="h-5 w-5 text-slate-500" />
                            API key del CRM
                        </h2>
                        <p className="mb-4 text-sm text-slate-500">
                            Clave única de este local. Pégala en el CRM (Conexiones → Cocina); sincronizará
                            solo los empleados y tareas de este local. Rotarla invalida la anterior al
                            instante.
                        </p>
                        <LocationApiKey
                            locationId={location.id}
                            initialKey={apiKey?.key ?? null}
                            initialCreatedAt={apiKey?.createdAt.toISOString() ?? null}
                        />
                    </section>
                </>
            )}

            {tab === "empleados" && (
                <section className="rounded-2xl border border-slate-200 bg-white p-6">
                    <h2 className="mb-1 flex items-center gap-2 text-base font-bold text-slate-900">
                        <UserGroupIcon className="h-5 w-5 text-slate-500" />
                        Empleados con acceso al local ({location.employments.length})
                    </h2>
                    <p className="mb-4 text-sm text-slate-500">
                        Personas con contrato activo asignado a este local. Cada una entra a la app
                        con su email y ve las secciones marcadas. Para quitarle el acceso al local,
                        revoca aquí (el contrato sigue para histórico).
                    </p>
                    <LocationEmployees
                        locationId={location.id}
                        initial={location.employments}
                    />
                </section>
            )}

            {tab === "proveedores" && <SuppliersTab locationId={id} />}
            {tab === "clientes" && <CustomersTab locationId={id} />}
            {tab === "documentos" && <DocumentsTab locationId={id} />}
        </div>
    );
}

async function SuppliersTab({ locationId }: { locationId: string }) {
    const suppliers = await prisma.supplier.findMany({
        where: { locationId },
        orderBy: { name: "asc" },
    });

    return (
        <section className="space-y-4">
            <div className="flex items-center justify-between gap-4">
                <p className="text-sm text-slate-500">
                    Proveedores homologados de este local y sus registros sanitarios.
                </p>
                <Link
                    href={`/dashboard/settings/suppliers/create?locationId=${locationId}`}
                    className="flex flex-none items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
                >
                    <PlusIcon className="h-5 w-5" />
                    Nuevo Proveedor
                </Link>
            </div>

            {suppliers.length === 0 ? (
                <div className="rounded-2xl border-2 border-dashed border-slate-200 p-16 text-center">
                    <TruckIcon className="mx-auto h-12 w-12 text-slate-300" />
                    <p className="mt-3 text-slate-500">
                        Aún no hay proveedores en este local. Crea el primero con “Nuevo Proveedor”.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {suppliers.map((supplier) => (
                        <div
                            key={supplier.id}
                            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-colors hover:border-emerald-300"
                        >
                            <div className="p-5">
                                <div className="mb-3 flex items-start justify-between">
                                    <span className="rounded bg-emerald-50 px-2 py-1 text-[10px] font-bold uppercase text-emerald-700">
                                        {supplier.productType || "General"}
                                    </span>
                                    <span className="text-[10px] font-bold uppercase text-emerald-600">
                                        {supplier.isActive ? "Activo" : "Inactivo"}
                                    </span>
                                </div>
                                <h3 className="mb-1 text-lg font-bold text-slate-900">{supplier.name}</h3>
                                {supplier.nif && (
                                    <p className="mb-4 font-mono text-xs text-slate-400">{supplier.nif}</p>
                                )}

                                <div className="mb-6 space-y-2">
                                    {supplier.contactPerson && (
                                        <div className="flex items-center gap-2 text-sm text-slate-600">
                                            <IdentificationIcon className="h-4 w-4 text-slate-400" />
                                            {supplier.contactPerson}
                                        </div>
                                    )}
                                    {supplier.phone && (
                                        <div className="flex items-center gap-2 text-sm text-slate-600">
                                            <PhoneIcon className="h-4 w-4 text-slate-400" />
                                            {supplier.phone}
                                        </div>
                                    )}
                                    {supplier.email && (
                                        <div className="flex items-center gap-2 text-sm text-slate-600">
                                            <EnvelopeIcon className="h-4 w-4 text-slate-400" />
                                            {supplier.email}
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center justify-between border-t border-slate-50 pt-4">
                                    <span className="text-[10px] font-bold uppercase text-slate-400">
                                        {supplier.healthRegistry ? `Reg: ${supplier.healthRegistry}` : "Sin registro"}
                                    </span>
                                    <div className="flex items-center gap-3">
                                        <Link
                                            href={`/dashboard/settings/suppliers/${supplier.id}/edit`}
                                            className="text-sm font-bold text-emerald-600 hover:underline"
                                        >
                                            Editar
                                        </Link>
                                        <DeleteSupplier id={supplier.id} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}

async function CustomersTab({ locationId }: { locationId: string }) {
    const customers = await prisma.customer.findMany({
        where: { locationId },
        orderBy: { name: "asc" },
    });

    return (
        <section className="space-y-4">
            <div className="flex items-center justify-between gap-4">
                <p className="text-sm text-slate-500">
                    Puntos de venta y establecimientos minoristas de este local.
                </p>
                <Link
                    href={`/dashboard/settings/customers/create?locationId=${locationId}`}
                    className="flex flex-none items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
                >
                    <PlusIcon className="h-5 w-5" />
                    Nuevo Cliente
                </Link>
            </div>

            {customers.length === 0 ? (
                <div className="rounded-2xl border-2 border-dashed border-slate-200 p-16 text-center">
                    <UserGroupIcon className="mx-auto h-12 w-12 text-slate-300" />
                    <p className="mt-3 text-slate-500">
                        Aún no hay clientes en este local. Crea el primero con “Nuevo Cliente”.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {customers.map((customer) => (
                        <div
                            key={customer.id}
                            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-colors hover:border-emerald-300"
                        >
                            <div className="p-5">
                                <div className="mb-3 flex items-start justify-between">
                                    <span className="rounded bg-indigo-50 px-2 py-1 text-[10px] font-bold uppercase text-indigo-700">
                                        {customer.customerType || "Sin tipo"}
                                    </span>
                                </div>
                                <h3 className="mb-1 text-lg font-bold text-slate-900">{customer.name}</h3>
                                {customer.contactPerson && (
                                    <p className="text-sm text-slate-500">{customer.contactPerson}</p>
                                )}

                                <div className="mb-6 mt-4 space-y-2">
                                    {customer.address && (
                                        <div className="flex items-center gap-2 text-sm text-slate-600">
                                            <MapPinIcon className="h-4 w-4 text-slate-400" />
                                            {customer.address}
                                        </div>
                                    )}
                                    {customer.email && (
                                        <div className="flex items-center gap-2 text-sm text-slate-600">
                                            <EnvelopeIcon className="h-4 w-4 text-slate-400" />
                                            {customer.email}
                                        </div>
                                    )}
                                </div>

                                <div className="mt-4 flex items-center justify-between border-t border-slate-50 pt-4">
                                    <Link
                                        href={`/dashboard/settings/customers/${customer.id}/edit`}
                                        className="text-sm font-bold text-emerald-600 hover:underline"
                                    >
                                        Editar
                                    </Link>
                                    <DeleteCustomer id={customer.id} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}

async function DocumentsTab({ locationId }: { locationId: string }) {
    const docs = await prisma.obradorSanitaryDocument.findMany({
        where: { locationId },
        orderBy: { createdAt: "desc" },
    });

    return (
        <section className="space-y-4">
            <div className="flex items-center justify-between gap-4">
                <p className="text-sm text-slate-500">
                    Expedientes, certificados y planes sanitarios de este local.
                </p>
                <Link
                    href={`/dashboard/obrador/documents/create?locationId=${locationId}`}
                    className="flex flex-none items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
                >
                    <ArrowUpTrayIcon className="h-5 w-5" />
                    Añadir Documento
                </Link>
            </div>

            {docs.length === 0 ? (
                <div className="rounded-2xl border-2 border-dashed border-slate-200 p-16 text-center">
                    <DocumentIcon className="mx-auto h-12 w-12 text-slate-300" />
                    <p className="mt-3 text-slate-500">
                        Aún no hay documentos en este local. Añade el primero con “Añadir Documento”.
                    </p>
                </div>
            ) : (
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="divide-y divide-slate-100">
                        {docs.map((doc) => (
                            <div
                                key={doc.id}
                                className="flex items-center justify-between p-4 transition-colors hover:bg-slate-50"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="rounded-lg bg-emerald-50 p-2">
                                        <DocumentIcon className="h-6 w-6 text-emerald-600" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900">{doc.title}</h4>
                                        <div className="mt-0.5 flex gap-3 text-xs text-slate-400">
                                            <span className="rounded bg-slate-100 px-1.5 py-0.5 font-bold uppercase text-slate-600">
                                                {doc.category}
                                            </span>
                                            <span>Añadido el {fmtDate(doc.createdAt)}</span>
                                            {doc.expiryDate && (
                                                <span className="font-medium text-rose-500">
                                                    Caduca {fmtDate(doc.expiryDate)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <a
                                        href={doc.fileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-2 text-slate-400 transition-colors hover:text-emerald-600"
                                        title="Ver documento"
                                    >
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                            />
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                            />
                                        </svg>
                                    </a>
                                    <DeleteObradorDocument id={doc.id} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </section>
    );
}
