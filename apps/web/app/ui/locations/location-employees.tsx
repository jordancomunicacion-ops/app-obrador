import Link from "next/link";
import { UserIcon } from "@heroicons/react/24/outline";

type Employee = {
    id: string;
    name: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    dni: string | null;
    phone: string | null;
    jobTitle: string | null;
    role: string;
};

export default function LocationEmployees({ employees }: { employees: Employee[] }) {
    if (employees.length === 0) {
        return (
            <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50/50 p-6 text-center text-sm text-gray-500">
                Sin empleados asignados a este local todavía. Asigna empleados desde{" "}
                <Link href="/dashboard/employees" className="font-semibold text-indigo-600 hover:text-indigo-700">
                    Gestión de Usuarios
                </Link>
                .
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-100 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <tr>
                        <th className="py-2 pr-3">Nombre</th>
                        <th className="px-3 py-2">Puesto</th>
                        <th className="px-3 py-2">DNI</th>
                        <th className="px-3 py-2">Email</th>
                        <th className="py-2 pl-3 text-right">Rol</th>
                    </tr>
                </thead>
                <tbody>
                    {employees.map((e) => {
                        const fullName = ([e.firstName, e.lastName].filter(Boolean).join(" ") || e.name).trim();
                        return (
                            <tr key={e.id} className="border-b border-gray-50 last:border-0">
                                <td className="py-2 pr-3">
                                    <div className="flex items-center gap-2">
                                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-indigo-700">
                                            <UserIcon className="h-4 w-4" />
                                        </div>
                                        <span className="font-medium text-gray-900">{fullName}</span>
                                    </div>
                                </td>
                                <td className="px-3 py-2 text-gray-600">{e.jobTitle ?? "—"}</td>
                                <td className="px-3 py-2 text-gray-600">{e.dni ?? "—"}</td>
                                <td className="px-3 py-2 text-gray-600">{e.email}</td>
                                <td className="py-2 pl-3 text-right">
                                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-700">
                                        {e.role}
                                    </span>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
