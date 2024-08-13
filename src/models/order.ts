import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ProductInput {
    id: string;
    quantity: number;
}

export const createOrder = async (userId: string, products: ProductInput[], total: number) => {
    // Criação do pedido
    const order = await prisma.order.create({
        data: {
            userId,
            total,
            // Note que estamos apenas associando produtos aqui. Você pode precisar criar produtos separadamente se não existirem.
            products: {
                connect: products.map((product) => ({
                    id: product.id,
                })),
            },
        },
    });

    // Atualizando os produtos para associar com o pedido
    await Promise.all(
        products.map((product) =>
            prisma.product.update({
                where: { id: product.id },
                data: { orderId: order.id },
            })
        )
    );

    return order;
};

export const getOrdersByUserId = async (userId: string) => {
    return await prisma.order.findMany({
        where: { userId },
        include: {
            products: true, // Inclui detalhes dos produtos associados
        },
    });
};
