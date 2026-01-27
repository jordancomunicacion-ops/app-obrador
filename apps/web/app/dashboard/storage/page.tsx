export default function StoragePage() {
    return (
        <div className="h-full grid grid-cols-12 gap-6">
            {/* Left Sidebar: Locations Tree */}
            <div className="col-span-12 md:col-span-4 lg:col-span-3 bg-white rounded-lg shadow border border-gray-200 p-4 h-full overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">Ubicaciones</h2>
                    <button className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                        + Nueva Zona
                    </button>
                </div>
                <div className="space-y-2">
                    {/* Placeholder for Location Tree */}
                    <div className="p-2 bg-gray-50 rounded text-sm text-gray-500 text-center">
                        Cargando estructura...
                    </div>
                    {/* We will implement a recursive server/client component here */}
                    <LocationTreeMock />
                </div>
            </div>

            {/* Main Content: Selected Location Details */}
            <div className="col-span-12 md:col-span-8 lg:col-span-9 flex flex-col gap-6">
                {/* Stats / Header */}
                <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Vista General de Almacén</h1>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                        <div className="p-3 bg-blue-50 text-blue-700 rounded-md">
                            <span className="block font-bold">Total Productos</span>
                            <span className="text-xl">0</span>
                        </div>
                        <div className="p-3 bg-green-50 text-green-700 rounded-md">
                            <span className="block font-bold">Valor Stock</span>
                            <span className="text-xl">0.00 €</span>
                        </div>
                        <div className="p-3 bg-yellow-50 text-yellow-700 rounded-md">
                            <span className="block font-bold">Sin Ubicación</span>
                            <span className="text-xl">0</span>
                        </div>
                    </div>
                </div>

                {/* Products List Placeholder */}
                <div className="flex-1 bg-white rounded-lg shadow border border-gray-200 p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-semibold text-gray-900">Productos en esta ubicación</h3>
                        <input
                            type="text"
                            placeholder="Buscar producto..."
                            className="text-sm border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                    </div>
                    <div className="h-64 flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                        Selecciona una ubicación para ver contenido
                    </div>
                </div>
            </div>
        </div>
    );
}

function LocationTreeMock() {
    // Just a visual mock for now
    const zones = [
        { name: 'Cocina', icon: '🍳', timbres: ['Timbre 1', 'Timbre 2'] },
        { name: 'Almacén Seco', icon: '📦', timbres: ['Estantería A', 'Estantería B'] },
        { name: 'Cámara Fría', icon: '❄️', timbres: ['General', 'Lácteos'] },
        { name: 'Congelación', icon: '🧊', timbres: ['Arcón 1'] },
    ];

    return (
        <ul className="space-y-4">
            {zones.map(z => (
                <li key={z.name}>
                    <div className="font-medium text-gray-800 flex items-center gap-2">
                        <span>{z.icon}</span> {z.name}
                    </div>
                    <ul className="pl-6 mt-1 space-y-1 border-l-2 border-gray-100 ml-2">
                        {z.timbres.map(t => (
                            <li key={t} className="text-sm text-gray-600 hover:text-indigo-600 cursor-pointer py-1">
                                {t}
                            </li>
                        ))}
                    </ul>
                </li>
            ))}
        </ul>
    );
}
