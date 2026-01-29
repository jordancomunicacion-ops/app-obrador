import {
    GNSize,
    GNDepth,
    VolumeLevel,
    ServiceRhythm,
    PartitionType,
    Partition,
    Shelf,
    Recommendation
} from './types';
import { validateContainerFit, findBestFittingDepth } from './validation';

/**
 * Recommends GN sizes based on partition type
 * Returns array ordered by preference (first is most recommended)
 */
export function recommendGNSize(partitionType: PartitionType): GNSize[] {
    const recommendations: Record<PartitionType, GNSize[]> = {
        'topping': ['1/9', '1/6'],
        'garnish': ['1/6', '1/4'],
        'medium': ['1/3'],
        'large': ['1/2'],
        'production': ['1/1']
    };
    return recommendations[partitionType];
}

/**
 * Recommends optimal depth based on volume level and service rhythm
 */
export function recommendDepth(
    volumeLevel: VolumeLevel,
    serviceRhythm: ServiceRhythm
): GNDepth {
    // High service rhythm with low/medium volume → shallow for speed
    if (serviceRhythm === 'alto' && volumeLevel !== 'alto') {
        return 65;
    }

    // Medium service with medium volume → standard depth
    if (serviceRhythm === 'medio' && volumeLevel === 'medio') {
        return 100;
    }

    // Low service or high volume → deep containers
    if (serviceRhythm === 'bajo' || volumeLevel === 'alto') {
        return 150;
    }

    return 100; // default
}

/**
 * Gets fallback depths in order of preference when primary doesn't fit
 */
function getFallbackDepths(primaryDepth: GNDepth): GNDepth[] {
    const allDepths: GNDepth[] = [150, 100, 65];
    return allDepths.filter(d => d < primaryDepth);
}

/**
 * Generates a complete recommendation for a partition
 * Finds the best GN size and depth, and identifies which shelf can accommodate it
 */
export function generateRecommendation(
    partition: Partition,
    shelves: Shelf[]
): Recommendation {
    // Get recommended GN sizes (ordered by preference)
    const recommendedSizes = recommendGNSize(partition.type);
    const primarySize = recommendedSizes[0];

    // Get recommended depth
    const primaryDepth = recommendDepth(partition.volumeLevel, partition.serviceRhythm);

    // Try to find a shelf that can accommodate the primary recommendation
    let bestShelf: Shelf | null = null;
    let finalDepth = primaryDepth;

    for (const shelf of shelves) {
        if (validateContainerFit(primaryDepth, shelf.availableHeight)) {
            bestShelf = shelf;
            break;
        }
    }

    // If primary depth doesn't fit anywhere, try fallbacks
    if (!bestShelf) {
        const fallbacks = getFallbackDepths(primaryDepth);
        const fittingDepth = fallbacks.find(depth =>
            shelves.some(shelf => validateContainerFit(depth, shelf.availableHeight))
        );

        if (fittingDepth) {
            finalDepth = fittingDepth;
            bestShelf = shelves.find(shelf =>
                validateContainerFit(fittingDepth, shelf.availableHeight)
            ) || null;
        }
    }

    // Generate alternatives
    const alternatives = recommendedSizes.slice(1).map(altSize => ({
        gnSize: altSize,
        depth: finalDepth,
        fits: bestShelf !== null
    }));

    return {
        partition,
        gnSize: primarySize,
        depth: finalDepth,
        shelfId: bestShelf?.id || null,
        fits: bestShelf !== null,
        reason: bestShelf
            ? `Balda ${bestShelf.id}: ${primarySize} @ ${finalDepth}mm`
            : `No hay suficiente altura para ${primaryDepth}mm (mínimo: ${finalDepth + 25}mm)`,
        alternatives
    };
}

/**
 * Generates recommendations for multiple partitions
 */
export function generateAllRecommendations(
    partitions: Partition[],
    shelves: Shelf[]
): Recommendation[] {
    return partitions.map(partition => generateRecommendation(partition, shelves));
}
