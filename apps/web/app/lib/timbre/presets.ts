import { GNContainer, GNSize, GNDepth } from './types';

export interface ShelfPreset {
    id: string;
    name: string;
    description: string;
    containers: Array<{
        size: GNSize;
        depth: GNDepth;
        count: number;
    }>;
    minHeight: number; // Minimum shelf height required (mm)
    use: string;
}

/**
 * Preset shelf configurations for common use cases
 */
export const SHELF_PRESETS: ShelfPreset[] = [
    {
        id: 'mise_activa',
        name: 'Mise Activa',
        description: '6 contenedores pequeños para alta rotación',
        containers: [{ size: '1/6', depth: 65, count: 6 }],
        minHeight: 90, // 65 + 25 margin
        use: 'Velocidad + visibilidad durante el servicio'
    },
    {
        id: 'mixta',
        name: 'Mixta',
        description: '1 base grande + 3 complementos',
        containers: [
            { size: '1/2', depth: 100, count: 1 },
            { size: '1/6', depth: 100, count: 3 }
        ],
        minHeight: 125, // 100 + 25 margin
        use: 'Partida base + complementos pequeños'
    },
    {
        id: 'partidas_medias',
        name: 'Partidas Medias',
        description: '3 contenedores medianos',
        containers: [{ size: '1/3', depth: 100, count: 3 }],
        minHeight: 125, // 100 + 25 margin
        use: 'Orden simple y organización clara'
    },
    {
        id: 'volumen',
        name: 'Volumen',
        description: '2 contenedores grandes para producción',
        containers: [{ size: '1/2', depth: 150, count: 2 }],
        minHeight: 175, // 150 + 25 margin
        use: 'Producción o backups de gran volumen'
    },
    {
        id: 'produccion',
        name: 'Producción',
        description: '1 contenedor GN 1/1 completo',
        containers: [{ size: '1/1', depth: 200, count: 1 }],
        minHeight: 225, // 200 + 25 margin
        use: 'Preparaciones grandes o almacenamiento'
    }
];

/**
 * Gets all presets that fit in a given shelf height
 */
export function getCompatiblePresets(shelfHeight: number): ShelfPreset[] {
    return SHELF_PRESETS.filter(preset => preset.minHeight <= shelfHeight);
}

/**
 * Converts a preset to an array of actual GN containers
 */
export function presetToContainers(preset: ShelfPreset): GNContainer[] {
    const containers: GNContainer[] = [];

    for (const spec of preset.containers) {
        for (let i = 0; i < spec.count; i++) {
            containers.push({
                size: spec.size,
                depth: spec.depth
            });
        }
    }

    return containers;
}

/**
 * Common GN combinations that equal 1/1 footprint
 */
export const COMMON_COMBINATIONS = [
    { name: '2 × 1/2', sizes: ['1/2', '1/2'] },
    { name: '3 × 1/3', sizes: ['1/3', '1/3', '1/3'] },
    { name: '4 × 1/4', sizes: ['1/4', '1/4', '1/4', '1/4'] },
    { name: '6 × 1/6', sizes: ['1/6', '1/6', '1/6', '1/6', '1/6', '1/6'] },
    { name: '9 × 1/9', sizes: ['1/9', '1/9', '1/9', '1/9', '1/9', '1/9', '1/9', '1/9', '1/9'] },
    { name: '1 × 1/2 + 2 × 1/4', sizes: ['1/2', '1/4', '1/4'] },
    { name: '1 × 1/2 + 3 × 1/6', sizes: ['1/2', '1/6', '1/6', '1/6'] },
    { name: '2 × 1/3 + 2 × 1/6', sizes: ['1/3', '1/3', '1/6', '1/6'] },
    { name: '1 × 1/3 + 4 × 1/6', sizes: ['1/3', '1/6', '1/6', '1/6', '1/6'] },
] as const;
