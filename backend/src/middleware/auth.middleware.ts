/**
 * auth.middleware.ts -- Middleware de autenticación JWT
 *
 * Verifica el token JWT en el header Authorization de cada petición
 * a rutas protegidas. Si el token es válido, añade los datos del
 * usuario decodificado a req.usuario para que los controllers los usen.
 *
 * Uso en rutas:
 *   router.post('/recetas', authMiddleware, recetaController.crear);
 *
 * Cubre RF02.
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JwtPayload } from '../services/auth.service';

const JWT_SECRET = process.env.JWT_SECRET ?? 'secreto_desarrollo_inseguro';

// Extensión del tipo Request

/**
 * Extiende el tipo Request de Express para incluir el usuario
 * decodificado del JWT. Los controllers lo leen como req.usuario.
 */
declare global {
  namespace Express {
    interface Request {
      usuario?: JwtPayload;
    }
  }
}

// Middleware

/**
 * Middleware que valida el JWT y añade req.usuario.
 *
 * Espera el header: Authorization: Bearer <token>
 *
 * Respuestas de error:
 *   401 -- token ausente
 *   401 -- token inválido o expirado
 */
export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token de autenticación no proporcionado' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, JWT_SECRET) as unknown as JwtPayload;
    req.usuario = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
}
