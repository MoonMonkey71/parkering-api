"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
const auth_1 = require("../utils/auth");
const httpTrigger = async function (context, req) {
    context.log('Get user bookings function processed a request.');
    try {
        // Verify authentication
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            context.res = {
                status: 401,
                body: {
                    success: false,
                    error: 'Autentisering påkrevd'
                }
            };
            return;
        }
        const token = authHeader.substring(7);
        const decoded = (0, auth_1.verifyToken)(token);
        if (!decoded) {
            context.res = {
                status: 401,
                body: {
                    success: false,
                    error: 'Ugyldig token'
                }
            };
            return;
        }
        const pool = await (0, database_1.getConnection)();
        // Get user bookings with listing details
        const result = await pool.request()
            .input('user_id', database_1.sql.UniqueIdentifier, decoded.id)
            .query(`
                SELECT 
                    b.id,
                    b.listing_id,
                    b.user_id,
                    b.start_date,
                    b.end_date,
                    b.total_price,
                    b.status,
                    b.created_at,
                    l.title as listing_title,
                    l.location as listing_location,
                    l.price as listing_price,
                    l.image_url as listing_image_url,
                    u.name as host_name,
                    u.email as host_email
                FROM bookings b
                JOIN listings l ON b.listing_id = l.id
                JOIN users u ON l.host_id = u.id
                WHERE b.user_id = @user_id
                ORDER BY b.created_at DESC
            `);
        const bookings = result.recordset.map(row => ({
            id: row.id,
            listing_id: row.listing_id,
            user_id: row.user_id,
            start_date: row.start_date,
            end_date: row.end_date,
            total_price: parseFloat(row.total_price),
            status: row.status,
            created_at: row.created_at,
            listing: {
                id: row.listing_id,
                host_id: row.user_id,
                title: row.listing_title,
                location: row.listing_location,
                price: parseFloat(row.listing_price),
                features: [],
                image_url: row.listing_image_url,
                is_active: true,
                created_at: row.created_at,
                host: {
                    id: row.user_id,
                    name: row.host_name,
                    email: row.host_email,
                    created_at: row.created_at
                }
            }
        }));
        context.res = {
            status: 200,
            body: {
                success: true,
                data: bookings
            }
        };
    }
    catch (error) {
        context.log.error('Error in get user bookings function:', error);
        context.res = {
            status: 500,
            body: {
                success: false,
                error: 'Intern serverfeil'
            }
        };
    }
};
exports.default = httpTrigger;
//# sourceMappingURL=bookings-get-user.js.map