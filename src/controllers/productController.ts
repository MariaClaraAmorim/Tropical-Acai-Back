import { FastifyReply, FastifyRequest } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Criar um novo produto
export const createProduct = async (request: FastifyRequest, reply: FastifyReply) => {
  const { name, description, ingredients, price, available } = request.body as {
    name: string;
    description: string;
    ingredients: string[];
    price: number;
    available: boolean;
  };

  try {
    const product = await prisma.product.create({
      data: {
        name,
        description,
        ingredients: JSON.stringify(ingredients), // Convertendo array para string JSON
        price,
        available,
      },
    });
    reply.code(201).send(product);
  } catch (error) {
    console.error('Error creating product:', error);
    reply.code(500).send({ error: 'Internal Server Error' });
  }
};

// Listar todos os produtos
export const getProducts = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const products = await prisma.product.findMany();

    // Tenta converter a string JSON de volta para um array
    const parsedProducts = products.map(product => {
      try {
        return {
          ...product,
          ingredients: JSON.parse(product.ingredients),
        };
      } catch (error) {
        console.error(`Error parsing ingredients for product ${product.id}:`, error);
        return {
          ...product,
          ingredients: [], // Fallback para um array vazio em caso de erro
        };
      }
    });

    reply.send(parsedProducts);
  } catch (error) {
    console.error('Error getting products:', error);
    reply.code(500).send({ error: 'Internal Server Error' });
  }
};

// Obter um produto por ID
export const getProductById = async (request: FastifyRequest, reply: FastifyReply) => {
  const { id } = request.params as { id: string };

  try {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      return reply.code(404).send({ message: 'Product not found' });
    }
    // Convertendo string JSON de volta para array
    const parsedProduct = {
      ...product,
      ingredients: JSON.parse(product.ingredients),
    };
    reply.send(parsedProduct);
  } catch (error) {
    console.error('Error getting product by ID:', error);
    reply.code(500).send({ error: 'Internal Server Error' });
  }
};

// Atualizar um produto existente
export const updateProduct = async (request: FastifyRequest, reply: FastifyReply) => {
  const { id } = request.params as { id: string };
  const { name, description, ingredients, price, available } = request.body as {
    name: string;
    description: string;
    ingredients: string[];
    price: number;
    available: boolean;
  };

  try {
    const product = await prisma.product.update({
      where: { id },
      data: {
        name,
        description,
        ingredients: JSON.stringify(ingredients), // Convertendo array para string JSON
        price,
        available,
      },
    });
    reply.send(product);
  } catch (error) {
    console.error('Error updating product:', error);
    reply.code(500).send({ error: 'Internal Server Error' });
  }
};

// Deletar um produto existente
export const deleteProduct = async (request: FastifyRequest, reply: FastifyReply) => {
  const { id } = request.params as { id: string };

  try {
    await prisma.product.delete({ where: { id } });
    reply.send({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    reply.code(500).send({ error: 'Internal Server Error' });
  }
};
