import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../db/index.js';
import { config } from '../config/env.js';

const router = express.Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email y password requeridos' });
  }

  const { rows } = await pool.query(
    `
    SELECT id, email, password_hash, role, active
    FROM backoffice_users
    WHERE email = $1
    `,
    [email]
  );

  if (rows.length === 0) {
    return res.status(401).json({ message: 'Credenciales inválidas' });
  }

  const user = rows[0];

  if (!user.active) {
    return res.status(403).json({ message: 'Usuario inactivo' });
  }

  const passwordOk = await bcrypt.compare(password, user.password_hash);

  if (!passwordOk) {
    return res.status(401).json({ message: 'Credenciales inválidas' });
  }

  const token = jwt.sign(
    { sub: user.id, role: user.role },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );

  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role
    }
  });
});

export default router;
