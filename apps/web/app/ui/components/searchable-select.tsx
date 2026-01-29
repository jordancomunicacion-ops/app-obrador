'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronUpDownIcon, CheckIcon } from '@heroicons/react/24/outline';

export type Option = {
    value: string;
    label: string;
    group?: string;
};

type Props = {
    options: Option[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
};

export default function SearchableSelect({ options, value, onChange, placeholder = 'Seleccionar...', className = '' }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Initial label
    const selectedOption = options.find(o => o.value === value);
    const [displayLabel, setDisplayLabel] = useState(selectedOption ? selectedOption.label : '');

    // Update label when value changes externally
    useEffect(() => {
        const option = options.find(o => o.value === value);
        setDisplayLabel(option ? option.label : '');
    }, [value, options]);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearchTerm(''); // Reset search on close
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // Filter options
    const filteredOptions = options.filter(option =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Group options
    const groupedOptions = filteredOptions.reduce((acc, option) => {
        const group = option.group || 'Otros';
        if (!acc[group]) acc[group] = [];
        acc[group].push(option);
        return acc;
    }, {} as Record<string, Option[]>);

    const handleSelect = (option: Option) => {
        onChange(option.value);
        setDisplayLabel(option.label);
        setIsOpen(false);
        setSearchTerm('');
    };

    return (
        <div className={`relative ${className}`} ref={wrapperRef}>
            {/* Trigger */}
            <div
                className="relative w-full cursor-default rounded-md border border-gray-200 bg-white py-2 pl-3 pr-10 text-left text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                onClick={() => {
                    setIsOpen(!isOpen);
                    if (!isOpen) setSearchTerm(''); // Clear previous search if any
                }}
            >
                <span className={`block truncate ${!value ? 'text-gray-500' : ''}`}>
                    {value ? displayLabel : placeholder}
                </span>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                    <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </span>
            </div>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                    {/* Search Input */}
                    <div className="sticky top-0 bg-white p-2 border-b">
                        <input
                            type="text"
                            className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none"
                            placeholder="Buscar..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            autoFocus
                        />
                    </div>

                    {/* Options */}
                    {Object.keys(groupedOptions).length === 0 ? (
                        <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                            No se encontraron resultados.
                        </div>
                    ) : (
                        Object.entries(groupedOptions).map(([group, groupOptions]) => (
                            <div key={group}>
                                {/* Show group header only if grouped */}
                                {group !== 'Otros' && (
                                    <div className="bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-500 uppercase">
                                        {group}
                                    </div>
                                )}
                                {groupOptions.map((option) => (
                                    <div
                                        key={option.value}
                                        className={`relative cursor-default select-none py-2 pl-3 pr-9 ${option.value === value ? 'bg-blue-100 text-blue-900' : 'text-gray-900 hover:bg-gray-100'
                                            }`}
                                        onClick={() => handleSelect(option)}
                                    >
                                        <span className={`block truncate ${option.value === value ? 'font-semibold' : 'font-normal'}`}>
                                            {option.label}
                                        </span>
                                        {option.value === value && (
                                            <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-blue-600">
                                                <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
