import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, AuthResponse } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
}

export function generateToken(user: User): string {
    const payload = {
        id: user.id,
        email: user.email,
        name: user.name
    };
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): any {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
}

export function createAuthResponse(success: boolean, user?: User, message?: string): AuthResponse {
    const response: AuthResponse = { success };
    
    if (success && user) {
        response.token = generateToken(user);
        response.user = {
            id: user.id,
            name: user.name,
            email: user.email,
            created_at: user.created_at
        };
    }
    
    if (message) {
        response.message = message;
    }
    
    return response;
}

export function validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

export function validatePassword(password: string): { valid: boolean; message?: string } {
    if (password.length < 6) {
        return { valid: false, message: 'Passordet må være minst 6 tegn' };
    }
    return { valid: true };
}

export function sanitizeUser(user: User): User {
    const { password, ...sanitized } = user;
    return sanitized as User;
}

