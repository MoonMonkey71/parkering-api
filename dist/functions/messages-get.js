"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
const auth_1 = require("../utils/auth");
const httpTrigger = async function (context, req) {
    context.log('Get booking messages function processed a request.');
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
        const booking_id = req.params.booking_id;
        if (!booking_id) {
            context.res = {
                status: 400,
                body: {
                    success: false,
                    error: 'Booking ID er påkrevd'
                }
            };
            return;
        }
        const pool = await (0, database_1.getConnection)();
        // Verify booking exists and user has access
        const bookingResult = await pool.request()
            .input('booking_id', database_1.sql.UniqueIdentifier, booking_id)
            .input('user_id', database_1.sql.UniqueIdentifier, decoded.id)
            .query(`
                SELECT b.id, b.user_id, b.listing_id, l.host_id
                FROM bookings b
                JOIN listings l ON b.listing_id = l.id
                WHERE b.id = @booking_id 
                AND (b.user_id = @user_id OR l.host_id = @user_id)
            `);
        if (bookingResult.recordset.length === 0) {
            context.res = {
                status: 404,
                body: {
                    success: false,
                    error: 'Booking ikke funnet eller ingen tilgang'
                }
            };
            return;
        }
        // Get messages for booking
        const result = await pool.request()
            .input('booking_id', database_1.sql.UniqueIdentifier, booking_id)
            .query(`
                SELECT 
                    m.id,
                    m.booking_id,
                    m.sender_id,
                    m.message,
                    m.created_at,
                    u.name as sender_name,
                    u.email as sender_email
                FROM messages m
                JOIN users u ON m.sender_id = u.id
                WHERE m.booking_id = @booking_id
                ORDER BY m.created_at ASC
            `);
        const messages = result.recordset.map(row => ({
            id: row.id,
            booking_id: row.booking_id,
            sender_id: row.sender_id,
            message: row.message,
            created_at: row.created_at,
            sender: {
                id: row.sender_id,
                name: row.sender_name,
                email: row.sender_email,
                created_at: row.created_at
            }
        }));
        context.res = {
            status: 200,
            body: {
                success: true,
                data: messages
            }
        };
    }
    catch (error) {
        context.log.error('Error in get booking messages function:', error);
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
//# sourceMappingURL=messages-get.js.map