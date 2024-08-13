import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createProduct = async (name: string, ingredients: string, description: string, price: number, available: boolean) => {
    return await prisma.product.create({
        data: {
            name,
            description,
            ingredients,
            price,
            available,
        },
    });
};

export const getAllProducts = async () => {
    return await prisma.product.findMany();
};
