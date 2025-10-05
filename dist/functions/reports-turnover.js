"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
const auth_1 = require("../utils/auth");
const httpTrigger = async function (context, req) {
    context.log('Get turnover report function processed a request.');
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
        // Get user's listings and their bookings
        const result = await pool.request()
            .input('user_id', database_1.sql.UniqueIdentifier, decoded.id)
            .query(`
                SELECT 
                    l.id as listing_id,
                    l.title as listing_title,
                    l.location as listing_location,
                    l.price as listing_price,
                    COUNT(b.id) as booking_count,
                    SUM(CASE WHEN b.status = 'confirmed' THEN b.total_price ELSE 0 END) as confirmed_revenue,
                    SUM(CASE WHEN b.status = 'pending' THEN b.total_price ELSE 0 END) as pending_revenue,
                    SUM(CASE WHEN b.status = 'completed' THEN b.total_price ELSE 0 END) as completed_revenue
                FROM listings l
                LEFT JOIN bookings b ON l.id = b.listing_id
                WHERE l.host_id = @user_id
                GROUP BY l.id, l.title, l.location, l.price
                ORDER BY confirmed_revenue DESC
            `);
        // Get total statistics
        const statsResult = await pool.request()
            .input('user_id', database_1.sql.UniqueIdentifier, decoded.id)
            .query(`
                SELECT 
                    COUNT(DISTINCT l.id) as total_listings,
                    COUNT(b.id) as total_bookings,
                    SUM(CASE WHEN b.status = 'confirmed' THEN b.total_price ELSE 0 END) as total_confirmed_revenue,
                    SUM(CASE WHEN b.status = 'pending' THEN b.total_price ELSE 0 END) as total_pending_revenue,
                    SUM(CASE WHEN b.status = 'completed' THEN b.total_price ELSE 0 END) as total_completed_revenue
                FROM listings l
                LEFT JOIN bookings b ON l.id = b.listing_id
                WHERE l.host_id = @user_id
            `);
        const stats = statsResult.recordset[0];
        const turnoverData = {
            summary: {
                total_listings: stats.total_listings,
                total_bookings: stats.total_bookings,
                total_confirmed_revenue: parseFloat(stats.total_confirmed_revenue || 0),
                total_pending_revenue: parseFloat(stats.total_pending_revenue || 0),
                total_completed_revenue: parseFloat(stats.total_completed_revenue || 0),
                total_revenue: parseFloat(stats.total_confirmed_revenue || 0) +
                    parseFloat(stats.total_pending_revenue || 0) +
                    parseFloat(stats.total_completed_revenue || 0)
            },
            listings: result.recordset.map(row => ({
                listing_id: row.listing_id,
                title: row.listing_title,
                location: row.listing_location,
                price: parseFloat(row.listing_price),
                booking_count: row.booking_count,
                confirmed_revenue: parseFloat(row.confirmed_revenue || 0),
                pending_revenue: parseFloat(row.pending_revenue || 0),
                completed_revenue: parseFloat(row.completed_revenue || 0),
                total_revenue: parseFloat(row.confirmed_revenue || 0) +
                    parseFloat(row.pending_revenue || 0) +
                    parseFloat(row.completed_revenue || 0)
            }))
        };
        context.res = {
            status: 200,
            body: {
                success: true,
                data: turnoverData
            }
        };
    }
    catch (error) {
        context.log.error('Error in get turnover report function:', error);
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
//# sourceMappingURL=reports-turnover.js.map