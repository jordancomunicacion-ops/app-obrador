// Core type definitions for the Gastronorm Timbre system

export type GNSize = '1/1' | '1/2' | '1/3' | '1/4' | '1/6' | '1/9' | '2/3';

export type GNDepth = 65 | 100 | 150 | 200; // mm

export type VolumeLevel = 'bajo' | 'medio' | 'alto';

export type ServiceRhythm = 'alto' | 'medio' | 'bajo';

export type PartitionType =
    | 'topping'      // Toppings / hierbas / micro-prep
    | 'garnish'      // Guarniciones pequeñas / salsas de apoyo
    | 'medium'       // Partidas medianas (brunoise, sofritos, ensaladilla)
    | 'large'        // Partidas grandes (pasta base, patata, salsas grandes)
    | 'production';  // Producción o base grande

export interface GNContainer {
    size: GNSize;
    depth: GNDepth;
    capacityLiters?: number; // Optional reference
}

export interface Shelf {
    id: string;
    availableHeight: number; // mm
    containers: GNContainer[];
}

export interface Timbre {
    id: string;
    name: string;
    shelves: Shelf[];
}

export interface Partition {
    id: string;
    name: string;
    type: PartitionType;
    volumeLevel: VolumeLevel;
    serviceRhythm: ServiceRhythm;
}

export interface Recommendation {
    partition: Partition;
    gnSize: GNSize;
    depth: GNDepth;
    shelfId: string | null;
    fits: boolean;
    reason?: string;
    alternatives?: Array<{
        gnSize: GNSize;
        depth: GNDepth;
        fits: boolean;
    }>;
}

// GN Equivalences (Footprint) - units in a 1/1 plate
export const GN_EQUIVALENCES: Record<GNSize, number> = {
    '1/1': 12,
    '1/2': 6,
    '2/3': 8,
    '1/3': 4,
    '1/4': 3,
    '1/6': 2,
    '1/9': 1.33
};

// Standard operational margin for handling containers
export const OPERATIONAL_MARGIN = 25; // mm
