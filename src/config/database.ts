import sql from 'mssql';

const config: sql.config = {
    server: process.env.SQL_SERVER || 'parkering-sql-1759689226.database.windows.net',
    database: process.env.SQL_DATABASE || 'parkering_db',
    user: process.env.SQL_USER || 'parkeringadmin',
    password: process.env.SQL_PASSWORD || '3dvS0lk3UmAmEx1NKJXKUM+01m0BpClyTpmmIEMLDXs=',
    options: {
        encrypt: true,
        trustServerCertificate: false,
        enableArithAbort: true,
        requestTimeout: 30000,
        connectTimeout: 30000
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

let pool: sql.ConnectionPool | null = null;

export async function getConnection(): Promise<sql.ConnectionPool> {
    if (!pool) {
        pool = new sql.ConnectionPool(config);
        await pool.connect();
    }
    return pool;
}

export async function closeConnection(): Promise<void> {
    if (pool) {
        await pool.close();
        pool = null;
    }
}

export { sql };
