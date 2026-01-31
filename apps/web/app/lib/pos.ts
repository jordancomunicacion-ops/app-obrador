import { prisma } from '@/lib/prisma';

export interface POSSalesData {
    recipeId: string;
    recipeName: string;
    quantity: number;
    revenue: number;
}

export interface POSProvider {
    id: string;
    name: string;
    fetchSales(date: Date): Promise<POSSalesData[]>;
}

/**
 * Mock implementation of REVO POS for demonstration/development.
 */
export class RevoMockProvider implements POSProvider {
    id = 'REVO';
    name = 'Revo POS';

    async fetchSales(date: Date): Promise<POSSalesData[]> {
        // Fetch recipes to simulate matching sales
        const recipes = await prisma.recipe.findMany({
            where: { category: 'ELABORACION_FINAL' },
            take: 5
        });

        return recipes.map(r => ({
            recipeId: r.id,
            recipeName: r.name,
            quantity: Math.floor(Math.random() * 20) + 5,
            revenue: (Math.random() * 50) + 10
        }));
    }
}

export async function syncSalesFromPOS(integrationId: string, date: Date) {
    const integration = await prisma.pOSIntegration.findUnique({
        where: { id: integrationId }
    });

    if (!integration || !integration.isActive) {
        return { success: false, message: 'POS Integration not found or inactive' };
    }

    let provider: POSProvider;
    if (integration.provider === 'REVO') {
        provider = new RevoMockProvider();
    } else {
        return { success: false, message: `Provider ${integration.provider} not implemented` };
    }

    try {
        const sales = await provider.fetchSales(date);
        const dayStart = new Date(date);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(date);
        dayEnd.setHours(23, 59, 59, 999);

        for (const item of sales) {
            // Upsert sales record to avoid duplicates on multi-sync
            await prisma.salesRecord.create({
                data: {
                    date,
                    recipeId: item.recipeId,
                    quantitySold: item.quantity,
                    totalRevenue: item.revenue,
                    source: integration.provider
                }
            });

            // Update realPax in MenuServiceItems for this date if they exist
            await prisma.menuServiceItem.updateMany({
                where: {
                    recipeId: item.recipeId,
                    menuService: {
                        AND: [
                            { startDate: { lte: dayEnd } },
                            { endDate: { gte: dayStart } }
                        ]
                    }
                },
                data: {
                    realPax: item.quantity
                }
            });
        }

        await prisma.pOSIntegration.update({
            where: { id: integrationId },
            data: { lastSync: new Date() }
        });

        return { success: true, count: sales.length };
    } catch (error) {
        console.error('POS Sync Error:', error);
        return { success: false, message: 'Failed to sync sales from POS' };
    }
}
