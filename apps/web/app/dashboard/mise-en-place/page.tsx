export default function MiseEnPlacePage() {
    return (
        <div className="space-y-6">
            <div className="bg-white px-4 py-5 shadow sm:rounded-lg sm:p-6">
                <div className="md:grid md:grid-cols-3 md:gap-6">
                    <div className="md:col-span-1">
                        <h3 className="text-base font-semibold leading-6 text-gray-900">Calculadora de Partida</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            Introduce el volumen o ingrediente y te recomendaremos el recipiente Gastronorm ideal.
                        </p>
                    </div>
                    <div className="mt-5 md:col-span-2 md:mt-0">
                        <form className="grid grid-cols-6 gap-6">
                            <div className="col-span-6 sm:col-span-4">
                                <label htmlFor="ingredient" className="block text-sm font-medium leading-6 text-gray-900">Ingrediente / Elaboración</label>
                                <input type="text" name="ingredient" id="ingredient" className="mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
                            </div>

                            <div className="col-span-6 sm:col-span-3">
                                <label htmlFor="volume" className="block text-sm font-medium leading-6 text-gray-900">Volumen Diario Est. (L/Kg)</label>
                                <input type="text" name="volume" id="volume" className="mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
                            </div>

                            <div className="col-span-6">
                                <button type="button" className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
                                    Calcular GN Óptimo
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            <div className="bg-white shadow sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-base font-semibold leading-6 text-gray-900 mb-4">Guía de Referencia Gastronorm</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-center">
                        {[
                            { name: 'GN 1/1', dim: '530x325mm', color: 'bg-blue-100 border-blue-300' },
                            { name: 'GN 1/2', dim: '325x265mm', color: 'bg-green-100 border-green-300' },
                            { name: 'GN 1/3', dim: '325x176mm', color: 'bg-yellow-100 border-yellow-300' },
                            { name: 'GN 1/4', dim: '265x162mm', color: 'bg-orange-100 border-orange-300' },
                            { name: 'GN 1/6', dim: '176x162mm', color: 'bg-red-100 border-red-300' },
                            { name: 'GN 1/9', dim: '176x108mm', color: 'bg-purple-100 border-purple-300' },
                        ].map(gn => (
                            <div key={gn.name} className={`border-2 rounded-lg p-4 ${gn.color} aspect-square flex flex-col justify-center items-center`}>
                                <span className="font-bold text-gray-800">{gn.name}</span>
                                <span className="text-xs text-gray-600">{gn.dim}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="bg-white shadow sm:rounded-lg overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex justify-between items-center sm:px-6">
                    <h3 className="text-base font-semibold leading-6 text-gray-900">Estaciones Definidas</h3>
                    <button className="rounded bg-white px-2 py-1 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
                        + Nueva Estación
                    </button>
                </div>
                <ul className="divide-y divide-gray-200">
                    <li className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                            <p className="truncate text-sm font-medium text-indigo-600">Partida Frío - Ensaladas</p>
                            <div className="ml-2 flex flex-shrink-0">
                                <p className="inline-flex rounded-full bg-green-100 px-2 text-xs font-semibold leading-5 text-green-800">
                                    Activo
                                </p>
                            </div>
                        </div>
                        <div className="mt-2 sm:flex sm:justify-between">
                            <div className="sm:flex">
                                <p className="flex items-center text-sm text-gray-500">
                                    3x GN 1/3 (100mm), 6x GN 1/6 (65mm)
                                </p>
                            </div>
                        </div>
                    </li>
                </ul>
            </div>
        </div>
    );
}
