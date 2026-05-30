import {
    UserGroupIcon,
    HomeIcon,
    DocumentDuplicateIcon,
    CalendarIcon,
    ClipboardDocumentCheckIcon,
    ArchiveBoxIcon,
    Cog6ToothIcon,
    ShoppingCartIcon,
    TableCellsIcon,
    BuildingStorefrontIcon,
    SunIcon,
    ChatBubbleLeftRightIcon,
    ClockIcon,
    EnvelopeIcon
} from '@heroicons/react/24/outline';

export const groups = [
    {
        name: 'Principal',
        items: [
            { name: 'Hoy', href: '/dashboard/today', icon: SunIcon },
            { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
            { name: 'Eventos', href: '/dashboard/events', icon: CalendarIcon },
            { name: 'Tareas', href: '/dashboard/tasks', icon: ClipboardDocumentCheckIcon },
            { name: 'Comunicaciones', href: '/dashboard/communications', icon: ChatBubbleLeftRightIcon },
            { name: 'Planificación Menú', href: '/dashboard/menu-planning', icon: TableCellsIcon },
        ]
    },
    {
        name: 'Catálogo',
        items: [
            { name: 'Productos', href: '/dashboard/products', icon: ArchiveBoxIcon },
            { name: 'Recetas', href: '/dashboard/recipes', icon: DocumentDuplicateIcon },
        ]
    },
    {
        name: 'Operaciones',
        items: [
            { name: 'Compras', href: '/dashboard/purchasing', icon: ShoppingCartIcon },
            { name: 'Almacén', href: '/dashboard/storage', icon: ArchiveBoxIcon },
            { name: 'Mise en place', href: '/dashboard/mise-en-place', icon: ClipboardDocumentCheckIcon },
            { name: 'Obrador', href: '/dashboard/obrador', icon: BuildingStorefrontIcon },
        ]
    },
    {
        name: 'Administración',
        items: [
            { name: 'Gestión de Usuarios', href: '/dashboard/employees', icon: UserGroupIcon },
            { name: 'Fichajes', href: '/dashboard/clock-in', icon: ClockIcon },
            { name: 'Solicitudes', href: '/dashboard/requests', icon: EnvelopeIcon },
            { name: 'Locales', href: '/dashboard/settings/locations', icon: BuildingStorefrontIcon },
            { name: 'Configuración', href: '/dashboard/settings', icon: Cog6ToothIcon },
        ]
    }
];
