import bcrypt from 'bcrypt';

export async function seedBackofficeUsers(pool) {

  const users = [
    {
      email: 'aldu@hestia',
      password: 'ChangeMe123!',
      role: 'admin'
    },
    {
      email: 'cata@hestia',
      password: 'ChangeMe123!',
      role: 'admin'
    }
  ];

  for (const user of users) {

    const passwordHash = await bcrypt.hash(user.password, 10);

    await pool.query(
      `
      INSERT INTO backoffice_users (email, password_hash, role)
      VALUES ($1, $2, $3)
      ON CONFLICT (email) DO NOTHING
      `,
      [
        user.email,
        passwordHash,
        user.role
      ]
    );

  }

}