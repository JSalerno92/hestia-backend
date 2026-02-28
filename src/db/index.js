import pkg from 'pg';

const { Pool } = pkg;

const isProduction = process.env.NODE_ENV === 'production';

// Detecta si existe DATABASE_URL
const hasConnectionString = !!process.env.DATABASE_URL;

const pool = new Pool(
  hasConnectionString
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: isProduction
          ? { rejectUnauthorized: false }
          : false
      }
    : {
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT,
        ssl: false
      }
);

export default pool;