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
    TableCellsIcon
} from '@heroicons/react/24/outline';

export type NavItem = {
    name: string;
    href: string;
    icon: any;
    // Si se define, SOLO esos roles ven el item; si se omite, lo ven todos.
    roles?: string[];
};

export type NavGroup = {
    name: string;
    items: NavItem[];
};

export const groups: NavGroup[] = [
    {
        name: 'Principal',
        items: [
            // "Hoy" es la vista operativa del empleado; "Dashboard" la del admin.
            { name: 'Hoy', href: '/dashboard/today', icon: SunIcon, roles: ['USER'] },
            { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, roles: ['ADMIN', 'SUPERADMIN'] },
            { name: 'Eventos', href: '/dashboard/events', icon: CalendarIcon },
            { name: 'Tareas', href: '/dashboard/tasks', icon: ClipboardDocumentCheckIcon },
            { name: 'Comunicaciones', href: '/dashboard/communications', icon: ChatBubbleLeftRightIcon },
        ]
    },
    {
        // Pipeline del catálogo: Productos (ficha: proveedores + test carnicero +
        // perfiles aromáticos) → Recetas (combinan productos) → Planificación Menú
        // (agrega las cantidades totales necesarias).
        name: 'Catálogo',
        items: [
            { name: 'Productos', href: '/dashboard/products', icon: ArchiveBoxIcon },
            { name: 'Recetas', href: '/dashboard/recipes', icon: DocumentDuplicateIcon },
            { name: 'Planificación Menú', href: '/dashboard/menu-planning', icon: TableCellsIcon },
        ]
    },
    {
        name: 'Operaciones',
        items: [
            { name: 'Compras', href: '/dashboard/purchasing', icon: ShoppingCartIcon },
            { name: 'Pedidos a proveedores', href: '/dashboard/purchasing/orders', icon: ShoppingCartIcon },
            { name: 'Almacén', href: '/dashboard/storage', icon: ArchiveBoxIcon },
            { name: 'Mise en place', href: '/dashboard/mise-en-place', icon: ClipboardDocumentCheckIcon },
            { name: 'Etiquetas', href: '/dashboard/labels', icon: TagIcon },
            { name: 'Obrador', href: '/dashboard/obrador', icon: BuildingStorefrontIcon },
        ]
    },
    {
        name: 'Administración',
        items: [
            // RRHH y contabilidad (fichajes, turnos, solicitudes, caja, EBITDA) viven en
            // la app de contabilidad (contabilidad.sotodelprior.com), no en cocina.
            { name: 'Gestión de Usuarios', href: '/dashboard/employees', icon: UserGroupIcon },
            { name: 'Locales', href: '/dashboard/settings/locations', icon: BuildingStorefrontIcon },
            { name: 'Proveedores', href: '/dashboard/settings/suppliers', icon: TruckIcon },
            { name: 'Configuración', href: '/dashboard/settings', icon: Cog6ToothIcon },
        ]
    }
];
