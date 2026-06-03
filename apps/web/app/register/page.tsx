import Link from 'next/link';

/**
 * Registro público deshabilitado. Las cuentas de negocio las crea el propietario
 * de plataforma (SUPERADMIN) desde el panel ("Crear negocio"). Esta pantalla solo
 * informa y redirige al login.
 */
export default function Page() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
            <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white/10 backdrop-blur-lg border border-white/20 shadow-2xl">
                <div className="p-8 text-center">
                    <h1 className="text-2xl font-bold tracking-tight text-white">Registro no disponible</h1>
                    <p className="mt-4 text-slate-300">
                        Las cuentas de acceso las da de alta la administración de la plataforma.
                        Si necesitas acceso, contacta con Soto del Prior.
                    </p>
                    <Link
                        href="/login"
                        className="mt-8 inline-flex w-full justify-center rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-lg transition-all hover:bg-indigo-500"
                    >
                        Volver al inicio de sesión
                    </Link>
                </div>
                <div className="bg-white/5 py-4 px-8 text-center border-t border-white/10">
                    <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                        Soto del Prior &copy; 2026
                    </p>
                </div>
            </div>
        </div>
    );
}
