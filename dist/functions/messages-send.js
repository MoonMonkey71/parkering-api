"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
const auth_1 = require("../utils/auth");
const httpTrigger = async function (context, req) {
    context.log('Send message function processed a request.');
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
        const { booking_id, message } = req.body;
        // Validate input
        if (!booking_id || !message) {
            context.res = {
                status: 400,
                body: {
                    success: false,
                    error: 'Booking ID og melding er påkrevd'
                }
            };
            return;
        }
        if (message.trim().length === 0) {
            context.res = {
                status: 400,
                body: {
                    success: false,
                    error: 'Melding kan ikke være tom'
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
        // Create message
        const result = await pool.request()
            .input('booking_id', database_1.sql.UniqueIdentifier, booking_id)
            .input('sender_id', database_1.sql.UniqueIdentifier, decoded.id)
            .input('message', database_1.sql.NVarChar, message.trim())
            .query(`
                INSERT INTO messages (booking_id, sender_id, message, created_at)
                OUTPUT INSERTED.id, INSERTED.booking_id, INSERTED.sender_id, INSERTED.message, INSERTED.created_at
                VALUES (@booking_id, @sender_id, @message, GETUTCDATE())
            `);
        const newMessage = {
            id: result.recordset[0].id,
            booking_id: result.recordset[0].booking_id,
            sender_id: result.recordset[0].sender_id,
            message: result.recordset[0].message,
            created_at: result.recordset[0].created_at
        };
        context.res = {
            status: 201,
            body: {
                success: true,
                data: newMessage,
                message: 'Melding sendt vellykket'
            }
        };
    }
    catch (error) {
        context.log.error('Error in send message function:', error);
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
//# sourceMappingURL=messages-send.js.map