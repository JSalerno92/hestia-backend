export async function seedFormFields(pool) {

  /* ===============================
     EVENTOS PRIVADOS
  =============================== */

  await pool.query(`
    INSERT INTO form_fields
      (form_id, field_key, label, type, required, display_order, options)
    VALUES
      (
        (SELECT id FROM forms WHERE code = 'private_events'),
        'event_type',
        'Tipo de evento',
        'select',
        true,
        1,
        '["Cumpleaños","Casamiento","Corporativo","Otro"]'::jsonb
      ),
      (
        (SELECT id FROM forms WHERE code = 'private_events'),
        'guest_count',
        'Cantidad de invitados',
        'number',
        true,
        2,
        null
      ),
      (
        (SELECT id FROM forms WHERE code = 'private_events'),
        'event_date',
        'Fecha del evento',
        'date',
        true,
        3,
        null
      ),
      (
        (SELECT id FROM forms WHERE code = 'private_events'),
        'notes',
        'Observaciones',
        'textarea',
        false,
        4,
        null
      )
    ON CONFLICT (form_id, field_key) DO NOTHING;
  `);


  /* ===============================
     MUDANZA
  =============================== */

  await pool.query(`
    INSERT INTO form_fields
      (form_id, field_key, label, type, required, display_order, options)
    VALUES
      (
        (SELECT id FROM forms WHERE code = 'moving'),
        'property_type',
        'Tipo de vivienda',
        'select',
        true,
        1,
        '["Casa","Departamento","PH"]'::jsonb
      ),
      (
        (SELECT id FROM forms WHERE code = 'moving'),
        'rooms',
        'Cantidad de ambientes',
        'number',
        true,
        2,
        null
      ),
      (
        (SELECT id FROM forms WHERE code = 'moving'),
        'has_elevator',
        '¿Tiene ascensor?',
        'checkbox',
        false,
        3,
        null
      ),
      (
        (SELECT id FROM forms WHERE code = 'moving'),
        'notes',
        'Observaciones',
        'textarea',
        false,
        4,
        null
      )
    ON CONFLICT (form_id, field_key) DO NOTHING;
  `);
}