'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { DocumentMagnifyingGlassIcon, ArchiveBoxIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline';

const tabs = [
    { name: 'Planificación', href: '/dashboard/purchasing/planning', icon: DocumentMagnifyingGlassIcon },
    { name: 'Almacén', href: '/dashboard/purchasing/storage', icon: ArchiveBoxIcon },
    { name: 'Mise en place', href: '/dashboard/purchasing/mise-en-place', icon: ClipboardDocumentListIcon },
];

export function PurchasingTabs() {
    const pathname = usePathname();

    return (
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => {
                const isActive = pathname.startsWith(tab.href);
                return (
                    <Link
                        key={tab.name}
                        href={tab.href}
                        className={`
                            group inline-flex items-center border-b-2 px-1 py-4 text-sm font-medium
                            ${isActive
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}
                        `}
                    >
                        <tab.icon
                            className={`
                                -ml-0.5 mr-2 h-5 w-5
                                ${isActive ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500'}
                            `}
                            aria-hidden="true"
                        />
                        <span>{tab.name}</span>
                    </Link>
                );
            })}
        </nav>
    );
}
