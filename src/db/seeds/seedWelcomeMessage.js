export async function seedWelcomeMessage(pool) {
  const { rowCount } = await pool.query(
    `SELECT 1 FROM welcome_messages WHERE is_default = true LIMIT 1`
  );

  if (rowCount === 0) {
    await pool.query(
      `
      INSERT INTO welcome_messages (
        title,
        message,
        sub_message,
        duration_ms,
        priority,
        is_active,
        is_default
      )
      VALUES ($1, $2, $3, $4, $5, true, true)
      `,
      [
        'welcome-message',
        'Bienvenido/a',
        'Cuidamos tu hogar como si fuera el nuestro',
        3000,
        0
      ]
    );
  }
}
