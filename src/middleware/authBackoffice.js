import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

export function requireBackofficeAuth(req, res, next) {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token requerido' });
  }

  const token = header.split(' ')[1];

  try {
    const payload = jwt.verify(token, config.jwtSecret);
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }
}
