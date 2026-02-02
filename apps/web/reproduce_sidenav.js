
// Mock groups from nav-links.ts
const groups = [
    {
        name: 'Principal',
        items: [
            { name: 'Dashboard', href: '/dashboard' },
            { name: 'Eventos', href: '/dashboard/events' },
            { name: 'Tareas', href: '/dashboard/tasks' },
            { name: 'Planificación Menú', href: '/dashboard/menu-planning' },
        ]
    },
    {
        name: 'Catálogo',
        items: [
            { name: 'Productos', href: '/dashboard/products' },
            { name: 'Recetas', href: '/dashboard/recipes' },
        ]
    },
    {
        name: 'Operaciones',
        items: [
            { name: 'Compras', href: '/dashboard/purchasing' },
            { name: 'Almacén', href: '/dashboard/storage' },
            { name: 'Mise en place', href: '/dashboard/mise-en-place' },
        ]
    },
    {
        name: 'Administración',
        items: [
            { name: 'Gestión de Usuarios', href: '/dashboard/employees' },
            { name: 'Configuración', href: '/dashboard/settings' },
        ]
    }
];

// Logic from SideNav
const getPermissionId = (name, href) => {
    if (href.includes('/dashboard/events')) return 'events';
    if (href.includes('/dashboard/tasks')) return 'tasks';
    if (href.includes('/dashboard/menu-planning')) return 'menu-planning';
    if (href.includes('/dashboard/products')) return 'products';
    if (href.includes('/dashboard/recipes')) return 'recipes';
    if (href.includes('/dashboard/purchasing')) return 'purchasing';
    if (href.includes('/dashboard/storage')) return 'storage';
    if (href.includes('/dashboard/mise-en-place')) return 'mise-en-place';
    if (href.includes('/dashboard/employees')) return 'employees';
    if (href.includes('/dashboard/settings')) return 'settings';
    if (name === 'Dashboard' || href === '/dashboard') return 'dashboard';
    return '';
};

function testUser(user, description) {
    console.log(`\n--- Testing User: ${description} ---`);
    console.log(`Role: ${user?.role}, Permissions: ${user?.permissions}`);

    const filteredGroups = groups.map(group => ({
        ...group,
        items: group.items.filter(item => {
            // 1. Role Check
            if (item.name === 'Gestión de Usuarios') {
                return user?.role === 'ADMIN';
            }

            // 2. Permission Check (If not Admin)
            if (user?.role !== 'ADMIN') {
                const requiredPermission = getPermissionId(item.name, item.href);
                const userPermissions = user?.permissions || [];

                // Debug log
                // console.log(`Item: ${item.name}, Req: ${requiredPermission}, Has: ${userPermissions.includes(requiredPermission)}`);

                if (requiredPermission && !userPermissions.includes(requiredPermission)) {
                    return false;
                }
            }

            return true;
        })
    })).filter(group => group.items.length > 0);

    console.log("Visible Groups:");
    filteredGroups.forEach(g => {
        console.log(`[${g.name}]`);
        g.items.forEach(i => console.log(`  - ${i.name}`));
    });

    if (filteredGroups.length === 0) {
        console.log("(No groups visible)");
    }
}

// Test Cases
testUser({ role: 'ADMIN', permissions: [] }, "Admin (Should see everything except filtered by role logic which is none here)");
testUser({ role: 'USER', permissions: ['dashboard', 'events'] }, "User with Dashboard & Events");
testUser({ role: 'USER', permissions: [] }, "User with NO permissions");
testUser({ role: 'USER', permissions: undefined }, "User with UNDEFINED permissions");
