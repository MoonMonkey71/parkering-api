"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authLogin = authLogin;
const functions_1 = require("@azure/functions");
const database_1 = require("../config/database");
const auth_1 = require("../utils/auth");
async function authLogin(request, context) {
    context.log('Login function processed a request.');
    try {
        const body = await request.json();
        const { email, password } = body;
        // Validate input
        if (!email || !password) {
            return {
                status: 400,
                body: JSON.stringify((0, auth_1.createAuthResponse)(false, undefined, 'E-post og passord er påkrevd'))
            };
        }
        if (!(0, auth_1.validateEmail)(email)) {
            return {
                status: 400,
                body: JSON.stringify((0, auth_1.createAuthResponse)(false, undefined, 'Ugyldig e-postadresse'))
            };
        }
        const pool = await (0, database_1.getConnection)();
        // Find user
        const result = await pool.request()
            .input('email', database_1.sql.NVarChar, email)
            .query(`
                SELECT id, name, email, password_hash, created_at 
                FROM users 
                WHERE email = @email
            `);
        if (result.recordset.length === 0) {
            return {
                status: 401,
                body: JSON.stringify((0, auth_1.createAuthResponse)(false, undefined, 'Ugyldig e-post eller passord'))
            };
        }
        const userData = result.recordset[0];
        const passwordMatch = await (0, auth_1.comparePassword)(password, userData.password_hash);
        if (!passwordMatch) {
            return {
                status: 401,
                body: JSON.stringify((0, auth_1.createAuthResponse)(false, undefined, 'Ugyldig e-post eller passord'))
            };
        }
        const user = {
            id: userData.id,
            name: userData.name,
            email: userData.email,
            created_at: userData.created_at
        };
        return {
            status: 200,
            body: JSON.stringify((0, auth_1.createAuthResponse)(true, user, 'Innlogging vellykket'))
        };
    }
    catch (error) {
        context.log('Error in login function:', error);
        return {
            status: 500,
            body: JSON.stringify((0, auth_1.createAuthResponse)(false, undefined, 'Intern serverfeil'))
        };
    }
}
functions_1.app.http('authLogin', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: authLogin
});
//# sourceMappingURL=auth-login.js.map