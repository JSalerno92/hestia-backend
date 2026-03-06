import express from "express";
import pool from '../db/index.js';

const router = express.Router();

/* ----------------------------------------------------- */
/* Helpers */
/* ----------------------------------------------------- */

function timeToMinutes(time) {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

function buildDates(start_date, end_date) {
  const dates = [];
  let current = new Date(start_date);
  const end = new Date(end_date);

  while (current <= end) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

/* ----------------------------------------------------- */
/* PREVIEW availability generation */
/* ----------------------------------------------------- */

router.post('/preview', async (req, res) => {
  const {
    service_id,
    start_date,
    end_date,
    start_time,
    end_time,
    slot_duration,
    days_of_week
  } = req.body;

  /* ---------- Validaciones ---------- */

  if (
    !service_id ||
    !start_date ||
    !end_date ||
    !start_time ||
    !end_time ||
    !slot_duration ||
    !days_of_week
  ) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (!Array.isArray(days_of_week)) {
    return res.status(400).json({ error: 'days_of_week must be an array' });
  }

  if (days_of_week.some(d => d < 0 || d > 6)) {
    return res.status(400).json({ error: 'days_of_week values must be 0-6' });
  }

  if (timeToMinutes(start_time) >= timeToMinutes(end_time)) {
    return res.status(400).json({
      error: 'start_time must be before end_time'
    });
  }

  const client = await pool.connect();

  try {

    const dates = buildDates(start_date, end_date);

    const preview = [];

    for (const date of dates) {

      const day = date.getDay();

      if (!days_of_week.includes(day)) continue;

      let time = timeToMinutes(start_time);
      const end = timeToMinutes(end_time);

      while (time + slot_duration <= end) {

        const hour = String(Math.floor(time / 60)).padStart(2, '0');
        const minute = String(time % 60).padStart(2, '0');
        const slot = `${hour}:${minute}`;

        const formattedDate = formatDate(date);

        const existing = await client.query(
          `
          SELECT capacity
          FROM service_availability
          WHERE service_id = $1
          AND date = $2
          AND time_slot = $3
          `,
          [service_id, formattedDate, slot]
        );

        preview.push({
          date: formattedDate,
          time_slot: slot,
          exists: existing.rowCount > 0,
          current_capacity: existing.rows[0]?.capacity || 0
        });

        time += slot_duration;
      }
    }

    res.json({
      total_slots: preview.length,
      preview_slots: preview
    });

  } catch (err) {

    console.error(err);
    res.status(500).json({ error: 'Preview generation failed' });

  } finally {

    client.release();

  }
});

/* ----------------------------------------------------- */
/* GENERATE availability */
/* ----------------------------------------------------- */

router.post('/generate', async (req, res) => {

  const {
    service_id,
    start_date,
    end_date,
    start_time,
    end_time,
    slot_duration,
    capacity_to_add,
    days_of_week
  } = req.body;

  /* ---------- Validaciones ---------- */

  if (
    !service_id ||
    !start_date ||
    !end_date ||
    !start_time ||
    !end_time ||
    !slot_duration ||
    !capacity_to_add ||
    !days_of_week
  ) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (capacity_to_add <= 0) {
    return res.status(400).json({
      error: 'capacity_to_add must be greater than 0'
    });
  }

  if (!Array.isArray(days_of_week)) {
    return res.status(400).json({ error: 'days_of_week must be an array' });
  }

  if (days_of_week.some(d => d < 0 || d > 6)) {
    return res.status(400).json({ error: 'days_of_week values must be 0-6' });
  }

  if (timeToMinutes(start_time) >= timeToMinutes(end_time)) {
    return res.status(400).json({
      error: 'start_time must be before end_time'
    });
  }

  const client = await pool.connect();

  try {

    await client.query('BEGIN');

    const dates = buildDates(start_date, end_date);

    let inserted = 0;
    let updated = 0;

    for (const date of dates) {

      const day = date.getDay();

      if (!days_of_week.includes(day)) continue;

      let time = timeToMinutes(start_time);
      const end = timeToMinutes(end_time);

      while (time + slot_duration <= end) {

        const hour = String(Math.floor(time / 60)).padStart(2, '0');
        const minute = String(time % 60).padStart(2, '0');
        const slot = `${hour}:${minute}`;

        const formattedDate = formatDate(date);

        const result = await client.query(
          `
          INSERT INTO service_availability
          (service_id, date, time_slot, capacity)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (service_id, date, time_slot)
          DO UPDATE
          SET capacity = service_availability.capacity + EXCLUDED.capacity
          RETURNING xmax
          `,
          [service_id, formattedDate, slot, capacity_to_add]
        );

        if (result.rows[0].xmax === '0') {
          inserted++;
        } else {
          updated++;
        }

        time += slot_duration;

      }

    }

    await client.query('COMMIT');

    res.json({
      message: 'Availability generated successfully',
      inserted,
      updated
    });

  } catch (err) {

    await client.query('ROLLBACK');
    console.error(err);

    res.status(500).json({
      error: 'Availability generation failed'
    });

  } finally {

    client.release();

  }

});

/* ----------------------------------------------------- */
/* GET availability */
/* ----------------------------------------------------- */

router.get("/", async (req, res) => {

  const {
    service_id,
    start_date,
    end_date,
    limit = 100,
    offset = 0
  } = req.query;

  const client = await pool.connect();

  try {

    const conditions = [];
    const params = [];

    if (service_id) {
      params.push(service_id);
      conditions.push(`sa.service_id = $${params.length}`);
    }

    if (start_date) {
      params.push(start_date);
      conditions.push(`sa.date >= $${params.length}`);
    }

    if (end_date) {
      params.push(end_date);
      conditions.push(`sa.date <= $${params.length}`);
    }

    const whereClause = conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

    params.push(limit);
    params.push(offset);

    const query = `
      SELECT
        sa.service_id,
        s.name AS service_name,
        sa.date,
        sa.time_slot,
        sa.capacity,

        COUNT(b.id) FILTER (WHERE b.status != 'cancelled') AS booked

      FROM service_availability sa

      JOIN services s
        ON s.id = sa.service_id

      LEFT JOIN bookings b
        ON b.service_id = sa.service_id
        AND b.date = sa.date
        AND b.time_slot = sa.time_slot

      ${whereClause}

      GROUP BY
        sa.service_id,
        s.name,
        sa.date,
        sa.time_slot,
        sa.capacity

      ORDER BY
        sa.date ASC,
        sa.time_slot ASC

      LIMIT $${params.length - 1}
      OFFSET $${params.length}
    `;

    const result = await client.query(query, params);

    res.json(result.rows);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Error obteniendo availability"
    });

  } finally {

    client.release();

  }

});

export default router;