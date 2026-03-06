import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../db/index.js';
import { config } from '../config/env.js';

const router = express.Router();

router.post('/login', async (req, res) => {
  try {

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email y password son requeridos'
      });
    }

    const result = await pool.query(
      `SELECT id, email, password_hash
       FROM admin_users
       WHERE email = $1`,
      [email]
    );

    if (result.rowCount === 0) {
      return res.status(401).json({
        error: 'Credenciales inválidas'
      });
    }

    const user = result.rows[0];

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
        scope: 'backoffice'
      },
      config.jwtSecret,
      {
        expiresIn: '8h'
      }
    );

    res.json({
      token
    });

  } catch (err) {

    console.error('Backoffice login error:', err);

    res.status(500).json({
      error: 'Internal server error'
    });

  }
});

export default router;