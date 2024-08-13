import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Defina interfaces para os tipos esperados no request.body
interface CreateFruitBody {
    name: string;
    price: number;
}

interface CreateToppingBody {
    name: string;
    price: number;
}

interface CreateSizeBody {
    name: string;
    volume: number;
    price: number;
}

interface CreateCreamBody {
    name: string;
    price: number;
}

// Função para criar uma fruta
export const createFruit = async (request: FastifyRequest<{ Body: CreateFruitBody }>, reply: FastifyReply) => {
    const { name, price } = request.body;

    try {
        const newFruit = await prisma.fruit.create({
            data: { name, price }
        });
        reply.code(201).send(newFruit);
    } catch (error) {
        console.error('Erro ao criar fruta:', error);
        reply.code(500).send({ error: 'Erro ao criar fruta' });
    }
};

// Função para criar um complemento
export const createTopping = async (request: FastifyRequest<{ Body: CreateToppingBody }>, reply: FastifyReply) => {
    const { name, price } = request.body;

    try {
        const newTopping = await prisma.topping.create({
            data: { name, price }
        });
        reply.code(201).send(newTopping);
    } catch (error) {
        console.error('Erro ao criar complemento:', error);
        reply.code(500).send({ error: 'Erro ao criar complemento' });
    }
};

// Função para criar um tamanho
export const createSize = async (request: FastifyRequest<{ Body: CreateSizeBody }>, reply: FastifyReply) => {
    const { name, volume, price } = request.body;

    try {
        const newSize = await prisma.size.create({
            data: { name, volume, price }
        });
        reply.code(201).send(newSize);
    } catch (error) {
        console.error('Erro ao criar tamanho:', error);
        reply.code(500).send({ error: 'Erro ao criar tamanho' });
    }
};

// Função para criar um creme
export const createCream = async (request: FastifyRequest<{ Body: CreateCreamBody }>, reply: FastifyReply) => {
    const { name, price } = request.body;

    try {
        const newCream = await prisma.cream.create({
            data: { name, price }
        });
        reply.code(201).send(newCream);
    } catch (error) {
        console.error('Erro ao criar creme:', error);
        reply.code(500).send({ error: 'Erro ao criar creme' });
    }
};

// Função para obter todas as frutas
export const getFruits = async (_: FastifyRequest, reply: FastifyReply) => {
    try {
        const fruits = await prisma.fruit.findMany();
        reply.send(fruits);
    } catch (error) {
        console.error('Erro ao obter frutas:', error);
        reply.code(500).send({ error: 'Erro ao obter frutas' });
    }
};

// Função para obter todos os complementos
export const getToppings = async (_: FastifyRequest, reply: FastifyReply) => {
    try {
        const toppings = await prisma.topping.findMany();
        reply.send(toppings);
    } catch (error) {
        console.error('Erro ao obter complementos:', error);
        reply.code(500).send({ error: 'Erro ao obter complementos' });
    }
};

// Função para obter todos os tamanhos
export const getSizes = async (_: FastifyRequest, reply: FastifyReply) => {
    try {
        const sizes = await prisma.size.findMany();
        reply.send(sizes);
    } catch (error) {
        console.error('Erro ao obter tamanhos:', error);
        reply.code(500).send({ error: 'Erro ao obter tamanhos' });
    }
};

// Função para obter todos os cremes
export const getCreams = async (_: FastifyRequest, reply: FastifyReply) => {
    try {
        const creams = await prisma.cream.findMany();
        reply.send(creams);
    } catch (error) {
        console.error('Erro ao obter cremes:', error);
        reply.code(500).send({ error: 'Erro ao obter cremes' });
    }
};
