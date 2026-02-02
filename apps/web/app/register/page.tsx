'use client';

import { useActionState } from 'react';
import { registerUser } from '@/app/lib/actions';
import Link from 'next/link';
import Image from 'next/image';

export default function Page() {
    const [state, formAction, isPending] = useActionState(registerUser, undefined);

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
            <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white/10 backdrop-blur-lg border border-white/20 shadow-2xl">
                <div className="p-8">
                    <div className="mb-8 flex flex-col items-center">
                        <div className="mb-4 rounded-xl bg-white/10 p-3 ring-1 ring-white/20 shadow-inner">
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-500 text-white shadow-lg">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                                </svg>
                            </div>
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-white">App Cocina</h1>
                        <p className="mt-2 text-slate-400">Crea tu cuenta profesional</p>
                    </div>

                    <form action={formAction} className="space-y-5">
                        <div aria-live="polite" aria-atomic="true">
                            {state?.message && (
                                <div className="mb-6 flex items-center gap-3 rounded-lg border border-red-500/50 bg-red-500/10 p-4 text-sm text-red-200 animate-in fade-in slide-in-from-top-4 duration-300">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 flex-shrink-0">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
                                    </svg>
                                    <p>{state.message}</p>
                                </div>
                            )}
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-semibold text-slate-300 ml-1" htmlFor="name">
                                Nombre completo
                            </label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                                        <path d="M10 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3.465 14.493a1.23 1.23 0 0 0 .41 1.412A9.957 9.957 0 0 0 10 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 0 0-13.074.003Z" />
                                    </svg>
                                </span>
                                <input
                                    className="block w-full rounded-xl border-0 bg-white/5 py-2.5 pl-10 pr-3 text-white ring-1 ring-inset ring-white/10 transition-all placeholder:text-slate-500 focus:bg-white/10 focus:ring-2 focus:ring-indigo-500 sm:text-sm"
                                    id="name"
                                    type="text"
                                    name="name"
                                    placeholder="Nombre y pellidos"
                                    required
                                />
                            </div>
                            {state?.errors?.name && (
                                <p className="mt-1.5 text-xs text-red-400 ml-1">{state.errors.name}</p>
                            )}
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-semibold text-slate-300 ml-1" htmlFor="email">
                                Correo electrónico
                            </label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                                        <path d="M3 4a2 2 0 0 0-2 2v1.161l8.441 4.221a1.25 1.25 0 0 0 1.118 0L19 7.162V6a2 2 0 0 0-2-2H3Z" />
                                        <path d="m19 8.839-7.77 3.885a2.75 2.75 0 0 1-2.46 0L1 8.839V14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.839Z" />
                                    </svg>
                                </span>
                                <input
                                    className="block w-full rounded-xl border-0 bg-white/5 py-2.5 pl-10 pr-3 text-white ring-1 ring-inset ring-white/10 transition-all placeholder:text-slate-500 focus:bg-white/10 focus:ring-2 focus:ring-indigo-500 sm:text-sm"
                                    id="email"
                                    type="email"
                                    name="email"
                                    placeholder="usuario@sotodelprior.com"
                                    required
                                />
                            </div>
                            {state?.errors?.email && (
                                <p className="mt-1.5 text-xs text-red-400 ml-1">{state.errors.email}</p>
                            )}
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-semibold text-slate-300 ml-1" htmlFor="password">
                                Contraseña
                            </label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                                        <path fillRule="evenodd" d="M10 1a4.5 4.5 0 0 0-4.5 4.5V9H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-.5V5.5A4.5 4.5 0 0 0 10 1Zm3 8V5.5a3 3 0 1 0-6 0V9h6Z" clipRule="evenodd" />
                                    </svg>
                                </span>
                                <input
                                    className="block w-full rounded-xl border-0 bg-white/5 py-2.5 pl-10 pr-3 text-white ring-1 ring-inset ring-white/10 transition-all placeholder:text-slate-500 focus:bg-white/10 focus:ring-2 focus:ring-indigo-500 sm:text-sm"
                                    id="password"
                                    type="password"
                                    name="password"
                                    placeholder="********"
                                    required
                                    minLength={6}
                                />
                            </div>
                            {state?.errors?.password && (
                                <p className="mt-1.5 text-xs text-red-400 ml-1">{state.errors.password}</p>
                            )}
                        </div>

                        <button
                            className="group relative flex w-full justify-center overflow-hidden rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-lg transition-all hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50"
                            aria-disabled={isPending}
                            disabled={isPending}
                        >
                            <span className="relative z-10 flex items-center gap-2">
                                {isPending ? (
                                    <>
                                        <svg className="h-5 w-5 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Procesando...
                                    </>
                                ) : (
                                    'Crear Cuenta'
                                )}
                            </span>
                            <div className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100 animate-shimmer" />
                        </button>

                        <div className="mt-6 text-center text-sm">
                            <p className="text-slate-400">
                                ¿Ya tienes una cuenta?{' '}
                                <Link
                                    href="/login"
                                    className="font-bold text-indigo-400 transition-colors hover:text-indigo-300"
                                >
                                    Inicia sesión
                                </Link>
                            </p>
                        </div>
                    </form>
                </div>
                <div className="bg-white/5 py-4 px-8 text-center border-t border-white/10">
                    <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                        Soto del Prior &copy; {new Date().getFullYear()}
                    </p>
                </div>
            </div>

            <style jsx>{`
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
                .animate-shimmer {
                    animation: shimmer 1.5s infinite;
                }
            `}</style>
        </div>
    );
}

