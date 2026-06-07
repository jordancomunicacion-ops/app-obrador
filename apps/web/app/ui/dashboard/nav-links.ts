import {
    UserGroupIcon,
    HomeIcon,
    DocumentDuplicateIcon,
    CalendarIcon,
    ClipboardDocumentCheckIcon,
    ArchiveBoxIcon,
    Cog6ToothIcon,
    ShoppingCartIcon,
    BuildingStorefrontIcon,
    TruckIcon,
    SunIcon,
    ChatBubbleLeftRightIcon,
    TagIcon,
    TableCellsIcon,
    ShieldCheckIcon
} from '@heroicons/react/24/outline';

/**
 * Permisos granulares por empresa (modelo CRM).
 * Mapea 1:1 a las flags de `BusinessAccess` (`apps/web/app/lib/auth/business.ts`).
 */
export type BusinessPermissionKey =
    | 'canViewDashboard'
    | 'canViewEvents'
    | 'canViewTasks'
    | 'canViewCommunications'
    | 'canViewCatalog'
    | 'canViewOperations'
    | 'canViewObrador'
    | 'canViewEcommerce'
    | 'canViewEmployees'
    | 'canManageDirectory'
    | 'canEditSettings';

export type NavItem = {
    name: string;
    href: string;
    icon: any;
    /** Si se define, SOLO esos roles ven el item; si se omite, lo ven todos. */
    roles?: string[];
    /** Permiso de BusinessAccess que debe tenerse para ver este item. */
    permission?: BusinessPermissionKey;
};

export type NavGroup = {
    name: string;
    items: NavItem[];
};

export const groups: NavGroup[] = [
    {
        name: 'Principal',
        items: [
            // "Hoy" = vista operativa del empleado; "Dashboard" = del admin.
            { name: 'Hoy', href: '/dashboard/today', icon: SunIcon, roles: ['USER'], permission: 'canViewDashboard' },
            { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, roles: ['ADMIN', 'SUPERADMIN'], permission: 'canViewDashboard' },
            { name: 'Eventos', href: '/dashboard/events', icon: CalendarIcon, permission: 'canViewEvents' },
            { name: 'Tareas', href: '/dashboard/tasks', icon: ClipboardDocumentCheckIcon, permission: 'canViewTasks' },
            { name: 'Comunicaciones', href: '/dashboard/communications', icon: ChatBubbleLeftRightIcon, permission: 'canViewCommunications' },
        ]
    },
    {
        // Pipeline del catálogo: Productos (ficha: proveedores + test carnicero +
        // perfiles aromáticos) → Recetas (combinan productos) → Planificación Menú.
        name: 'Catálogo',
        items: [
            { name: 'Productos', href: '/dashboard/products', icon: ArchiveBoxIcon, permission: 'canViewCatalog' },
            { name: 'Recetas', href: '/dashboard/recipes', icon: DocumentDuplicateIcon, permission: 'canViewCatalog' },
            { name: 'Planificación Menú', href: '/dashboard/menu-planning', icon: TableCellsIcon, permission: 'canViewCatalog' },
        ]
    },
    {
        name: 'Operaciones',
        items: [
            { name: 'Compras', href: '/dashboard/purchasing', icon: ShoppingCartIcon, permission: 'canViewOperations' },
            { name: 'Pedidos a proveedores', href: '/dashboard/purchasing/orders', icon: ShoppingCartIcon, permission: 'canViewOperations' },
            { name: 'Almacén', href: '/dashboard/storage', icon: ArchiveBoxIcon, permission: 'canViewOperations' },
            { name: 'Mise en place', href: '/dashboard/mise-en-place', icon: ClipboardDocumentCheckIcon, permission: 'canViewOperations' },
            { name: 'Etiquetas', href: '/dashboard/labels', icon: TagIcon, permission: 'canViewOperations' },
            { name: 'Obrador', href: '/dashboard/obrador', icon: BuildingStorefrontIcon, permission: 'canViewObrador' },
            { name: 'Controles sanitarios', href: '/dashboard/obrador/compliance', icon: ShieldCheckIcon, permission: 'canViewObrador' },
        ]
    },
    {
        // Tienda online: catálogo vendible (MasterProduct.isSellableOnline) y los
        // pedidos que llegan de la web. La web es solo escaparate + cobro (Stripe);
        // el obrador es la fuente de verdad. Aislado por local (multi-restaurante).
        name: 'Ecommerce',
        items: [
            { name: 'Productos online', href: '/dashboard/ecommerce/products', icon: BuildingStorefrontIcon, permission: 'canViewEcommerce' },
            { name: 'Pedidos online', href: '/dashboard/ecommerce/orders', icon: ShoppingCartIcon, permission: 'canViewEcommerce' },
        ]
    },
    {
        name: 'Administración',
        items: [
            // RRHH y contabilidad (fichajes, turnos, solicitudes, caja, EBITDA) viven en
            // la app de contabilidad (contabilidad.sotodelprior.com), no en cocina.
            { name: 'Gestión de Usuarios', href: '/dashboard/employees', icon: UserGroupIcon, permission: 'canViewEmployees' },
            { name: 'Proveedores', href: '/dashboard/settings/suppliers', icon: TruckIcon, permission: 'canManageDirectory' },
            { name: 'Clientes y Puntos de Venta', href: '/dashboard/settings/customers', icon: UserGroupIcon, permission: 'canManageDirectory' },
            { name: 'Documentación', href: '/dashboard/obrador/documents', icon: ClipboardDocumentCheckIcon, permission: 'canViewObrador' },
            // Empresas/Accesos (gestión de plataforma) viven dentro de Configuración
            // como secciones visibles solo al SUPERADMIN; no salen al sidebar.
            { name: 'Configuración', href: '/dashboard/settings', icon: Cog6ToothIcon, permission: 'canEditSettings' },
        ]
    }
];
