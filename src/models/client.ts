const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const updateOrderCount = async (clientId: string) => {
    const client = await prisma.client.update({
        where: { id: clientId },
        data: { ordersCount: { increment: 1 } },
    });
    return client;
};

const resetOrderCount = async (clientId: string) => {
    const client = await prisma.client.update({
        where: { id: clientId },
        data: { ordersCount: 0 },
    });
    return client;
};

module.exports = {
    updateOrderCount,
    resetOrderCount,
};
