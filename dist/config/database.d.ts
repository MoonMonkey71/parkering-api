import sql from 'mssql';
export declare function getConnection(): Promise<sql.ConnectionPool>;
export declare function closeConnection(): Promise<void>;
export { sql };
//# sourceMappingURL=database.d.ts.map