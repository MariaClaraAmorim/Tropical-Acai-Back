import { FastifyReply, FastifyRequest } from 'fastify';
import bcrypt from 'bcrypt';
import { createUser, findUserByEmail } from '../models/user';
import { ObjectId } from 'bson';
import jwt from 'jsonwebtoken';
import { Role } from '../types';

const JWT_SECRET = process.env.JWT_SECRET!;

export const login = async (request: FastifyRequest, reply: FastifyReply) => {
    const { email, password } = request.body as { email: string; password: string };
    console.log('Login attempt:', { email, password });

    try {
        const user = await findUserByEmail(email);
        console.log('User found:', user);

        if (!user || !(await bcrypt.compare(password, user.password))) {
            console.log('Invalid email or password');
            return reply.code(401).send({ message: 'Invalid email or password' });
        }

        const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
        console.log('Token generated:', token);

        reply.send({
            token,
            clientId: user.id,
            userType: user.role,
        });
    } catch (error) {
        console.error('Error in login:', error);
        reply.code(500).send(error);
    }
};

export const register = async (request: FastifyRequest, reply: FastifyReply) => {
    // Definindo um valor padrão para o role caso não seja fornecido
    const { email, password, name, role = Role.USER } = request.body as { email: string; password: string; name: string; role: Role };

    console.log('Register attempt:', { email, password, name, role });

    try {
        const existingUser = await findUserByEmail(email);
        if (existingUser) {
            console.log('Email already exists:', email);
            return reply.code(400).send({ error: "Email already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const clientId = new ObjectId().toHexString();

        const user = await createUser(email, hashedPassword, name, role, clientId);
        console.log('User created:', user);

        reply.code(201).send(user);
    } catch (error: any) {
        console.error('Error in register:', error.message, error.stack);
        reply.code(500).send({ error: error.message });
    }
};