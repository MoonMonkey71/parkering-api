"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sql = void 0;
exports.getConnection = getConnection;
exports.closeConnection = closeConnection;
const mssql_1 = __importDefault(require("mssql"));
exports.sql = mssql_1.default;
const config = {
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
let pool = null;
async function getConnection() {
    if (!pool) {
        pool = new mssql_1.default.ConnectionPool(config);
        await pool.connect();
    }
    return pool;
}
async function closeConnection() {
    if (pool) {
        await pool.close();
        pool = null;
    }
}
//# sourceMappingURL=database.js.map