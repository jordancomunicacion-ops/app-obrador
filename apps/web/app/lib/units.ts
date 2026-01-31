export type UnitType = 'KG' | 'G' | 'L' | 'ML' | 'UD' | 'BOTELLA' | 'CL' | 'PACK' | 'CAJA';

export const UNITS = {
    KG: 'KG',
    G: 'G',
    L: 'L',
    ML: 'ML',
    UD: 'UD',
    BOTELLA: 'BOTELLA',
    CL: 'CL',
    PACK: 'PACK',
    CAJA: 'CAJA',
} as const;

export const UNIT_LABELS = {
    [UNITS.KG]: 'Kilogramos',
    [UNITS.G]: 'Gramos',
    [UNITS.L]: 'Litros',
    [UNITS.ML]: 'Mililitros',
    [UNITS.UD]: 'Unidades',
    [UNITS.BOTELLA]: 'Botella',
    [UNITS.CL]: 'Centilitros',
    [UNITS.PACK]: 'Pack',
    [UNITS.CAJA]: 'Caja',
};

// Base units: KG for mass, L for volume, UD for count.
// Conversion factors to Base Unit.
const CONVERSION_FACTORS: Record<UnitType, number> = {
    KG: 1,
    G: 0.001,
    L: 1,
    ML: 0.001,
    UD: 1,
    BOTELLA: 1,
    CL: 0.01,
    PACK: 1,
    CAJA: 1,
};

export function convertTo(amount: number, fromUnit: UnitType, toUnit: UnitType): number | null {
    if (fromUnit === toUnit) return amount;

    // Mass to Mass
    if ((fromUnit === 'KG' || fromUnit === 'G') && (toUnit === 'KG' || toUnit === 'G')) {
        const amountInKg = amount * CONVERSION_FACTORS[fromUnit];
        return amountInKg / CONVERSION_FACTORS[toUnit];
    }

    // Volume to Volume
    if ((fromUnit === 'L' || fromUnit === 'ML' || fromUnit === 'CL') && (toUnit === 'L' || toUnit === 'ML' || toUnit === 'CL')) {
        const amountInL = amount * CONVERSION_FACTORS[fromUnit];
        return amountInL / CONVERSION_FACTORS[toUnit];
    }

    // Unit to Unit (Identity or Count units swap)
    const countUnits = ['UD', 'BOTELLA', 'PACK', 'CAJA'];
    if (countUnits.includes(fromUnit) && countUnits.includes(toUnit)) {
        return amount;
    }

    // Incompatible types (e.g. Mass to Volume without density)
    return null;
}

export function formatUnit(amount: number, unit: UnitType): string {
    return `${amount} ${unit}`;
}
