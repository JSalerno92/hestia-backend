import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT ? Number(process.env.PORT) : 8080,
  databaseUrl: process.env.DATABASE_URL,

  adminEmail: process.env.ADMIN_EMAIL,
  adminPassword: process.env.ADMIN_PASSWORD,

  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d'
};
