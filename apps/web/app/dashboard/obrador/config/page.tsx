import { redirect } from 'next/navigation';

// Los datos del establecimiento se gestionan ahora por local en Administración → Locales.
export default function ObradorConfigPage() {
  redirect('/dashboard/settings/locations');
}
