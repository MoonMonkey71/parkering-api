import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { getConnection, sql } from '../config/database';
import { Booking } from '../types';
import { verifyToken } from '../utils/auth';

export async function bookingsCreate(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log('Create booking function processed a request.');

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

        const body = await request.json() as Partial<Booking>;
        const { listing_id, start_date, end_date } = body;

        // Validate input
        if (!listing_id || !start_date || !end_date) {
            return {
                status: 400,
                body: JSON.stringify({
                    success: false,
                    error: 'Listing ID, startdato og sluttdato er påkrevd'
                })
            };
        }

        const startDate = new Date(start_date);
        const endDate = new Date(end_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (startDate < today) {
            return {
                status: 400,
                body: JSON.stringify({
                    success: false,
                    error: 'Startdato kan ikke være i fortiden'
                })
            };
        }

        if (endDate <= startDate) {
            return {
                status: 400,
                body: JSON.stringify({
                    success: false,
                    error: 'Sluttdato må være etter startdato'
                })
            };
        }

        const pool = await getConnection();

        // Get listing details and calculate price
        const listingResult = await pool.request()
            .input('listing_id', sql.UniqueIdentifier, listing_id)
            .query(`
                SELECT price, host_id, title, is_active
                FROM listings 
                WHERE id = @listing_id
            `);

        if (listingResult.recordset.length === 0) {
            return {
                status: 404,
                body: JSON.stringify({
                    success: false,
                    error: 'Parkeringsplass ikke funnet'
                })
            };
        }

        const listing = listingResult.recordset[0];
        
        if (!listing.is_active) {
            return {
                status: 400,
                body: JSON.stringify({
                    success: false,
                    error: 'Parkeringsplass er ikke tilgjengelig'
                })
            };
        }

        if (listing.host_id === decoded.id) {
            return {
                status: 400,
                body: JSON.stringify({
                    success: false,
                    error: 'Du kan ikke booke din egen parkeringsplass'
                })
            };
        }

        // Calculate total price
        const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const totalPrice = parseFloat(listing.price) * days;

        // Create booking
        const result = await pool.request()
            .input('listing_id', sql.UniqueIdentifier, listing_id)
            .input('user_id', sql.UniqueIdentifier, decoded.id)
            .input('start_date', sql.Date, start_date)
            .input('end_date', sql.Date, end_date)
            .input('total_price', sql.Decimal(10, 2), totalPrice)
            .query(`
                INSERT INTO bookings (listing_id, user_id, start_date, end_date, total_price, status, created_at)
                OUTPUT INSERTED.id, INSERTED.listing_id, INSERTED.user_id, INSERTED.start_date, INSERTED.end_date, INSERTED.total_price, INSERTED.status, INSERTED.created_at
                VALUES (@listing_id, @user_id, @start_date, @end_date, @total_price, 'pending', GETUTCDATE())
            `);

        const newBooking: Booking = {
            id: result.recordset[0].id,
            listing_id: result.recordset[0].listing_id,
            user_id: result.recordset[0].user_id,
            start_date: result.recordset[0].start_date,
            end_date: result.recordset[0].end_date,
            total_price: parseFloat(result.recordset[0].total_price),
            status: result.recordset[0].status,
            created_at: result.recordset[0].created_at
        };

        return {
            status: 201,
            body: JSON.stringify({
                success: true,
                data: newBooking,
                message: 'Booking opprettet vellykket'
            })
        };

    } catch (error) {
        context.log('Error in create booking function:', error);
        return {
            status: 500,
            body: JSON.stringify({
                success: false,
                error: 'Intern serverfeil'
            })
        };
    }
}

app.http('bookingsCreate', {
    methods: ['POST'],
    authLevel: 'function',
    handler: bookingsCreate
});