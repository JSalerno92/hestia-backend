import pkg from 'pg';
import { config } from '../config/env.js';

const { Pool } = pkg;

/* const pool = new Pool({
  connectionString: config.databaseUrl
}); */

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

export default pool;
