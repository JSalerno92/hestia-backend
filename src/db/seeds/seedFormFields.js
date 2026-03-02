export async function seedFormFields(pool) {

  /* ===============================
     EVENTOS PRIVADOS
  =============================== */

  /* await pool.query(`
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
  `); */
  await pool.query(`
    INSERT INTO form_fields
      (form_id, field_key, label, type, required, display_order, options)
    VALUES
      -- DATOS DE CONTACTO
      (
        (SELECT id FROM forms WHERE code = 'private_events'),
        'full_name',
        'Nombre y Apellido',
        'text',
        true,
        1,
        null
      ),
      (
        (SELECT id FROM forms WHERE code = 'private_events'),
        'phone',
        'Celular',
        'tel',
        true,
        2,
        null
      ),
      (
        (SELECT id FROM forms WHERE code = 'private_events'),
        'email',
        'Email',
        'email',
        true,
        3,
        null
      ),

      -- DATOS DEL EVENTO
      (
        (SELECT id FROM forms WHERE code = 'private_events'),
        'guest_count',
        'Cantidad de invitados',
        'number',
        true,
        4,
        null
      ),
      (
        (SELECT id FROM forms WHERE code = 'private_events'),
        'staff_required',
        'Personal requerido',
        'select',
        true,
        5,
        '["1","2","3"]'::jsonb
      ),
      (
        (SELECT id FROM forms WHERE code = 'private_events'),
        'tasks',
        'Tareas a realizar por el personal',
        'textarea',
        true,
        6,
        null
      ),
      (
        (SELECT id FROM forms WHERE code = 'private_events'),
        'event_date',
        'Día del evento',
        'date',
        true,
        7,
        null
      ),
      (
        (SELECT id FROM forms WHERE code = 'private_events'),
        'event_time',
        'Horario del evento',
        'text',
        true,
        8,
        null
      ),
      (
        (SELECT id FROM forms WHERE code = 'private_events'),
        'event_location',
        'Lugar del evento',
        'text',
        true,
        9,
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
      -- DATOS DE CONTACTO
      (
        (SELECT id FROM forms WHERE code = 'moving'),
        'full_name',
        'Nombre y Apellido',
        'text',
        true,
        1,
        null
      ),
      (
        (SELECT id FROM forms WHERE code = 'moving'),
        'phone',
        'Celular',
        'tel',
        true,
        2,
        null
      ),
      (
        (SELECT id FROM forms WHERE code = 'moving'),
        'email',
        'Email',
        'email',
        true,
        3,
        null
      ),

      -- DATOS DEL SERVICIO
      (
        (SELECT id FROM forms WHERE code = 'moving'),
        'staff_required',
        'Personal requerido',
        'select',
        true,
        4,
        '["1","2","3"]'::jsonb
      ),
      (
        (SELECT id FROM forms WHERE code = 'moving'),
        'hours_required',
        'Cantidad de horas de personal requerido',
        'number',
        true,
        5,
        null
      ),
      (
        (SELECT id FROM forms WHERE code = 'moving'),
        'moving_date',
        'Día de la mudanza',
        'date',
        true,
        6,
        null
      ),
      (
        (SELECT id FROM forms WHERE code = 'moving'),
        'moving_time',
        'Horario de la mudanza',
        'text',
        true,
        7,
        null
      ),
      (
        (SELECT id FROM forms WHERE code = 'moving'),
        'location',
        'Lugar',
        'text',
        true,
        8,
        null
      )
    ON CONFLICT (form_id, field_key) DO NOTHING;
  `);
}