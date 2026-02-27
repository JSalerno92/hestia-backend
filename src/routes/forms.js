import express from 'express';

const router = express.Router();

export default function formsRoutes(pool) {

  router.get('/by-service/:serviceId', async (req, res) => {
    const { serviceId } = req.params;
    console.log('/by-service/:serviceId - serviceId:', serviceId);

    try {
      // 1️⃣ Buscar service
      const serviceRes = await pool.query(
        `
        SELECT requires_form, form_id
        FROM services
        WHERE id = $1 AND active = true
        `,
        [serviceId]
      );
    console.log('/by-service/:serviceId - serviceRes:', serviceRes);

      if (!serviceRes.rows.length) {
        return res.status(404).json({ error: 'Service not found' });
      }

      const service = serviceRes.rows[0];

      // 2️⃣ No requiere form
      if (!service.requires_form || !service.form_id) {
        return res.json(null);
      }

      // 3️⃣ Traer definición del form
      const formRes = await pool.query(
        `
        SELECT
          f.id,
          f.code,
          f.name,
          f.description
        FROM forms f
        WHERE f.id = $1 AND f.active = true
        `,
        [service.form_id]
      );

      if (!formRes.rows.length) {
        return res.status(404).json({ error: 'Form not found' });
      }

      // 4️⃣ Traer campos del form
      const fieldsRes = await pool.query(
        `
        SELECT
          field_key,
          label,
          type,
          required,
          placeholder,
          options
        FROM form_fields
        WHERE form_id = $1 AND active = true
        ORDER BY display_order ASC
        `,
        [service.form_id]
      );

      // 5️⃣ Respuesta
      res.json({
        ...formRes.rows[0],
        fields: fieldsRes.rows
      });

    } catch (err) {
      console.error('Error fetching form by service', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
}
