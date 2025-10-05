"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listingsCreate = listingsCreate;
const functions_1 = require("@azure/functions");
const database_1 = require("../config/database");
const auth_1 = require("../utils/auth");
async function listingsCreate(request, context) {
    context.log('Create listing function processed a request.');
    try {
        // Verify authentication
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return {
                status: 401,
                body: JSON.stringify({
                    success: false,
                    error: 'Autentisering påkrevd'
                })
            };
        }
        const token = authHeader.substring(7);
        const decoded = (0, auth_1.verifyToken)(token);
        if (!decoded) {
            return {
                status: 401,
                body: JSON.stringify({
                    success: false,
                    error: 'Ugyldig token'
                })
            };
        }
        const body = await request.json();
        const { title, location, price, features, image_url } = body;
        // Validate input
        if (!title || !location || !price) {
            return {
                status: 400,
                body: JSON.stringify({
                    success: false,
                    error: 'Tittel, lokasjon og pris er påkrevd'
                })
            };
        }
        if (price <= 0) {
            return {
                status: 400,
                body: JSON.stringify({
                    success: false,
                    error: 'Pris må være større enn 0'
                })
            };
        }
        const pool = await (0, database_1.getConnection)();
        // Create listing
        const result = await pool.request()
            .input('host_id', database_1.sql.UniqueIdentifier, decoded.id)
            .input('title', database_1.sql.NVarChar, title)
            .input('location', database_1.sql.NVarChar, location)
            .input('price', database_1.sql.Decimal(10, 2), price)
            .input('features', database_1.sql.NVarChar, features ? JSON.stringify(features) : '[]')
            .input('image_url', database_1.sql.NVarChar, image_url || '')
            .query(`
                INSERT INTO listings (host_id, title, location, price, features, image_url, is_active, created_at)
                OUTPUT INSERTED.id, INSERTED.host_id, INSERTED.title, INSERTED.location, INSERTED.price, INSERTED.features, INSERTED.image_url, INSERTED.is_active, INSERTED.created_at
                VALUES (@host_id, @title, @location, @price, @features, @image_url, 1, GETUTCDATE())
            `);
        const newListing = {
            id: result.recordset[0].id,
            host_id: result.recordset[0].host_id,
            title: result.recordset[0].title,
            location: result.recordset[0].location,
            price: parseFloat(result.recordset[0].price),
            features: JSON.parse(result.recordset[0].features),
            image_url: result.recordset[0].image_url,
            is_active: result.recordset[0].is_active,
            created_at: result.recordset[0].created_at
        };
        return {
            status: 201,
            body: JSON.stringify({
                success: true,
                data: newListing,
                message: 'Parkeringsplass opprettet vellykket'
            })
        };
    }
    catch (error) {
        context.log('Error in create listing function:', error);
        return {
            status: 500,
            body: JSON.stringify({
                success: false,
                error: 'Intern serverfeil'
            })
        };
    }
}
functions_1.app.http('listingsCreate', {
    methods: ['POST'],
    authLevel: 'function',
    handler: listingsCreate
});
//# sourceMappingURL=listings-create.js.map