// Constantes compartidas del módulo obrador.
// IMPORTANTE: este archivo NO lleva 'use server' — los action files ('use server')
// solo pueden exportar funciones async, así que las constantes viven aquí.

// Los 14 alérgenos de declaración obligatoria (Reglamento UE 1169/2011).
export const OBRADOR_ALLERGENS = [
  'Gluten', 'Crustáceos', 'Huevos', 'Pescado', 'Cacahuetes', 'Soja', 'Leche',
  'Frutos de cáscara', 'Apio', 'Mostaza', 'Sésamo', 'Sulfitos', 'Altramuces', 'Moluscos',
] as const;

export const CUSTOMER_TYPES = [
  'Consumidor final',
  'Minorista',
  'Profesional (HORECA)',
  'Online',
  'Venta Directa',
] as const;

export const DOCUMENT_CATEGORIES = [
  'Registro',
  'APPCC',
  'Limpieza',
  'Plagas',
  'Formación',
  'Fichas',
  'Albaranes',
  'Facturas',
  'Certificados',
  'Incidencias',
  'Retiradas',
  'Inspecciones',
] as const;
