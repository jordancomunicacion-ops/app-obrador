'use client';

import { useActionState } from 'react';
import { authenticate } from '@/app/lib/actions';
import Link from 'next/link';
import { CakeIcon } from '@heroicons/react/24/outline';

export default function Page() {
    const [errorMessage, formAction, isPending] = useActionState(
        authenticate,
        undefined,
    );

    return (
        <div className="flex h-screen items-center justify-center bg-gray-50">
            <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
                <div className="flex flex-col items-center justify-center mb-8">
                    <img src="/logo-icon.png" alt="OTEYZERENA" className="h-24" />
                    <span className="mt-6 text-xl tracking-[0.5em] text-gray-900 font-light uppercase">
                        Cocina
                    </span>
                </div>
                <form action={formAction} className="space-y-4">
                    <div>
                        <label
                            className="mb-2 block text-sm font-medium text-gray-700"
                            htmlFor="email"
                        >
                            Usuario
                        </label>
                        <input
                            className="block w-full rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                            id="email"
                            type="email"
                            name="email"
                            placeholder=""
                            required
                        />
                    </div>
                    <div>
                        <label
                            className="mb-2 block text-sm font-medium text-gray-700"
                            htmlFor="password"
                        >
                            Contraseña
                        </label>
                        <input
                            className="block w-full rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                            id="password"
                            type="password"
                            name="password"
                            placeholder=""
                            required
                            minLength={4}
                        />
                    </div>
                    <div
                        className="flex items-end space-x-1"
                        aria-live="polite"
                        aria-atomic="true"
                    >
                        {errorMessage && (
                            <p className="text-sm text-red-500">{errorMessage}</p>
                        )}
                    </div>

                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                            <input
                                id="remember-me"
                                name="remember-me"
                                type="checkbox"
                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                                Recuérdame
                            </label>
                        </div>
                    </div>

                    <button
                        className="flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                        aria-disabled={isPending}
                        disabled={isPending}
                    >
                        Iniciar Sesión
                    </button>

                    <div className="text-center text-xs mt-4">
                        <Link href="/forgot-password" className="font-medium text-gray-500 hover:text-gray-700">
                            ¿Olvidaste tu contraseña?
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
