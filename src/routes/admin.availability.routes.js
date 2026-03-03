import express from "express";
import pool from "../db.js";
import { requireBackofficeAuth } from "../middleware/authBackoffice.js";

const router = express.Router();

const MAX_RANGE_DAYS = 365;

/* =========================
   Helpers
========================= */

function parseDate(str) {
  return new Date(str + "T00:00:00");
}

function formatDate(date) {
  return date.toISOString().split("T")[0];
}

function addMinutes(timeStr, minutesToAdd) {
  const [h, m] = timeStr.split(":").map(Number);
  const total = h * 60 + m + minutesToAdd;
  const newH = Math.floor(total / 60);
  const newM = total % 60;
  return `${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}`;
}

function timeToMinutes(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function getSlotsForDay(startTime, endTime, durationMinutes) {
  const slots = [];
  let current = startTime;

  while (timeToMinutes(current) + durationMinutes <= timeToMinutes(endTime)) {
    slots.push(current);
    current = addMinutes(current, durationMinutes);
  }

  return slots;
}

function dateDiffInDays(d1, d2) {
  const diff = d2 - d1;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/* =========================
   PREVIEW
========================= */

router.post("/preview", requireBackofficeAuth, async (req, res) => {
  const {
    service_id,
    start_date,
    end_date,
    days_of_week,
    start_time,
    end_time,
    capacity_to_add
  } = req.body;

  if (!service_id || !start_date || !end_date || !days_of_week || !start_time || !end_time || !capacity_to_add) {
    return res.status(400).json({ error: "Faltan parámetros obligatorios." });
  }

  const start = parseDate(start_date);
  const end = parseDate(end_date);

  if (dateDiffInDays(start, end) > MAX_RANGE_DAYS) {
    return res.status(400).json({ error: "El rango no puede superar 1 año." });
  }

  if (start > end) {
    return res.status(400).json({ error: "start_date debe ser menor a end_date." });
  }

  const client = await pool.connect();

  try {
    const serviceRes = await client.query(
      "SELECT duration_minutes FROM services WHERE id = $1",
      [service_id]
    );

    if (serviceRes.rows.length === 0) {
      return res.status(404).json({ error: "Servicio no encontrado." });
    }

    const duration = serviceRes.rows[0].duration_minutes;

    const allSlots = [];
    let cursor = new Date(start);

    while (cursor <= end) {
      const dayOfWeek = cursor.getDay(); // 0-6

      if (days_of_week.includes(dayOfWeek)) {
        const slots = getSlotsForDay(start_time, end_time, duration);

        slots.forEach(timeSlot => {
          allSlots.push({
            date: formatDate(cursor),
            time_slot: timeSlot
          });
        });
      }

      cursor.setDate(cursor.getDate() + 1);
    }

    let newSlots = 0;
    let existingSlots = 0;
    const existingDetails = [];

    for (const slot of allSlots) {
      const existing = await client.query(
        `SELECT capacity
         FROM service_availability
         WHERE service_id = $1
           AND date = $2
           AND time_slot = $3`,
        [service_id, slot.date, slot.time_slot]
      );

      if (existing.rows.length > 0) {
        existingSlots++;
        existingDetails.push({
          date: slot.date,
          time_slot: slot.time_slot,
          current_capacity: existing.rows[0].capacity,
          new_capacity: existing.rows[0].capacity + capacity_to_add
        });
      } else {
        newSlots++;
      }
    }

    return res.json({
      summary: {
        total_slots: allSlots.length,
        new_slots: newSlots,
        existing_slots: existingSlots
      },
      existing_conflicts: existingDetails
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error en preview." });
  } finally {
    client.release();
  }
});

/* =========================
   GENERATE (confirmado)
========================= */

router.post("/generate", requireBackofficeAuth, async (req, res) => {
  const {
    service_id,
    start_date,
    end_date,
    days_of_week,
    start_time,
    end_time,
    capacity_to_add,
    confirmed
  } = req.body;

  if (!confirmed) {
    return res.status(400).json({ error: "Debe confirmar la operación." });
  }

  const start = parseDate(start_date);
  const end = parseDate(end_date);

  if (dateDiffInDays(start, end) > MAX_RANGE_DAYS) {
    return res.status(400).json({ error: "El rango no puede superar 1 año." });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const serviceRes = await client.query(
      "SELECT duration_minutes FROM services WHERE id = $1",
      [service_id]
    );

    if (serviceRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Servicio no encontrado." });
    }

    const duration = serviceRes.rows[0].duration_minutes;

    let cursor = new Date(start);
    let affected = 0;

    while (cursor <= end) {
      const dayOfWeek = cursor.getDay();

      if (days_of_week.includes(dayOfWeek)) {
        const slots = getSlotsForDay(start_time, end_time, duration);

        for (const timeSlot of slots) {
          await client.query(
            `
            INSERT INTO service_availability (service_id, date, time_slot, capacity)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (service_id, date, time_slot)
            DO UPDATE
            SET capacity = service_availability.capacity + EXCLUDED.capacity
            `,
            [service_id, formatDate(cursor), timeSlot, capacity_to_add]
          );
          affected++;
        }
      }

      cursor.setDate(cursor.getDate() + 1);
    }

    await client.query("COMMIT");

    return res.json({
      success: true,
      total_slots_processed: affected
    });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    return res.status(500).json({ error: "Error generando availability." });
  } finally {
    client.release();
  }
});

export default router;