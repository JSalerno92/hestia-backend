export async function seedServices(pool) {
  const services = [
    {
      code: 'cleaning_standard',
      name: 'Standard',
      description: '1 persona | 4hs | hasta 150mts',
      info: `Limpieza general de casas o departamentos de hasta 150 mts2. 
              No incluye: 
              	Limpieza de horno, alacenas de cocina, vidrios.
              	Colgado, doblado/planchado de ropa.
              	Exteriores.
              VALOR: 60.000 
              AL ELEGIR EL DIA SE ABREN LOS HORARIOS DISPONIBLES - AL HACER CLICK  SALTA EL POP UP CON LOS DATOS A COMPLETAR Y HACER CLICK EN LA PALABRA “RESERVA” PARA CONCRETARLA
              `,
      ui_color: '#8dc0af',
      duration_minutes: 240,
      scheduling_type: 'fixed_block',
      display_order: 1,
      requires_form: false,
      service_group: 'clean',
    },
    {
      code: 'cleaning_plus',
      name: 'Plus',
      description: '1 persona | 5hs | hasta 200mts',
      info: `Limpieza general de casas de hasta 200 mts2. 
              Mayor cobertura y profundidad de limpieza.
              No incluye:
              	Limpieza de horno, alacenas de cocina, vidrios.
              	Colgado, doblado/planchado de ropa.
              	Exteriores.
              VALOR: 75.000
              AL ELEGIR EL DIA SE ABREN LOS HORARIOS DISPONIBLES - AL HACER CLICK  SALTA EL POP UP CON LOS DATOS A COMPLETAR Y HACER CLICK EN LA PALABRA “RESERVA” PARA CONCRETARLA
              `,
      ui_color: '#6f9a86',
      duration_minutes: 300,
      scheduling_type: 'fixed_block',
      display_order: 2,
      requires_form: false,
      service_group: 'clean',
    },
    {
      code: 'cleaning_premium',
      name: 'Premium',
      description: '2 persona | 6hs | casas grandes/ limpieza profunda',
      info: `Ideal para casas grandes o limpiezas profundas.
              Incluye limpieza de:
              	Baños y cocina en profundidad.
              	Ventanas y vidrios.
              	Exteriores.
              VALOR: 120.000
              AL ELEGIR EL DIA SE ABREN LOS HORARIOS DISPONIBLES - AL HACER CLICK  SALTA EL POP UP CON LOS DATOS A COMPLETAR Y HACER CLICK EN LA PALABRA “RESERVA” PARA CONCRETARLA
              `,
      ui_color: '#628580',
      duration_minutes: 360,
      scheduling_type: 'fixed_block',
      display_order: 3,
      requires_form: false,
      service_group: 'clean',
    },
    {
      code: 'private_events',
      name: 'Eventos privados',
      description: 'Asistencia y limpieza para eventos privados',
      info: `Servicio de apoyo para eventos sociales y familiares.
              Incluye:
              	Orden y limpieza de ambientes 
              	Cocina y áreas de servicio
              	Baños durante y después del evento
              	Recolección de residuos y orden general
              `,
      ui_color: '#628580',
      scheduling_type: 'manual_request',
      display_order: 4,
      requires_form: true,
      form_code: 'private_events',
      service_group: 'help',
      form_id: 1,
    },
    {
      code: 'moving_help',
      name: 'Mudanza',
      description: 'Limpieza y apoyo en procesos de mudanza',
      info: `Personal de apoyo para mudanzas domiciliarias.
              Incluye:
              	Ayuda en embalaje de objetos livianos.
              	Organización de cajas y pertenencias.
              	Orden básico de ambientes.
              	Limpieza inicial o posterior a la mudanza.
              El personal NO realiza tareas de flete ni manipulación de cargas pesadas.
              `,
      ui_color: '#8dc0af',
      scheduling_type: 'manual_request',
      display_order: 5,
      requires_form: true,
      form_code: 'moving',
      service_group: 'help',
      form_id: 2,
    }
  ];

    for (const s of services) {
        let formId = null;

        if (s.requires_form) {
        const res = await pool.query(
            'SELECT id FROM forms WHERE code = $1',
            [s.form_code]
        );
        formId = res.rows[0]?.id ?? null;
        }

        await pool.query(
          `
          INSERT INTO services
            (code, name, description, info, ui_color, display_order, requires_form, form_id, service_group, duration_minutes, scheduling_type)
          VALUES
            ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          ON CONFLICT (code) DO UPDATE SET
            name = EXCLUDED.name,
            description = EXCLUDED.description,
            info = EXCLUDED.info,
            ui_color = EXCLUDED.ui_color,
            display_order = EXCLUDED.display_order,
            requires_form = EXCLUDED.requires_form,
            form_id = EXCLUDED.form_id,
            service_group = EXCLUDED.service_group,
            duration_minutes = EXCLUDED.duration_minutes,
            scheduling_type = EXCLUDED.scheduling_type;
          `,
          [
            s.code,
            s.name,
            s.description,
            s.info,
            s.ui_color,
            s.display_order,
            s.requires_form,
            formId,
            s.service_group,
            s.duration_minutes,
            s.scheduling_type
          ]
        );
    }
}