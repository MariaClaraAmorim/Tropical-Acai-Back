import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const JWT_SECRET = 'your-secret-key'; // Troque pelo seu segredo JWT

export const verifyToken = async (token: string | undefined) => {
    if (!token) {
        throw new Error('No token provided');
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

    if (!user) {
        throw new Error('User not found');
    }

    return user;
};
