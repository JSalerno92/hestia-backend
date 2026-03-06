import bcrypt from 'bcrypt';

export async function seedBackofficeUser(pool, config) {

  if (!config.adminEmail || !config.adminPassword) {
    throw new Error(
      'ADMIN_EMAIL y ADMIN_PASSWORD deben estar definidos en el .env'
    );
  }

  const passwordHash = await bcrypt.hash(config.adminPassword, 10);

  await pool.query(
    `
    INSERT INTO admin_users (email, password_hash)
    VALUES ($1, $2)
    ON CONFLICT (email) DO NOTHING
    `,
    [config.adminEmail, passwordHash]
  );

}