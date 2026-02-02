'use client';

// This component needs to be async to fetch data, but it was a 'use client' component before due to hooks.
// We need to split it or make it a Server Component and pass props to a Client Component part if needed.
// OR, we can fetch data in Layout and pass it down. 
// BUT, SideNav is imported in Layout. Layout is async.
// Let's modify Layout to fetch AppConfig and pass it to SideNav.
// SideNav is 'use client' so it can accept props.
// Wait, SideNav already accepts `user`.
// So I should modify `layout.tsx` to fetch AppConfig and pass `logoUrl` to `SideNav`.

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { groups } from './nav-links';
import {
    PowerIcon,
    UserIcon,
    ArrowRightOnRectangleIcon,
    ChevronDownIcon,
    ChevronRightIcon
} from '@heroicons/react/24/outline';
import { signOutAction } from '@/app/lib/actions';
import { useState, useEffect } from 'react';

export default function SideNav({ user, logoUrl }: { user?: any, logoUrl?: string | null }) {
    const pathname = usePathname();
    const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

    // Filter groups and items based on role
    const filteredGroups = groups.map(group => ({
        ...group,
        items: group.items.filter(item => {
            if (item.name === 'Gestión de Usuarios') {
                return user?.role === 'ADMIN';
            }
            return true;
        })
    })).filter(group => group.items.length > 0);

    // Initialize/Auto-expand section containing the active link
    useEffect(() => {
        const newOpenSections: Record<string, boolean> = { ...openSections };
        let changed = false;

        filteredGroups.forEach(group => {
            const hasActiveLink = group.items.some(item => pathname === item.href);
            if (hasActiveLink && !openSections[group.name]) {
                newOpenSections[group.name] = true;
                changed = true;
            }
        });

        if (changed) {
            setOpenSections(newOpenSections);
        }
    }, [pathname, filteredGroups]);

    const toggleSection = (name: string) => {
        setOpenSections(prev => ({
            ...prev,
            [name]: !prev[name]
        }));
    };

    return (
        <aside className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col fixed left-0 top-0 z-30 shadow-sm">
            {/* LOGO */}
            <div className="p-4 flex justify-center border-b border-gray-100">
                <img src={logoUrl || "/logo-text.png"} alt="SOTO DEL PRIOR" className="h-12 object-contain" />
            </div>

            {/* PROFILE */}
            <div className="p-6 border-b border-gray-100 flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg uppercase">
                    {user?.name?.[0] || 'U'}
                </div>
                <div>
                    <p className="font-bold text-gray-800 text-sm truncate w-32">{user?.name || 'Usuario'}</p>
                    <p className="text-xs text-gray-500">{user?.role || 'Empleado'}</p>
                </div>
            </div>

            {/* NAVIGATION */}
            <nav className="flex-1 p-4 space-y-4 overflow-y-auto">
                {filteredGroups.map((group) => {
                    const isOpen = openSections[group.name];
                    return (
                        <div key={group.name} className="space-y-1">
                            {/* Group Header */}
                            <button
                                onClick={() => toggleSection(group.name)}
                                className="w-full flex items-center justify-between px-2 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:text-gray-600 transition-colors"
                            >
                                <span>{group.name}</span>
                                {isOpen ? (
                                    <ChevronDownIcon className="w-3 h-3" />
                                ) : (
                                    <ChevronRightIcon className="w-3 h-3" />
                                )}
                            </button>

                            {/* Group Items */}
                            {isOpen && (
                                <div className="space-y-1 mt-1">
                                    {group.items.map((item) => {
                                        const LinkIcon = item.icon;
                                        const isActive = pathname === item.href;
                                        return (
                                            <Link
                                                key={item.name}
                                                href={item.href}
                                                className={clsx(
                                                    'w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                                                    {
                                                        'bg-indigo-50 text-indigo-700 shadow-sm': isActive,
                                                        'text-gray-600 hover:bg-gray-50 hover:text-gray-900': !isActive,
                                                    },
                                                )}
                                            >
                                                <LinkIcon className="w-5" />
                                                {item.name}
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </nav>

            {/* FOOTER */}
            <div className="p-4 border-t border-gray-100 space-y-1">
                <Link
                    href="/dashboard/profile"
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition-colors"
                >
                    <UserIcon className="w-5" />
                    <span>Mi Perfil</span>
                </Link>
                <form action={signOutAction}>
                    <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:text-red-700 rounded-lg hover:bg-red-50 transition-colors">
                        <ArrowRightOnRectangleIcon className="w-5" />
                        <span>Cerrar Sesión</span>
                    </button>
                </form>
            </div>
        </aside>
    );
}
