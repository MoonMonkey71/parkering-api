import sql from 'mssql';

// Global delt connection pool basert på SQL_CONNECTION_STRING.
let pool: sql.ConnectionPool | null = null;
let poolConnecting: Promise<sql.ConnectionPool> | null = null;

export async function getConnection(): Promise<sql.ConnectionPool> {
    if (pool && pool.connected) {
        return pool;
    }

    if (poolConnecting) {
        return poolConnecting;
    }

    const connectionString = process.env.SQL_CONNECTION_STRING;
    if (!connectionString) {
        throw new Error('Missing SQL_CONNECTION_STRING application setting');
    }

    pool = new sql.ConnectionPool(connectionString);
    poolConnecting = pool.connect()
        .then((connectedPool) => {
            poolConnecting = null;
            return connectedPool;
        })
        .catch((error) => {
            poolConnecting = null;
            pool = null;
            throw error;
        });

    return poolConnecting;
}

// Behold funksjonen for fremtidig bruk, men ikke kall denne pr request.
export async function closeConnection(): Promise<void> {
    if (pool) {
        await pool.close();
        pool = null;
    }
}

export { sql };
