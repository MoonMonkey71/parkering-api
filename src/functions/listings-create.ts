import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { getConnection, sql } from '../config/database';
import { Listing } from '../types';
import { verifyToken } from '../utils/auth';

export async function listingsCreate(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
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
        const decoded = verifyToken(token);
        if (!decoded) {
            return {
                status: 401,
                body: JSON.stringify({
                    success: false,
                    error: 'Ugyldig token'
                })
            };
        }

        const body = await request.json() as Partial<Listing>;
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

        const pool = await getConnection();

        // Create listing
        const result = await pool.request()
            .input('host_id', sql.UniqueIdentifier, decoded.id)
            .input('title', sql.NVarChar, title)
            .input('location', sql.NVarChar, location)
            .input('price', sql.Decimal(10, 2), price)
            .input('features', sql.NVarChar, features ? JSON.stringify(features) : '[]')
            .input('image_url', sql.NVarChar, image_url || '')
            .query(`
                INSERT INTO listings (host_id, title, location, price, features, image_url, is_active, created_at)
                OUTPUT INSERTED.id, INSERTED.host_id, INSERTED.title, INSERTED.location, INSERTED.price, INSERTED.features, INSERTED.image_url, INSERTED.is_active, INSERTED.created_at
                VALUES (@host_id, @title, @location, @price, @features, @image_url, 1, GETUTCDATE())
            `);

        const newListing: Listing = {
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

    } catch (error) {
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

app.http('listingsCreate', {
    methods: ['POST'],
    authLevel: 'function',
    handler: listingsCreate
});