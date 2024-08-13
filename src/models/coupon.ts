import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createCoupon = async (userId: string, code: string) => {
    return await prisma.coupon.create({
        data: {
            userId,
            code,
        },
    });
};

export const useCoupon = async (couponId: string) => {
    return await prisma.coupon.update({
        where: { id: couponId },
        data: { used: true },
    });
};

export const getCouponsByUserId = async (userId: string) => {
    return await prisma.coupon.findMany({
        where: { userId },
    });
};
