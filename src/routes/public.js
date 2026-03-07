import express from 'express';
import pool from "../db/index.js";

const router = express.Router();

router.get("/", async (req, res) => {

  const client = await pool.connect();

  try {

    const result = await client.query(`
      SELECT
        message,
        sub_message,
        duration_ms,
        valid_from,
        valid_to
      FROM welcome_messages
      WHERE
        is_active = true
        AND (valid_from IS NULL OR valid_from <= now())
        AND (valid_to IS NULL OR valid_to >= now())
      ORDER BY
        is_default DESC,
        priority DESC
      LIMIT 1
    `);

    const message = result.rows[0];

    if (!message) {
      return res.json({ active: false });
    }

    res.json({
      active: true,
      message: message.message,
      subMessage: message.sub_message,
      durationMs: message.duration_ms,
      validFrom: message.valid_from,
      validTo: message.valid_to
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Error obteniendo welcome messages"
    });

  } finally {

    client.release();

  }

});

export default router;