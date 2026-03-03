import express from "express";
import pool from "../db.js";
import { requireBackofficeAuth } from "../middleware/authBackoffice.js";

const router = express.Router();

/**
 * Suspender prestadora
 */
router.post("/:id/suspend", requireBackofficeAuth, async (req, res) => {
  const providerId = req.params.id;
  const { date_from, date_to } = req.body;

  if (!date_from || !date_to) {
    return res.status(400).json({ error: "date_from y date_to son obligatorios" });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1️⃣ Obtener servicios asociados a la prestadora
    const servicesResult = await client.query(
      `SELECT service_id 
       FROM service_provider_services 
       WHERE provider_id = $1`,
      [providerId]
    );

    const serviceIds = servicesResult.rows.map(r => r.service_id);

    if (serviceIds.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "La prestadora no tiene servicios asociados." });
    }

    // 2️⃣ Buscar conflictos
    const conflictQuery = `
      SELECT 
        sa.service_id,
        s.name AS service_name,
        sa.date,
        sa.time_slot,
        sa.capacity,
        COUNT(b.id) AS booked_count
      FROM service_availability sa
      JOIN services s ON s.id = sa.service_id
      LEFT JOIN bookings b
        ON b.service_id = sa.service_id
        AND b.date = sa.date
        AND b.time_slot = sa.time_slot
      WHERE sa.service_id = ANY($1)
        AND sa.date BETWEEN $2 AND $3
      GROUP BY sa.service_id, s.name, sa.date, sa.time_slot, sa.capacity
      HAVING COUNT(b.id) >= sa.capacity
      ORDER BY sa.date, sa.time_slot
    `;

    const conflictsResult = await client.query(conflictQuery, [
      serviceIds,
      date_from,
      date_to
    ]);

    if (conflictsResult.rows.length > 0) {
      await client.query("ROLLBACK");

      return res.status(409).json({
        error: "No se puede suspender la prestadora. Existen turnos reservados que quedarían sin cobertura.",
        conflicts: conflictsResult.rows
      });
    }

    // 3️⃣ Reducir capacity
    await client.query(
      `UPDATE service_availability
       SET capacity = GREATEST(capacity - 1, 0)
       WHERE service_id = ANY($1)
         AND date BETWEEN $2 AND $3`,
      [serviceIds, date_from, date_to]
    );

    // 4️⃣ Registrar suspensión
    await client.query(
      `INSERT INTO provider_unavailability (provider_id, date_from, date_to)
       VALUES ($1, $2, $3)`,
      [providerId, date_from, date_to]
    );

    await client.query("COMMIT");

    return res.json({ success: true });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    return res.status(500).json({ error: "Error interno al suspender prestadora." });
  } finally {
    client.release();
  }
});
router.post("/:id/reactivate", requireBackofficeAuth, async (req, res) => {
  const providerId = req.params.id;
  const { date_from, date_to } = req.body;

  if (!date_from || !date_to) {
    return res.status(400).json({ error: "date_from y date_to son obligatorios" });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1️⃣ Servicios asociados
    const servicesResult = await client.query(
      `SELECT service_id 
       FROM service_provider_services 
       WHERE provider_id = $1`,
      [providerId]
    );

    const serviceIds = servicesResult.rows.map(r => r.service_id);

    if (serviceIds.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "La prestadora no tiene servicios asociados." });
    }

    // 2️⃣ Aumentar capacity
    await client.query(
      `UPDATE service_availability
       SET capacity = capacity + 1
       WHERE service_id = ANY($1)
         AND date BETWEEN $2 AND $3`,
      [serviceIds, date_from, date_to]
    );

    // 3️⃣ Eliminar registro de suspensión
    await client.query(
      `DELETE FROM provider_unavailability
       WHERE provider_id = $1
         AND date_from = $2
         AND date_to = $3`,
      [providerId, date_from, date_to]
    );

    await client.query("COMMIT");

    return res.json({ success: true });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    return res.status(500).json({ error: "Error interno al reactivar prestadora." });
  } finally {
    client.release();
  }
});

export default router;