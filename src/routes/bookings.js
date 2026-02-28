import express from 'express';
import pool from '../db/index.js';

const router = express.Router();

router.post('/', async (req, res) => {
  const {
    service_id,
    date,
    time,
    name,
    whatsapp,
    email,
    comments
  } = req.body;

  try {

    const result = await pool.query(
      `
      INSERT INTO bookings
        (service_id, date, time_slot, customer_data)
      VALUES
        ($1, $2, $3, $4)
      RETURNING *
      `,
      [
        service_id,
        date,
        time,
        {
          name,
          whatsapp,
          email,
          comments
        }
      ]
    );

    res.status(201).json(result.rows[0]);

  } catch (err) {

    // Violación UNIQUE → slot ya tomado
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Horario ya reservado' });
    }

    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;