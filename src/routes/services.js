import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const contentPath = path.join(__dirname, '../config/serviceContent.json');

const serviceContent = JSON.parse(
  fs.readFileSync(contentPath, 'utf-8')
);

export default function servicesRoutes(pool) {
  const router = express.Router();

  /*
   |--------------------------------------------------------------------------
   | GET /api/services
   | Lista servicios activos
   |--------------------------------------------------------------------------
   */
  router.get('/', async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT
          id,
          code,
          name,
          short_label,
          description,
          info,
          ui_color,
          display_order,
          requires_form,
          service_group,
          duration_minutes,
          scheduling_type,
          form_id,
          active,
          created_at,
          updated_at
        FROM services
        WHERE active = true
        ORDER BY display_order ASC
      `);

      res.json(result.rows);

    } catch (err) {
      console.error('Error fetching services', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  /*
   |--------------------------------------------------------------------------
   | GET /api/services/:id/availability?month=YYYY-MM
   |--------------------------------------------------------------------------
   */
  router.get('/:id/availability', async (req, res) => {
    const { id } = req.params;

    try {
      const serviceRes = await pool.query(
        'SELECT scheduling_type FROM services WHERE id = $1',
        [id]
      );

      if (!serviceRes.rows.length) {
        return res.status(404).json({ error: 'Servicio no encontrado' });
      }

      if (serviceRes.rows[0].scheduling_type !== 'fixed_block') {
        return res.json({ days: [] });
      }

      const today = new Date();
      const endDate = new Date();
      endDate.setDate(today.getDate() + 60);

      const availabilityRes = await pool.query(
        `
        SELECT 
          sa.date,
          sa.time_slot,
          sa.capacity,
          COUNT(b.id) AS booked_count,
          (sa.capacity - COUNT(b.id)) AS available_capacity
        FROM service_availability sa
        LEFT JOIN bookings b
          ON b.service_id = sa.service_id
          AND b.date = sa.date
          AND b.time_slot = sa.time_slot
        WHERE sa.service_id = $1
          AND sa.date >= $2
          AND sa.date <= $3
          AND sa.active = true
        GROUP BY sa.id, sa.date, sa.time_slot, sa.capacity
        HAVING (sa.capacity - COUNT(b.id)) > 0
        ORDER BY sa.date ASC, sa.time_slot ASC
        `,
        [id, today, endDate]
      );

      const grouped = {};

      availabilityRes.rows.forEach(row => {
        const dateKey = row.date.toISOString().slice(0, 10);

        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }

        grouped[dateKey].push({
          time: row.time_slot.slice(0, 5),
          capacity_total: Number(row.capacity),
          booked_count: Number(row.booked_count),
          capacity_remaining: Number(row.available_capacity),
          available: row.available_capacity > 0
        });
      });

      const days = Object.keys(grouped).map(date => ({
        date,
        slots: grouped[date]
      }));

      res.json({ days });

    } catch (err) {
      console.error('Availability error:', err);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });

  router.get('/:id/config', async (req, res) => {
    const { id } = req.params;

    const content = serviceContent[id];

    if (!content) {
      return res.status(404).json({ error: 'Config no encontrada' });
    }

    res.json(content);
  });

  return router;
}