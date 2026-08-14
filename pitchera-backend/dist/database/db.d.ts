import mysql from "mysql2/promise";
declare const pool: mysql.Pool;
export declare function testConnection(): Promise<void>;
export { pool };
export default pool;
//# sourceMappingURL=db.d.ts.map