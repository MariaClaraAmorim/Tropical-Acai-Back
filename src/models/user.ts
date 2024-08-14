import { Role } from '@prisma/client';
import { prisma } from '../prismaClient';

export const createUser = async (email: string, password: string, name: string, role: Role, clientId: string) => {
    return await prisma.user.create({
        data: {
            email,
            password,
            name,
            role,
            clientId,
        },
    });
};

export const findUserByEmail = async (email: string) => {
    console.log('Finding user by email:', email);
    return prisma.user.findUnique({
        where: {
            email,
        },
    });
};
