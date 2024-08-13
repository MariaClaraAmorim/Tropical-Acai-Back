import { FastifyRequest, FastifyReply } from 'fastify';
import prisma from '../models/prisma';

// Função para criar um cupom
export const createCoupon = async (request: FastifyRequest, reply: FastifyReply) => {
    const { code, discount } = request.body as { code: string; discount: number };

    if (!code) {
        return reply.code(400).send({ error: 'Coupon code is required' });
    }

    try {
        // Verificar se o cupom já existe
        const existingCoupon = await prisma.coupon.findUnique({
            where: { code },
        });

        if (existingCoupon) {
            return reply.code(400).send({ error: 'Coupon already exists' });
        }

        // Criar um novo cupom
        const newCoupon = await prisma.coupon.create({
            data: {
                code,
                discount,
            },
        });

        reply.code(201).send(newCoupon);
    } catch (error) {
        console.error('Error creating coupon:', error);
        reply.code(500).send({ error: 'Internal Server Error' });
    }
};

export const applyCoupon = async (request: FastifyRequest, reply: FastifyReply) => {
    const { code, clientId } = request.body as { code: string; clientId: string };

    if (!code || !clientId) {
        return reply.code(400).send({ error: 'Coupon code and clientId are required' });
    }

    try {
        const coupon = await prisma.coupon.findUnique({
            where: { code },
        });

        if (!coupon) {
            return reply.code(400).send({ error: 'Invalid coupon code' });
        }

        const completedOrderCount = await prisma.order.count({
            where: {
                clientId,
                status: {
                    in: ['saiu para entrega', 'pronto para retirada'],
                },
            },
        });

        console.log(`Completed order count for client ${clientId}: ${completedOrderCount}`);

        const nextOrderNumber = completedOrderCount + 1;
        const isEligibleForCoupon = nextOrderNumber % 10 === 1;

        if (!isEligibleForCoupon) {
            return reply.code(400).send({
                error: 'Este cupom não está disponível para este pedido. Certifique-se de que você tenha direito.'
            });
        }

        if (!coupon.redeemable) {
            return reply.code(400).send({ error: 'Coupon is no longer redeemable' });
        }

        reply.code(200).send({ success: true });
    } catch (error) {
        console.error('Error applying coupon:', error);
        reply.code(500).send({ error: 'Internal Server Error' });
    }
};
