import express from 'express';
import pool from '../db/index.js';

const router = express.Router();

router.post('/generate', async (req, res) => {
  const { service_id, date, start_time, end_time } = req.body;

  if (!service_id || !date || !start_time || !end_time) {
    return res.status(400).json({ error: 'Faltan datos obligatorios' });
  }

  try {
    const serviceRes = await pool.query(
      `SELECT duration_minutes, scheduling_type
       FROM services
       WHERE id = $1`,
      [service_id]
    );

    if (!serviceRes.rows.length) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }

    const service = serviceRes.rows[0];

    if (service.scheduling_type !== 'fixed_block') {
      return res.status(400).json({
        error: 'Este servicio no admite generación automática de bloques'
      });
    }

    const duration = service.duration_minutes;

    const slots = generateTimeSlots(date, start_time, end_time, duration);

    const insertPromises = slots.map(slot =>
      pool.query(
        `
        INSERT INTO service_availability
        (service_id, date, time_slot)
        VALUES ($1, $2, $3)
        ON CONFLICT DO NOTHING
        `,
        [service_id, slot.date, slot.time_slot]
      )
    );

    await Promise.all(insertPromises);

    res.json({
      message: 'Disponibilidad generada correctamente',
      slots_created: slots.length
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

function generateTimeSlots(date, startTime, endTime, durationMinutes) {

  const slots = [];

  const start = new Date(`${date}T${startTime}`);
  const end = new Date(`${date}T${endTime}`);

  let current = new Date(start);

  while (current.getTime() + durationMinutes * 60000 <= end.getTime()) {

    slots.push({
      date,
      time_slot: current.toTimeString().slice(0,5)
    });

    current = new Date(current.getTime() + durationMinutes * 60000);
  }

  return slots;
}

export default router;