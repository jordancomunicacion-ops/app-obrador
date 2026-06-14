import { auth } from '@/auth';
import ImageUpload from '@/app/ui/settings/image-upload';
import { updateProfileImage, updateAppLogo } from '@/app/lib/actions/settings';
import { prisma } from '@/app/lib/prisma';

export default async function ProfilePage() {
    const session = await auth();
    const user = session?.user;

    // Fetch App Config
    const appConfig = await prisma.appConfig.findUnique({
        where: { id: 'default' },
    });

    if (!user) return null;

    return (
        <div className="w-full p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Mi Perfil</h1>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
                <div className="p-8">
                    <div className="flex items-start gap-8">
                        <div>
                            <ImageUpload
                                currentImage={user.image}
                                onUpload={updateProfileImage}
                                label="Cambiar Foto"
                                alt={user.name || 'Profile'}
                            />
                        </div>

                        <div className="space-y-4 flex-1 pt-2">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">{user.name || 'Usuario'}</h2>
                                <div className="mt-2">
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                                        {user.role || 'Empleado'}
                                    </span>
                                </div>
                            </div>

                            <p className="text-gray-500 max-w-2xl">
                                {user.role === 'ADMIN'
                                    ? 'Cuenta administrativa con acceso completo a la gestión de fincas, inventario animal, finanzas y equipo.'
                                    : 'Cuenta de empleado con acceso a las funciones asignadas.'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="border-t border-gray-100 p-8 pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Email / Usuario</p>
                            <p className="font-medium text-gray-900">{user.email || Object.values(user || {}).find(v => typeof v === 'string' && v.includes('@')) || user.name}</p>
                        </div>

                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Rol</p>
                            <p className="font-medium text-gray-900">{user.role || 'Empleado'}</p>
                        </div>

                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Empresa</p>
                            <p className="font-medium text-gray-900">OTEYZERENA</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Application Settings (Admin Only) */}
            {user.role === 'ADMIN' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6 border-b border-gray-100">
                        <h2 className="text-lg font-bold text-gray-900">Configuración de la Aplicación</h2>
                        <p className="text-sm text-gray-500">Personaliza la apariencia de la aplicación.</p>
                    </div>
                    <div className="p-8">
                        <div className="flex items-start gap-8">
                            <div>
                                <p className="text-sm font-medium text-gray-700 mb-4">Logo de la Aplicación</p>
                                <ImageUpload
                                    currentImage={appConfig?.logoUrl}
                                    onUpload={updateAppLogo}
                                    label="Cambiar Logo"
                                    shape="square"
                                    alt="App Logo"
                                />
                            </div>
                            <div className="flex-1 text-sm text-gray-500 pt-8">
                                <p>Este logo aparecerá en la esquina superior izquierda de todas las pantallas y en la pantalla de inicio de sesión.</p>
                                <p className="mt-2">Formato recomendado: PNG transparente, 200x50px.</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
