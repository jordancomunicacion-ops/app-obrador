import {
    UserGroupIcon,
    HomeIcon,
    DocumentDuplicateIcon,
    CalendarIcon,
    ClipboardDocumentCheckIcon,
    ArchiveBoxIcon,
    Cog6ToothIcon,
    ShoppingCartIcon,
    TableCellsIcon
} from '@heroicons/react/24/outline';

export const groups = [
    {
        name: 'Principal',
        items: [
            { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
            { name: 'Eventos', href: '/dashboard/events', icon: CalendarIcon },
            { name: 'Tareas', href: '/dashboard/tasks', icon: ClipboardDocumentCheckIcon },
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
        ]
    },
    {
        name: 'Administración',
        items: [
            { name: 'Gestión de Usuarios', href: '/dashboard/employees', icon: UserGroupIcon },
            { name: 'Configuración', href: '/dashboard/settings', icon: Cog6ToothIcon },
        ]
    }
];
