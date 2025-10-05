"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRegister = authRegister;
const functions_1 = require("@azure/functions");
const database_1 = require("../config/database");
const auth_1 = require("../utils/auth");
async function authRegister(request, context) {
    context.log('Register function processed a request.');
    try {
        const body = await request.json();
        const { name, email, password } = body;
        // Validate input
        if (!name || !email || !password) {
            return {
                status: 400,
                body: JSON.stringify((0, auth_1.createAuthResponse)(false, undefined, 'Navn, e-post og passord er påkrevd'))
            };
        }
        if (!(0, auth_1.validateEmail)(email)) {
            return {
                status: 400,
                body: JSON.stringify((0, auth_1.createAuthResponse)(false, undefined, 'Ugyldig e-postadresse'))
            };
        }
        const passwordValidation = (0, auth_1.validatePassword)(password);
        if (!passwordValidation.valid) {
            return {
                status: 400,
                body: JSON.stringify((0, auth_1.createAuthResponse)(false, undefined, passwordValidation.message))
            };
        }
        const pool = await (0, database_1.getConnection)();
        // Check if user already exists
        const existingUserResult = await pool.request()
            .input('email', database_1.sql.NVarChar, email)
            .query('SELECT id FROM users WHERE email = @email');
        if (existingUserResult.recordset.length > 0) {
            return {
                status: 409,
                body: JSON.stringify((0, auth_1.createAuthResponse)(false, undefined, 'Bruker med denne e-postadressen eksisterer allerede'))
            };
        }
        // Hash password
        const hashedPassword = await (0, auth_1.hashPassword)(password);
        // Create user
        const result = await pool.request()
            .input('name', database_1.sql.NVarChar, name)
            .input('email', database_1.sql.NVarChar, email)
            .input('password', database_1.sql.NVarChar, hashedPassword)
            .query(`
                INSERT INTO users (name, email, password_hash, created_at)
                OUTPUT INSERTED.id, INSERTED.name, INSERTED.email, INSERTED.created_at
                VALUES (@name, @email, @password, GETUTCDATE())
            `);
        const newUser = {
            id: result.recordset[0].id,
            name: result.recordset[0].name,
            email: result.recordset[0].email,
            created_at: result.recordset[0].created_at
        };
        return {
            status: 201,
            body: JSON.stringify((0, auth_1.createAuthResponse)(true, newUser, 'Bruker opprettet vellykket'))
        };
    }
    catch (error) {
        context.log('Error in register function:', error);
        return {
            status: 500,
            body: JSON.stringify((0, auth_1.createAuthResponse)(false, undefined, 'Intern serverfeil'))
        };
    }
}
functions_1.app.http('authRegister', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: authRegister
});
//# sourceMappingURL=auth-register.js.map