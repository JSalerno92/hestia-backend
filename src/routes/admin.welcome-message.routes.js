import express from "express";
import pool from "../db/index.js";

const router = express.Router();

/* ----------------------------------------------------- */
/* GET all welcome messages */
/* ----------------------------------------------------- */

router.get("/", async (req, res) => {

  const client = await pool.connect();

  try {

    const result = await client.query(`
      SELECT
        id,
        title,
        message,
        sub_message,
        duration_ms,
        valid_from,
        valid_to,
        priority,
        is_active,
        is_default,
        created_at,
        updated_at
      FROM welcome_messages
      ORDER BY
        is_default DESC,
        priority DESC,
        created_at DESC
    `);

    res.json(result.rows);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Error obteniendo welcome messages"
    });

  } finally {

    client.release();

  }

});


/* ----------------------------------------------------- */
/* CREATE welcome message */
/* ----------------------------------------------------- */

router.post("/", async (req, res) => {

  const {
    title,
    message,
    sub_message,
    duration_ms = 3000,
    valid_from,
    valid_to,
    priority = 0,
    is_active = true,
    is_default = false
  } = req.body;

  if (!title || !message) {
    return res.status(400).json({
      error: "title and message are required"
    });
  }

  const client = await pool.connect();

  try {

    await client.query("BEGIN");

    if (is_default) {

      await client.query(`
        UPDATE welcome_messages
        SET is_default = false
        WHERE is_default = true
      `);

    }

    const result = await client.query(
      `
      INSERT INTO welcome_messages
      (
        title,
        message,
        sub_message,
        duration_ms,
        valid_from,
        valid_to,
        priority,
        is_active,
        is_default
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING *
      `,
      [
        title,
        message,
        sub_message || null,
        duration_ms,
        valid_from || null,
        valid_to || null,
        priority,
        is_active,
        is_default
      ]
    );

    await client.query("COMMIT");

    res.status(201).json(result.rows[0]);

  } catch (err) {

    await client.query("ROLLBACK");

    console.error(err);

    res.status(500).json({
      error: "Error creando welcome message"
    });

  } finally {

    client.release();

  }

});


/* ----------------------------------------------------- */
/* UPDATE welcome message */
/* ----------------------------------------------------- */

router.put("/:id", async (req, res) => {

  const { id } = req.params;

  const {
    title,
    message,
    sub_message,
    duration_ms,
    valid_from,
    valid_to,
    priority,
    is_active,
    is_default
  } = req.body;

  const client = await pool.connect();

  try {

    await client.query("BEGIN");

    if (is_default) {

      await client.query(`
        UPDATE welcome_messages
        SET is_default = false
        WHERE is_default = true
      `);

    }

    const result = await client.query(
      `
      UPDATE welcome_messages
      SET
        title = COALESCE($1, title),
        message = COALESCE($2, message),
        sub_message = COALESCE($3, sub_message),
        duration_ms = COALESCE($4, duration_ms),
        valid_from = COALESCE($5, valid_from),
        valid_to = COALESCE($6, valid_to),
        priority = COALESCE($7, priority),
        is_active = COALESCE($8, is_active),
        is_default = COALESCE($9, is_default),
        updated_at = now()
      WHERE id = $10
      RETURNING *
      `,
      [
        title,
        message,
        sub_message,
        duration_ms,
        valid_from,
        valid_to,
        priority,
        is_active,
        is_default,
        id
      ]
    );

    await client.query("COMMIT");

    res.json(result.rows[0]);

  } catch (err) {

    await client.query("ROLLBACK");

    console.error(err);

    res.status(500).json({
      error: "Error actualizando welcome message"
    });

  } finally {

    client.release();

  }

});


/* ----------------------------------------------------- */
/* DELETE welcome message */
/* ----------------------------------------------------- */

router.delete("/:id", async (req, res) => {

  const { id } = req.params;

  const client = await pool.connect();

  try {

    await client.query(
      `DELETE FROM welcome_messages WHERE id = $1`,
      [id]
    );

    res.json({
      message: "Welcome message eliminado"
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Error eliminando welcome message"
    });

  } finally {

    client.release();

  }

});


/* ----------------------------------------------------- */
/* TOGGLE ACTIVE */
/* ----------------------------------------------------- */

router.patch("/:id/toggle-active", async (req, res) => {

  const { id } = req.params;

  const client = await pool.connect();

  try {

    const result = await client.query(
      `
      UPDATE welcome_messages
      SET is_active = NOT is_active,
          updated_at = now()
      WHERE id = $1
      RETURNING *
      `,
      [id]
    );

    res.json(result.rows[0]);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Error toggling active"
    });

  } finally {

    client.release();

  }

});


/* ----------------------------------------------------- */
/* SET DEFAULT */
/* ----------------------------------------------------- */

router.patch("/:id/set-default", async (req, res) => {

  const { id } = req.params;

  const client = await pool.connect();

  try {

    await client.query("BEGIN");

    await client.query(`
      UPDATE welcome_messages
      SET is_default = false
      WHERE is_default = true
    `);

    const result = await client.query(
      `
      UPDATE welcome_messages
      SET is_default = true,
          updated_at = now()
      WHERE id = $1
      RETURNING *
      `,
      [id]
    );

    await client.query("COMMIT");

    res.json(result.rows[0]);

  } catch (err) {

    await client.query("ROLLBACK");

    console.error(err);

    res.status(500).json({
      error: "Error setting default message"
    });

  } finally {

    client.release();

  }

});

export default router;