import bcrypt from 'bcrypt';

export async function seedBackofficeUser(pool, config) {
  if (!config.adminEmail || !config.adminPassword) {
    throw new Error(
      'ADMIN_EMAIL y ADMIN_PASSWORD deben estar definidos en el .env'
    );
  }

  const { rowCount } = await pool.query(
    `SELECT 1 FROM backoffice_users WHERE email = $1`,
    [config.adminEmail]
  );

  if (rowCount === 0) {
    const passwordHash = await bcrypt.hash(config.adminPassword, 10);

    await pool.query(
      `
      INSERT INTO backoffice_users (email, password_hash, role)
      VALUES ($1, $2, 'admin')
      `,
      [config.adminEmail, passwordHash]
    );
  }
}
