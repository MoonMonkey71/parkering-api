import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { getConnection, sql } from '../config/database';
import { User, AuthRequest, AuthResponse } from '../types';
import { 
    comparePassword, 
    createAuthResponse, 
    validateEmail,
    sanitizeUser 
} from '../utils/auth';

export async function authLogin(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log('Login function processed a request.');

    try {
        const body = await request.json() as AuthRequest;
        const { email, password } = body;

        // Validate input
        if (!email || !password) {
            return {
                status: 400,
                body: JSON.stringify(createAuthResponse(false, undefined, 'E-post og passord er påkrevd'))
            };
        }

        if (!validateEmail(email)) {
            return {
                status: 400,
                body: JSON.stringify(createAuthResponse(false, undefined, 'Ugyldig e-postadresse'))
            };
        }

        const pool = await getConnection();

        // Find user
        const result = await pool.request()
            .input('email', sql.NVarChar, email)
            .query(`
                SELECT id, name, email, password_hash, created_at 
                FROM users 
                WHERE email = @email
            `);

        if (result.recordset.length === 0) {
            return {
                status: 401,
                body: JSON.stringify(createAuthResponse(false, undefined, 'Ugyldig e-post eller passord'))
            };
        }

        const userData = result.recordset[0];
        const passwordMatch = await comparePassword(password, userData.password_hash);

        if (!passwordMatch) {
            return {
                status: 401,
                body: JSON.stringify(createAuthResponse(false, undefined, 'Ugyldig e-post eller passord'))
            };
        }

        const user: User = {
            id: userData.id,
            name: userData.name,
            email: userData.email,
            created_at: userData.created_at
        };

        return {
            status: 200,
            body: JSON.stringify(createAuthResponse(true, user, 'Innlogging vellykket'))
        };

    } catch (error) {
        context.log('Error in login function:', error);
        return {
            status: 500,
            body: JSON.stringify(createAuthResponse(false, undefined, 'Intern serverfeil'))
        };
    }
}

app.http('authLogin', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: authLogin
});
