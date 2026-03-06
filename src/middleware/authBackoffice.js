// authBackoffice.js

import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

export function requireBackofficeAuth(req, res, next) {

  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({
      message: 'Token requerido'
    });
  }

  const token = header.split(' ')[1];

  try {

    const payload = jwt.verify(token, config.jwtSecret);

    // Validar que el token sea de backoffice
    if (payload.scope !== 'backoffice') {
      return res.status(403).json({
        message: 'Acceso no autorizado'
      });
    }

    req.user = payload;

    next();

  } catch (err) {

    return res.status(401).json({
      message: 'Token inválido o expirado'
    });

  }

}