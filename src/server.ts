import Fastify from 'fastify';
import cors from '@fastify/cors';
import { routes } from './routes';
import { broadcastOrder, initializeWebSocket } from './websocket';

const app = Fastify({ logger: true });

app.setErrorHandler((error, request, reply) => {
    reply.code(400).send({ message: error.message });
});

app.register(cors, {
    origin: '*',
});

// Registra suas rotas
app.register(routes, { prefix: '/api' });

const start = async () => {
    try {
        // Inicia o servidor e obtenha o servidor HTTP do Fastify
        const address = await app.listen(3000, '0.0.0.0');
        console.log(`Servidor rodando em http://localhost:3000`);

        // Inicializa o WebSocket com a instância do servidor HTTP do Fastify
        initializeWebSocket(app.server);
    } catch (err) {
        if (err instanceof Error) {
            console.error(err.message);
        } else {
            console.error('Unknown error occurred');
        }
        process.exit(1);
    }
};

start();

export { broadcastOrder };
