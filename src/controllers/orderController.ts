import { FastifyReply, FastifyRequest } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { calculateDeliveryFeeFromCep } from '../service/addressService';
import { broadcastOrder } from '../websocket';

const prisma = new PrismaClient();

interface OrderProductCreateInput {
    productId: string;
    quantity: number;
    price: number;
}

interface OrderFruitCreateInput {
    id: string;
    name: string;
    price: number;
}

interface OrderToppingCreateInput {
    id: string;
    name: string;
    price: number;
    isFree?: boolean;
}

interface OrderSizeCreateInput {
    id: string;
    name: string;
    volume: number;
    price: number;
}

interface OrderCreamCreateInput {
    id: string;
    name: string;
    price: number;
}

interface CreateOrderPayload {
    clientId: string;
    products?: OrderProductCreateInput[];
    fruits?: OrderFruitCreateInput[];
    toppings?: OrderToppingCreateInput[];
    size?: OrderSizeCreateInput;
    cream?: OrderCreamCreateInput;
    total: number;
    couponCode?: string;
    deliveryMethod: 'pickup' | 'delivery';
    deliveryAddress?: {
        cep: string;
        logradouro: string;
        numero: string;
        complemento?: string;
        bairro: string;
        localidade: string;
        uf?: string;
    };
}

export const placeOrder = async (request: FastifyRequest<{ Body: CreateOrderPayload }>, reply: FastifyReply) => {
    const {
        clientId,
        products,
        fruits,
        toppings,
        size,
        cream,
        deliveryMethod,
        deliveryAddress,
        total,
        couponCode
    } = request.body;

    if (!clientId || typeof total !== 'number' || !deliveryMethod) {
        return reply.code(400).send({ error: 'Invalid request body' });
    }

    if (deliveryMethod === 'delivery' && (!deliveryAddress?.cep || !deliveryAddress?.numero)) {
        return reply.code(400).send({ error: 'CEP and número are required for delivery orders' });
    }

    try {

        let deliveryFee = 0;
        if (deliveryMethod === 'delivery' && deliveryAddress?.cep) {
            deliveryFee = await calculateDeliveryFeeFromCep(deliveryAddress.cep);
        }

        // Verificar e aplicar cupom
        const { discount, couponId } = await incrementOrderCountAndApplyCoupon(clientId, couponCode);

        const finalTotal = parseFloat((total + deliveryFee - discount).toFixed(2));

        // Criação do pedido
        const order = await prisma.order.create({
            data: {
                clientId,
                total: finalTotal,
                deliveryMethod,
                deliveryAddress: deliveryAddress ? JSON.stringify(deliveryAddress) : null,
                deliveryFee: parseFloat(deliveryFee.toFixed(2)),
                couponId: couponId ?? null,
                sizeId: size?.id,
                creamId: cream?.id,
                fruits: fruits ? {
                    create: fruits.map(fruit => ({
                        fruitId: fruit.id,
                        price: parseFloat(fruit.price.toFixed(2)),
                    }))
                } : undefined,
                toppings: toppings ? {
                    create: toppings.map(topping => ({
                        toppingId: topping.id,
                        price: parseFloat(topping.price.toFixed(2)),
                        isFree: topping.isFree ?? false,
                    }))
                } : undefined,
                products: products ? {
                    create: products.map(product => ({
                        productId: product.productId,
                        quantity: product.quantity,
                        price: parseFloat(product.price.toFixed(2)),
                    }))
                } : undefined,
            },
            include: {
                fruits: true,
                toppings: true,
                products: true,
                size: true,
                cream: true,
                coupon: true,
            }
        });

        // Notificar todos os clientes conectados
        broadcastOrder(order);

        reply.code(201).send(order);
    } catch (error) {
        console.error('Error placing order:', error);
        reply.code(500).send({ error: 'Internal Server Error' });
    }
};

export async function incrementOrderCountAndApplyCoupon(clientId: string, couponCode?: string) {
    const orderCount = await prisma.order.count({
        where: { clientId },
    });

    let discount = 0;
    let couponId = null;

    console.log(`Order count for clientId ${clientId}: ${orderCount}`);

    if (couponCode) {
        console.log(`Coupon code provided: ${couponCode}`);

        // Verifica se o cliente está fazendo o 11º, 21º, 31º, etc. pedido
        const nextOrderNumber = orderCount + 1;
        const eligibleForCoupon = nextOrderNumber % 10 === 1;

        if (eligibleForCoupon) {
            const coupon = await prisma.coupon.findUnique({
                where: { code: couponCode },
            });

            if (!coupon) {
                console.error(`Coupon code ${couponCode} does not exist.`);
                throw new Error('Invalid coupon code');
            }

            discount = coupon.discount;
            couponId = coupon.id;

            console.log(`Coupon ${couponCode} applied successfully. Discount: ${discount}`);
        } else {
            console.error(`Client has ${orderCount} orders. Coupon can only be redeemed on the 11th, 21st, 31st, etc., orders.`);
            throw new Error('Coupon can only be redeemed on the 11th, 21st, 31st, etc., orders.');
        }
    } else {
        console.log("No coupon code provided, proceeding without coupon.");
    }

    return { discount, couponId };
}

export const getOrderCount = async (request: FastifyRequest<{ Params: { clientId: string } }>, reply: FastifyReply) => {
    const { clientId } = request.params;

    console.log(`Getting order count for clientId: ${clientId}`);

    try {
        // Contagem de pedidos por status individualmente
        const counts = await Promise.all([
            prisma.order.count({
                where: {
                    clientId,
                    status: 'Aguardando confirmação'
                }
            }),
            prisma.order.count({
                where: {
                    clientId,
                    status: 'em preparo'
                }
            }),
            prisma.order.count({
                where: {
                    clientId,
                    status: 'pronto para retirada'
                }
            }),
            prisma.order.count({
                where: {
                    clientId,
                    status: 'saiu para entrega'
                }
            }),
            prisma.order.count({
                where: {
                    clientId,
                    status: 'cancelado'
                }
            }),
        ]);

        const [awaitingConfirmation, inPreparation, readyForPickup, outForDelivery, canceled] = counts;

        const totalOrders = awaitingConfirmation + inPreparation + readyForPickup + outForDelivery + canceled;

        const result = {
            'Aguardando confirmação': awaitingConfirmation,
            'em preparo': inPreparation,
            'pronto para retirada': readyForPickup,
            'saiu para entrega': outForDelivery,
            'cancelado': canceled,
            'total': totalOrders
        };

        console.log(`Order counts for clientId ${clientId}:`, result);

        reply.code(200).send(result);
    } catch (error) {
        console.error('Error counting orders:', error);
        reply.code(500).send({ error: 'Internal Server Error' });
    }
};

export const listOrdersByUser = async (request: FastifyRequest<{ Params: { clientId: string } }>, reply: FastifyReply) => {
    const { clientId } = request.params;

    if (!clientId) {
        return reply.code(400).send({ error: 'Client ID is required' });
    }

    try {
        const orders = await prisma.order.findMany({
            where: { clientId },
            include: {
                products: {
                    include: {
                        product: true,
                    },
                },
                fruits: {
                    include: {
                        fruit: true,
                    },
                },
                toppings: {
                    include: {
                        topping: true,
                    },
                },
                size: true,
                cream: true,
                coupon: true,
            },
        });

        broadcastOrder(orders);  // Verifique o uso desta função

        // Sanitizar pedidos para lidar com valores nulos
        const sanitizedOrders = orders.map(order => ({
            ...order,
            fruits: order.fruits ?? [],  // Garante que fruits seja sempre um array
            toppings: order.toppings ?? [],  // Garante que toppings seja sempre um array
        }));

        reply.send(sanitizedOrders);
    } catch (error) {
        console.error('Error listing orders by user:', error);
        reply.code(500).send({ error: 'Internal Server Error' });
    }
};

export const listAllOrders = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        const orders = await prisma.order.findMany({
            include: {
                products: {
                    include: {
                        product: true,
                    },
                },
                fruits: {
                    include: {
                        fruit: true,
                    },
                },
                toppings: {
                    include: {
                        topping: true,
                    },
                },
                size: true,
                cream: true,
                coupon: true,
            }
        });

        broadcastOrder(orders);  // Verifique o uso desta função

        // Sanitizar pedidos para lidar com valores nulos (opcional para listAllOrders)
        const sanitizedOrders = orders.map(order => ({
            ...order,
            fruits: order.fruits ?? [],  // Garante que fruits seja sempre um array
            toppings: order.toppings ?? [],  // Garante que toppings seja sempre um array
        }));

        reply.send(sanitizedOrders);
    } catch (error) {
        console.error('Error listing all orders:', error);
        reply.code(500).send({ error: 'Internal Server Error' });
    }
};

// Função para obter a taxa de entrega
export const getDeliveryFee = async (request: FastifyRequest<{ Body: { cep: string } }>, reply: FastifyReply) => {
    const { cep } = request.body;

    if (!cep) {
        return reply.code(400).send({ error: 'CEP é necessário' });
    }

    try {
        const fee = await calculateDeliveryFeeFromCep(cep);
        reply.code(200).send({ fee });
    } catch (error: any) {
        console.error('Erro ao calcular taxa de entrega:', error);
        reply.code(500).send({ error: 'Erro interno do servidor' });
    }
};

export const updateOrderStatus = async (request: FastifyRequest<{ Params: { orderId: string }, Body: { status: string } }>, reply: FastifyReply) => {
    const { orderId } = request.params;
    const { status } = request.body;

    if (!orderId || !status) {
        return reply.code(400).send({ error: 'Order ID and status are required' });
    }

    try {
        await prisma.order.update({
            where: { id: orderId },
            data: { status },
        });
        broadcastOrder(orderId);


        reply.send({ message: 'Status do pedido atualizado' });
    } catch (error) {
        console.error('Erro ao atualizar status do pedido:', error);
        reply.code(500).send({ error: 'Internal Server Error' });
    }
};

export const acceptOrder = async (request: FastifyRequest<{ Params: { orderId: string } }>, reply: FastifyReply) => {
    const { orderId } = request.params;

    if (!orderId) {
        return reply.code(400).send({ error: 'Order ID é obrigatorio' });
    }

    try {
        // Atualiza o status para 'em preparo'
        await prisma.order.update({
            where: { id: orderId },
            data: { status: 'em preparo' },
        });

        reply.send({ message: 'Pedido em preparo' });
    } catch (error) {
        console.error('Erro ao aceitar pedido:', error);
        reply.code(500).send({ error: 'Internal Server Error' });
    }

};

export const cancelOrder = async (request: FastifyRequest<{ Params: { orderId: string } }>, reply: FastifyReply) => {
    const { orderId } = request.params;

    if (!orderId) {
        return reply.code(400).send({ error: 'Order ID é obrigatorio' });
    }

    try {
        // Atualiza o status para 'cancelado'
        await prisma.order.update({
            where: { id: orderId },
            data: { status: 'cancelado' },
        });


        reply.send({ message: 'Pedido cancelado' });
    } catch (error) {
        console.error('Error ao cancelar pedido:', error);
        reply.code(500).send({ error: 'Internal Server Error' });
    }
};

export const finalizeOrder = async (request: FastifyRequest<{ Params: { orderId: string } }>, reply: FastifyReply) => {
    const { orderId } = request.params;

    if (!orderId) {
        return reply.code(400).send({ error: 'Order ID é obrigatorio' });
    }

    try {
        const order = await prisma.order.findUnique({ where: { id: orderId } });

        if (!order) {
            return reply.code(404).send({ error: 'Order not found' });
        }

        const newStatus = order.deliveryMethod === 'pickup' ? 'pronto para retirada' : 'saiu para entrega';

        // Atualiza o status para 'pronto para retirada' ou 'saiu para entrega'
        await prisma.order.update({
            where: { id: orderId },
            data: { status: newStatus },
        });

        reply.send({ message: `Pedido ${newStatus === 'pronto para retirada' ? 'pronto para retirada' : 'saiu para entrega'}` });
    } catch (error) {
        console.error('Error ao finalizr pedido:', error);
        reply.code(500).send({ error: 'Internal Server Error' });
    }
};

export const deleteOrder = async (request: FastifyRequest<{ Params: { orderId: string } }>, reply: FastifyReply) => {
    const { orderId } = request.params;

    if (!orderId) {
        return reply.code(400).send({ error: 'Order ID é obrigatorio' });
    }

    try {
        await prisma.order.delete({
            where: { id: orderId },
        });

        reply.send({ message: 'Order deleted' });
    } catch (error) {
        console.error('Error deleting order:', error);
        reply.code(500).send({ error: 'Internal Server Error' });
    }
};