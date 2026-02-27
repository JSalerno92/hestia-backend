export async function seedForms(pool) {
  await pool.query(`
    INSERT INTO forms (code, name, description)
    VALUES
      ('private_events', 'Eventos privados', 'Formulario para eventos privados'),
      ('moving', 'Mudanza', 'Formulario para servicios de mudanza')
    ON CONFLICT (code) DO NOTHING;
  `);
}
