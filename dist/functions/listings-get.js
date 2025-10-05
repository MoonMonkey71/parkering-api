"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listingsGet = listingsGet;
const functions_1 = require("@azure/functions");
const database_1 = require("../config/database");
async function listingsGet(request, context) {
    context.log('Get listings function processed a request.');
    try {
        const pool = await (0, database_1.getConnection)();
        // Parse query parameters
        const url = new URL(request.url);
        const searchParams = url.searchParams;
        const filters = {
            location: searchParams.get('location') || undefined,
            minPrice: searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')) : undefined,
            maxPrice: searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')) : undefined,
            features: searchParams.get('features') ? searchParams.get('features').split(',') : undefined,
            isActive: searchParams.get('isActive') !== null ? searchParams.get('isActive') === 'true' : true
        };
        const pagination = {
            page: searchParams.get('page') ? parseInt(searchParams.get('page')) : 1,
            limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')) : 20,
            sortBy: searchParams.get('sortBy') || 'created_at',
            sortOrder: searchParams.get('sortOrder') || 'desc'
        };
        // Build query
        let whereClause = 'WHERE l.is_active = @isActive';
        let orderClause = `ORDER BY l.${pagination.sortBy} ${pagination.sortOrder?.toUpperCase()}`;
        const request_query = pool.request()
            .input('isActive', database_1.sql.Bit, filters.isActive);
        if (filters.location) {
            whereClause += ' AND l.location LIKE @location';
            request_query.input('location', database_1.sql.NVarChar, `%${filters.location}%`);
        }
        if (filters.minPrice !== undefined) {
            whereClause += ' AND l.price >= @minPrice';
            request_query.input('minPrice', database_1.sql.Decimal(10, 2), filters.minPrice);
        }
        if (filters.maxPrice !== undefined) {
            whereClause += ' AND l.price <= @maxPrice';
            request_query.input('maxPrice', database_1.sql.Decimal(10, 2), filters.maxPrice);
        }
        if (filters.features && filters.features.length > 0) {
            whereClause += ' AND l.features LIKE @features';
            request_query.input('features', database_1.sql.NVarChar, `%${filters.features.join('%')}%`);
        }
        // Add pagination
        const offset = ((pagination.page || 1) - 1) * (pagination.limit || 20);
        const limitClause = `OFFSET ${offset} ROWS FETCH NEXT ${pagination.limit || 20} ROWS ONLY`;
        const query = `
            SELECT 
                l.id,
                l.host_id,
                l.title,
                l.location,
                l.price,
                l.features,
                l.image_url,
                l.is_active,
                l.created_at,
                u.name as host_name,
                u.email as host_email
            FROM listings l
            JOIN users u ON l.host_id = u.id
            ${whereClause}
            ${orderClause}
            ${limitClause}
        `;
        const result = await request_query.query(query);
        const listings = result.recordset.map(row => ({
            id: row.id,
            host_id: row.host_id,
            title: row.title,
            location: row.location,
            price: parseFloat(row.price),
            features: row.features ? JSON.parse(row.features) : [],
            image_url: row.image_url,
            is_active: row.is_active,
            created_at: row.created_at,
            host: {
                id: row.host_id,
                name: row.host_name,
                email: row.host_email,
                created_at: row.created_at
            }
        }));
        // Get total count for pagination
        const countQuery = `
            SELECT COUNT(*) as total
            FROM listings l
            JOIN users u ON l.host_id = u.id
            ${whereClause}
        `;
        const countResult = await pool.request()
            .input('isActive', database_1.sql.Bit, filters.isActive)
            .input('location', database_1.sql.NVarChar, filters.location ? `%${filters.location}%` : null)
            .input('minPrice', database_1.sql.Decimal(10, 2), filters.minPrice)
            .input('maxPrice', database_1.sql.Decimal(10, 2), filters.maxPrice)
            .input('features', database_1.sql.NVarChar, filters.features ? `%${filters.features.join('%')}%` : null)
            .query(countQuery);
        const total = countResult.recordset[0].total;
        const totalPages = Math.ceil(total / (pagination.limit || 20));
        return {
            status: 200,
            body: JSON.stringify({
                success: true,
                data: {
                    listings,
                    pagination: {
                        page: pagination.page || 1,
                        limit: pagination.limit || 20,
                        total,
                        totalPages,
                        hasNext: (pagination.page || 1) < totalPages,
                        hasPrev: (pagination.page || 1) > 1
                    }
                }
            })
        };
    }
    catch (error) {
        context.log('Error in get listings function:', error);
        return {
            status: 500,
            body: JSON.stringify({
                success: false,
                error: 'Intern serverfeil'
            })
        };
    }
}
functions_1.app.http('listingsGet', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: listingsGet
});
//# sourceMappingURL=listings-get.js.map