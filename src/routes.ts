import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { login, register } from './controllers/authController';
import { createProduct, deleteProduct, getProductById, getProducts, updateProduct } from './controllers/productController';
import { acceptOrder, cancelOrder, finalizeOrder, getDeliveryFee, getOrderCount, listAllOrders, listOrdersByUser, placeOrder } from './controllers/orderController';
import { applyCoupon, createCoupon } from './controllers/couponController';
import { createCream, createFruit, createSize, createTopping, getCreams, getFruits, getSizes, getToppings } from './controllers/customController';

export async function routes(fastify: FastifyInstance) {
    // Rota de teste simples para verificar se o servidor está online
    fastify.get('/teste', async (request: FastifyRequest, reply: FastifyReply) => {
        return { ok: true };
    });

    // Rotas de autenticação
    fastify.post('/register', register);
    fastify.post('/login', login);

    // Rotas de produtos
    fastify.post('/products', createProduct);
    fastify.get('/products', getProducts);
    fastify.get('/products/:id', getProductById);
    fastify.put('/products/:id', updateProduct);
    fastify.delete('/products/:id', deleteProduct);

    // Rotas de pedidos
    fastify.post('/orders', placeOrder);
    fastify.get('/orders/:clientId', listOrdersByUser);
    fastify.get('/orders/:clientId/count', getOrderCount);
    fastify.post('/orders/delivery-fee', getDeliveryFee);
    fastify.get('/orders', listAllOrders);

    fastify.put('/orders/:orderId/accept', acceptOrder);
    fastify.put('/orders/:orderId/cancel', cancelOrder);
    fastify.put('/orders/:orderId/finalize', finalizeOrder);

    // Rotas de cupom
    fastify.post('/cupom', createCoupon);
    fastify.post('/cupom/apply', applyCoupon);

    // Rotas de frutas
    fastify.post('/fruits', createFruit);
    fastify.get('/fruits', getFruits);

    // Rotas de complementos
    fastify.post('/toppings', createTopping);
    fastify.get('/toppings', getToppings);

    // Rotas de tamanhos
    fastify.post('/sizes', createSize);
    fastify.get('/sizes', getSizes);

    // Rotas de cremes
    fastify.post('/creams', createCream);
    fastify.get('/creams', getCreams);
}