import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../db/index.js';
import { config } from '../config/env.js';
import { requireBackofficeAuth } from '../middleware/authBackoffice.js';

const router = express.Router();

/* LOGIN */

router.post('/login', async (req, res) => {

  try {

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email y password son requeridos'
      });
    }

    const result = await pool.query(
      `
      SELECT id, email, password_hash, role, active
      FROM backoffice_users
      WHERE email = $1
      `,
      [email]
    );

    if (result.rowCount === 0) {
      return res.status(401).json({
        error: 'Credenciales inválidas'
      });
    }

    const user = result.rows[0];

    if (!user.active) {
      return res.status(403).json({
        error: 'Usuario desactivado'
      });
    }

    const passwordValid = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!passwordValid) {
      return res.status(401).json({
        error: 'Credenciales inválidas'
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        scope: 'backoffice'
      },
      config.jwtSecret,
      {
        expiresIn: '8h'
      }
    );

    res.json({ token });

  } catch (err) {

    console.error('Backoffice login error:', err);

    res.status(500).json({
      error: 'Internal server error'
    });

  }

});

/* REGISTER */
router.post('/users', requireBackofficeAuth, async (req, res) => {

  try {

    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email y password requeridos'
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `
      INSERT INTO backoffice_users (email, password_hash, role)
      VALUES ($1,$2,$3)
      RETURNING id, email, role, active
      `,
      [
        email,
        passwordHash,
        role || 'admin'
      ]
    );

    res.json(result.rows[0]);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: 'Error creando usuario'
    });

  }

});

/* TOGGLE ACTIVE/ INACTIVE BACKOFFICE USER */
router.patch('/users/:id/toggle-active', requireBackofficeAuth, async (req, res) => {

  try {

    const { id } = req.params;

    const result = await pool.query(
      `
      UPDATE backoffice_users
      SET active = NOT active,
          updated_at = now()
      WHERE id = $1
      RETURNING id, email, active
      `,
      [id]
    );

    res.json(result.rows[0]);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: 'Error actualizando usuario'
    });

  }

});

/* UPDATE PASSWORD */

router.patch('/users/:id/password', requireBackofficeAuth, async (req, res) => {

  try {

    const { id } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        error: 'Password requerido'
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await pool.query(
      `
      UPDATE backoffice_users
      SET password_hash = $1,
          updated_at = now()
      WHERE id = $2
      `,
      [passwordHash, id]
    );

    res.json({
      success: true
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: 'Error cambiando password'
    });

  }

});

/* ALL BACKOFFICE USERS */
router.get('/users', requireBackofficeAuth, async (req, res) => {

  const result = await pool.query(
    `
    SELECT id, email, role, active, created_at
    FROM backoffice_users
    ORDER BY id
    `
  );

  res.json(result.rows);

});

export default router;