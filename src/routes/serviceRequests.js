import express from 'express';

const router = express.Router();

export default function serviceRequestsRoutes(pool) {

  router.post('/', async (req, res) => {
    const { service_id, data } = req.body;

    if (!service_id || !data) {
      return res.status(400).json({ error: 'service_id and data are required' });
    }

    try {
      // 1️⃣ Traer service
      const serviceRes = await pool.query(
        `
        SELECT requires_form, form_id
        FROM services
        WHERE id = $1 AND active = true
        `,
        [service_id]
      );

      if (!serviceRes.rows.length) {
        return res.status(404).json({ error: 'Service not found' });
      }

      const service = serviceRes.rows[0];

      // 2️⃣ Si requiere form → validar
      if (service.requires_form) {

        const fieldsRes = await pool.query(
          `
          SELECT field_key, required, type
          FROM form_fields
          WHERE form_id = $1 AND active = true
          `,
          [service.form_id]
        );

        // validar required
        const missing = fieldsRes.rows
          .filter(f => f.required && data[f.field_key] == null);

        if (missing.length) {
          return res.status(400).json({
            error: 'Missing required fields',
            fields: missing.map(f => f.field_key)
          });
        }

        // validaciones básicas por tipo
        for (const f of fieldsRes.rows) {
          const value = data[f.field_key];
          if (value == null) continue;

          if (f.type === 'number' && isNaN(Number(value))) {
            return res.status(400).json({
              error: `Field ${f.field_key} must be a number`
            });
          }

          if (f.type === 'checkbox' && typeof value !== 'boolean') {
            return res.status(400).json({
              error: `Field ${f.field_key} must be boolean`
            });
          }
        }
      }

      // 3️⃣ Insertar request
      const insertRes = await pool.query(
        `
        INSERT INTO service_requests
          (service_id, form_id, payload)
        VALUES
          ($1, $2, $3)
        RETURNING id;
        `,
        [
          service_id,
          service.form_id,
          data
        ]
      );

      res.status(201).json({
        id: insertRes.rows[0].id,
        status: 'pending'
      });

    } catch (err) {
      console.error('Error creating service request', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
}
