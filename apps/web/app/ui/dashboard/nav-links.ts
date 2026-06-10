import {
    HomeIcon,
    DocumentDuplicateIcon,
    CalendarIcon,
    ClipboardDocumentCheckIcon,
    ArchiveBoxIcon,
    Cog6ToothIcon,
    ShoppingCartIcon,
    BuildingStorefrontIcon,
    SunIcon,
    ChatBubbleLeftRightIcon,
    TableCellsIcon,
    ShieldCheckIcon,
    BellIcon
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
    | 'canEditSettings'
    | 'canViewAllNotifications';

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
            // Tareas (gestión): dirección y encargados. El trabajador no gestiona
            // tareas: las suyas le salen en "Hoy" (el layout de /tasks lo redirige).
            { name: 'Tareas', href: '/dashboard/tasks', icon: ClipboardDocumentCheckIcon, permission: 'canViewAllNotifications' },
            // Comunicaciones: todos. El contenido se filtra por jerarquía (dirección
            // todo, encargado su área/local, trabajador solo las suyas) y el
            // trabajador solo puede dirigirlas a sus encargados.
            { name: 'Comunicaciones', href: '/dashboard/communications', icon: ChatBubbleLeftRightIcon, permission: 'canViewCommunications' },
            // Notificaciones: visible para todos; el contenido se filtra por rol/área
            // (admin/superadmin leen todas, el USER solo las que le implican).
            { name: 'Notificaciones', href: '/dashboard/notifications', icon: BellIcon, permission: 'canViewDashboard' },
        ]
    },
    {
        name: 'Operaciones',
        items: [
            { name: 'Obrador', href: '/dashboard/obrador', icon: BuildingStorefrontIcon, permission: 'canViewObrador' },
            // Pedidos: pestañas Local (pendiente) + Online. De momento apunta al online
            // existente; la página con pestañas se monta en la pasada de la sección.
            { name: 'Pedidos', href: '/dashboard/ecommerce/orders', icon: ShoppingCartIcon, permission: 'canViewEcommerce' },
            { name: 'Eventos', href: '/dashboard/events', icon: CalendarIcon, permission: 'canViewEvents' },
            { name: 'Planificación Menú', href: '/dashboard/menu-planning', icon: TableCellsIcon, permission: 'canViewCatalog' },
            { name: 'Mise en place', href: '/dashboard/mise-en-place', icon: ClipboardDocumentCheckIcon, permission: 'canViewOperations' },
            { name: 'Almacén', href: '/dashboard/storage', icon: ArchiveBoxIcon, permission: 'canViewOperations' },
            { name: 'Controles sanitarios', href: '/dashboard/obrador/compliance', icon: ShieldCheckIcon, permission: 'canViewObrador' },
            // Etiquetas pasa a vivir dentro del Obrador (no en el sidebar).
        ]
    },
    {
        // Pipeline del catálogo: Productos (pestañas Local + Online) → Recetas
        // (combinan productos) → Compras y pedidos a proveedor.
        name: 'Catálogo',
        items: [
            // Productos: pestañas Local (/products) + Online (/ecommerce/products).
            // De momento apunta al catálogo local; las pestañas se montan en su pasada.
            { name: 'Productos', href: '/dashboard/products', icon: ArchiveBoxIcon, permission: 'canViewCatalog' },
            { name: 'Recetas', href: '/dashboard/recipes', icon: DocumentDuplicateIcon, permission: 'canViewCatalog' },
            // Compras y pedidos a proveedor: pestañas Compras (/purchasing) + Pedidos
            // (/purchasing/orders). De momento apunta a Compras.
            { name: 'Compras y pedidos a proveedor', href: '/dashboard/purchasing', icon: ShoppingCartIcon, permission: 'canViewOperations' },
        ]
    },
    {
        // RRHH y contabilidad (fichajes, turnos, solicitudes, caja, EBITDA) viven en
        // la app de contabilidad (contabilidad.sotodelprior.com), no en cocina.
        name: 'Administración',
        items: [
            // Locales: lista de locales del negocio. Dentro de cada local se gestionan
            // sus empleados, proveedores, clientes/PdV y documentación (todo por local).
            { name: 'Locales', href: '/dashboard/settings/locations', icon: BuildingStorefrontIcon, permission: 'canEditSettings' },
            // Configuración: catálogo (categorías de producto/receta, envases), plataforma
            // (Empresas, solo SUPERADMIN) y otros ajustes transversales del negocio.
            { name: 'Configuración', href: '/dashboard/settings', icon: Cog6ToothIcon, permission: 'canEditSettings' },
        ]
    }
];
