import express from 'express';
import pool from '../db/index.js';

const router = express.Router();

// obtener todos los servicios
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
      ORDER BY display_order ASC
    `);

    res.json(result.rows);

  } catch (err) {
    console.error('Error fetching services (admin)', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// editar servicios
router.patch('/:id', async (req, res) => {

  const { id } = req.params;

  const {
    name,
    short_label,
    description,
    info,
    ui_color,
    display_order,
    active
  } = req.body;

  try {

    const result = await pool.query(`
      UPDATE services
      SET
        name = $1,
        short_label = $2,
        description = $3,
        info = $4,
        ui_color = $5,
        display_order = $6,
        active = $7,
        updated_at = now()
      WHERE id = $8
      RETURNING *
    `, [
      name,
      short_label,
      description,
      info,
      ui_color,
      display_order,
      active,
      id
    ]);

    res.json(result.rows[0]);

  } catch (err) {
    console.error('Error updating service', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// crear servicios
router.post('/', async (req, res) => {

  const {
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
    scheduling_type
  } = req.body;

  try {

    const result = await pool.query(`
      INSERT INTO services (
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
        scheduling_type
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11
      )
      RETURNING *
    `, [
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
      scheduling_type
    ]);

    res.json(result.rows[0]);

  } catch (err) {
    console.error('Error creating service', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// activar/ desactivar
router.patch('/:id/toggle', async (req, res) => {

  const { id } = req.params;

  try {

    const result = await pool.query(`
      UPDATE services
      SET active = NOT active,
      updated_at = now()
      WHERE id = $1
      RETURNING *
    `, [id]);

    res.json(result.rows[0]);

  } catch (err) {
    console.error('Error toggling service', err);
    res.status(500).json({ error: 'Internal server error' });
  }

});

export default router;