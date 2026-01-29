import { GNSize, GNDepth, GNContainer, OPERATIONAL_MARGIN, GN_EQUIVALENCES } from './types';

/**
 * Validates if a container fits in a shelf given its depth and available height
 */
export function validateContainerFit(
    depth: GNDepth,
    shelfHeight: number,
    margin: number = OPERATIONAL_MARGIN
): boolean {
    return depth + margin <= shelfHeight;
}

/**
 * Calculates the total footprint occupancy of containers in a shelf
 * Returns a value between 0 and 12 (12 = full GN 1/1 plate)
 */
export function calculateShelfOccupancy(containers: GNContainer[]): number {
    return containers.reduce((sum, c) => sum + GN_EQUIVALENCES[c.size], 0);
}

/**
 * Checks if a shelf has capacity for a new container
 */
export function hasCapacity(currentContainers: GNContainer[], newSize: GNSize): boolean {
    const current = calculateShelfOccupancy(currentContainers);
    const needed = GN_EQUIVALENCES[newSize];
    return current + needed <= 12; // 12 = GN 1/1
}

/**
 * Gets all available depths that fit in a given shelf height
 */
export function getAvailableDepths(shelfHeight: number): GNDepth[] {
    const allDepths: GNDepth[] = [65, 100, 150, 200];
    return allDepths.filter(depth => validateContainerFit(depth, shelfHeight));
}

/**
 * Finds the best depth from a list of preferred depths that fits in the shelf
 * Returns the first depth that fits, or null if none fit
 */
export function findBestFittingDepth(
    preferredDepths: GNDepth[],
    shelfHeight: number
): GNDepth | null {
    for (const depth of preferredDepths) {
        if (validateContainerFit(depth, shelfHeight)) {
            return depth;
        }
    }
    return null;
}
