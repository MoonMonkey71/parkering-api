import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { getConnection, sql } from '../config/database';
import { User, AuthRequest, AuthResponse } from '../types';
import { 
    hashPassword, 
    comparePassword, 
    createAuthResponse, 
    validateEmail, 
    validatePassword,
    sanitizeUser 
} from '../utils/auth';

export async function authRegister(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log('Register function processed a request.');

    try {
        const body = await request.json() as AuthRequest;
        const { name, email, password } = body;

        // Validate input
        if (!name || !email || !password) {
            return {
                status: 400,
                body: JSON.stringify(createAuthResponse(false, undefined, 'Navn, e-post og passord er påkrevd'))
            };
        }

        if (!validateEmail(email)) {
            return {
                status: 400,
                body: JSON.stringify(createAuthResponse(false, undefined, 'Ugyldig e-postadresse'))
            };
        }

        const passwordValidation = validatePassword(password);
        if (!passwordValidation.valid) {
            return {
                status: 400,
                body: JSON.stringify(createAuthResponse(false, undefined, passwordValidation.message))
            };
        }

        const pool = await getConnection();

        // Check if user already exists
        const existingUserResult = await pool.request()
            .input('email', sql.NVarChar, email)
            .query('SELECT id FROM users WHERE email = @email');

        if (existingUserResult.recordset.length > 0) {
            return {
                status: 409,
                body: JSON.stringify(createAuthResponse(false, undefined, 'Bruker med denne e-postadressen eksisterer allerede'))
            };
        }

        // Hash password
        const hashedPassword = await hashPassword(password);

        // Create user
        const result = await pool.request()
            .input('name', sql.NVarChar, name)
            .input('email', sql.NVarChar, email)
            .input('password', sql.NVarChar, hashedPassword)
            .query(`
                INSERT INTO users (name, email, password_hash, created_at)
                OUTPUT INSERTED.id, INSERTED.name, INSERTED.email, INSERTED.created_at
                VALUES (@name, @email, @password, GETUTCDATE())
            `);

        const newUser: User = {
            id: result.recordset[0].id,
            name: result.recordset[0].name,
            email: result.recordset[0].email,
            created_at: result.recordset[0].created_at
        };

        return {
            status: 201,
            body: JSON.stringify(createAuthResponse(true, newUser, 'Bruker opprettet vellykket'))
        };

    } catch (error) {
        context.log('Error in register function:', error);
        return {
            status: 500,
            body: JSON.stringify(createAuthResponse(false, undefined, 'Intern serverfeil'))
        };
    }
}

app.http('authRegister', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: authRegister
});
