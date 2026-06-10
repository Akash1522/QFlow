import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a connection pool
// Aiven (production) requires SSL; local dev does not
const sslConfig = process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false;

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'akash@07',
  database: process.env.DB_NAME || undefined,
  ssl: sslConfig,
  multipleStatements: true,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export const initDB = async () => {
    try {
        // Pool is already connected to the correct database via config
        // Just apply the schema to create tables if they don't exist
        const schemaPath = path.join(__dirname, '..', 'qflow_schema.sql');
        if (fs.existsSync(schemaPath)) {
            const schemaSql = fs.readFileSync(schemaPath, 'utf8');
            await pool.query(schemaSql);
            console.log('Schema applied successfully.');
        } else {
            console.warn('qflow_schema.sql not found at', schemaPath);
        }

        return true;
    } catch (error) {
        console.error('Database initialization failed:', error.message);
        throw error;
    }
};

export default pool;
