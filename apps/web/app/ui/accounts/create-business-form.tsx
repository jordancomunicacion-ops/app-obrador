"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createBusinessAccount, type CreateBusinessState } from "@/app/lib/actions/accounts";

const initialState: CreateBusinessState = {};

export default function CreateBusinessForm() {
    const [state, formAction, isPending] = useActionState(createBusinessAccount, initialState);

    return (
        <form action={formAction} className="space-y-6">
            {state?.message && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
                    {state.message}
                </div>
            )}

            <div className="space-y-1">
                <label htmlFor="businessName" className="text-sm font-semibold text-gray-700">
                    Nombre del negocio / restaurante
                </label>
                <input
                    id="businessName"
                    name="businessName"
                    type="text"
                    required
                    placeholder="Obrador Soto del Prior"
                    className="block w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
                {state?.errors?.businessName && (
                    <p className="text-xs text-red-500">{state.errors.businessName[0]}</p>
                )}
            </div>

            <div className="space-y-1">
                <label htmlFor="email" className="text-sm font-semibold text-gray-700">
                    Email de acceso del cliente
                </label>
                <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="cliente@ejemplo.com"
                    className="block w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
                {state?.errors?.email && <p className="text-xs text-red-500">{state.errors.email[0]}</p>}
            </div>

            <div className="space-y-1">
                <label htmlFor="password" className="text-sm font-semibold text-gray-700">
                    Contraseña inicial
                </label>
                <input
                    id="password"
                    name="password"
                    type="text"
                    required
                    minLength={6}
                    placeholder="Mínimo 6 caracteres"
                    className="block w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
                <p className="text-xs text-gray-400">Compártela con el cliente; podrá cambiarla después.</p>
                {state?.errors?.password && <p className="text-xs text-red-500">{state.errors.password[0]}</p>}
            </div>

            <div className="space-y-1">
                <label htmlFor="locationName" className="text-sm font-semibold text-gray-700">
                    Nombre del primer local <span className="font-normal text-gray-400">(opcional)</span>
                </label>
                <input
                    id="locationName"
                    name="locationName"
                    type="text"
                    placeholder="Por defecto: el nombre del negocio"
                    className="block w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
                <p className="text-xs text-gray-400">Se crea un local inicial automáticamente para la cuenta.</p>
            </div>

            <div className="flex items-center gap-3 pt-2">
                <button
                    type="submit"
                    disabled={isPending}
                    className="flex h-11 items-center rounded-xl bg-indigo-600 px-6 text-sm font-bold text-white shadow-sm transition-all hover:bg-indigo-700 disabled:opacity-50"
                >
                    {isPending ? "Creando..." : "Crear negocio"}
                </button>
                <Link
                    href="/dashboard/employees?tab=requests"
                    className="text-sm font-medium text-gray-500 hover:text-gray-700"
                >
                    Cancelar
                </Link>
            </div>
        </form>
    );
}
