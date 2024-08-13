import { FastifyRequest } from 'fastify';

declare module 'fastify' {
    interface FastifyRequest {
        user?: {
            userId: string;
            role: string;
        };
    }
}

export enum Role {
    USER = 'USER',
    ADMIN = 'ADMIN',
}
