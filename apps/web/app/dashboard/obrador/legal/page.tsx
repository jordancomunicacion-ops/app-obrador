import { ShieldCheckIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export default function ObradorLegalPage() {
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <ShieldCheckIcon className="w-32 h-32 text-emerald-600" />
        </div>
        
        <h1 className="text-3xl font-black text-slate-900 mb-6">Aviso legal y sanitario</h1>
        
        <div className="space-y-6 text-slate-700 leading-relaxed">
          <p className="font-semibold text-lg text-emerald-700">
            Esta aplicación ayuda a organizar información sanitaria, trazabilidad y etiquetado alimentario.
          </p>
          
          <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg">
            <div className="flex gap-3">
              <ExclamationTriangleIcon className="w-6 h-6 text-amber-600 flex-shrink-0" />
              <p className="text-amber-900 font-medium italic">
                “No sustituye el asesoramiento de un técnico de seguridad alimentaria ni la validación de la autoridad sanitaria competente. El usuario debe verificar la normativa aplicable en su comunidad autónoma y confirmar si necesita registro autonómico/minorista, RGSEAA u otra autorización.”
              </p>
            </div>
          </div>

          <p>
            El uso de este sistema interno no exime al titular de la actividad de sus responsabilidades legales en materia de seguridad alimentaria. Todos los datos introducidos son responsabilidad exclusiva del usuario, incluyendo:
          </p>

          <ul className="list-disc pl-6 space-y-2">
            <li>La veracidad de la lista de ingredientes y declaración de alérgenos.</li>
            <li>La correcta asignación de fechas de caducidad.</li>
            <li>El mantenimiento de los registros de temperatura y limpieza.</li>
            <li>La veracidad de los números de lote y trazabilidad ascendente y descendente.</li>
          </ul>

          <div className="pt-8 border-t border-slate-100 flex items-center justify-between">
            <div className="text-sm text-slate-400">
              Módulo de Obrador | v1.0
            </div>
            <div className="text-emerald-600 font-bold flex items-center gap-2">
              <ShieldCheckIcon className="w-5 h-5" />
              SOTOdelPRIOR Compliance
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
