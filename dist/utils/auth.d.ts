import { User, AuthResponse } from '../types';
export declare function hashPassword(password: string): Promise<string>;
export declare function comparePassword(password: string, hash: string): Promise<boolean>;
export declare function generateToken(user: User): string;
export declare function verifyToken(token: string): any;
export declare function createAuthResponse(success: boolean, user?: User, message?: string): AuthResponse;
export declare function validateEmail(email: string): boolean;
export declare function validatePassword(password: string): {
    valid: boolean;
    message?: string;
};
export declare function sanitizeUser(user: User): User;
//# sourceMappingURL=auth.d.ts.map