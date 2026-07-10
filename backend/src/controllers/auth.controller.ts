/**
 * auth.controller.ts -- Controlador de autenticación
 *
 * Recibe las peticiones HTTP de registro y login.
 * Responsabilidades:
 *   - Extraer y validar los datos del body con zod
 *   - Delegar a authService
 *   - Devolver la respuesta HTTP apropiada
 *
 * No contiene lógica de negocio: solo gestión HTTP.
 * Cubre RF01, RF02.
 */

import { Request, Response } from 'express';
import { z } from 'zod';
import authService, {
  EmailYaRegistradoError,
  CredencialesInvalidasError,
} from '../services/auth.service';

// Esquemas de validación (zod)

const registroSchema = z.object({
  email: z
    .string({ required_error: 'El email es obligatorio' })
    .email('Formato de email inválido')
    .toLowerCase(),
  password: z
    .string({ required_error: 'La contraseña es obligatoria' })
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(
      /(?=.*\d)(?=.*[^A-Za-z0-9])/,
      'La contraseña debe incluir al menos un número y un carácter especial.',
    ),
  nombre: z
    .string({ required_error: 'El nombre es obligatorio' })
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede superar los 100 caracteres')
    .trim(),
});

const loginSchema = z.object({
  email: z
    .string({ required_error: 'El email es obligatorio' })
    .email('Formato de email inválido')
    .toLowerCase(),
  password: z
    .string({ required_error: 'La contraseña es obligatoria' })
    .min(1, 'La contraseña es obligatoria'),
});

// Controlador

const authController = {

  /**
   * POST /auth/registro
   *
   * Body: { email, password, nombre }
   *
   * Respuestas:
   *   201 -- registro exitoso → { token, usuario }
   *   400 -- datos inválidos (zod)
   *   409 -- email ya registrado
   *   500 -- error interno
   */
  async registro(req: Request, res: Response): Promise<void> {
    const resultado = registroSchema.safeParse(req.body);
    if (!resultado.success) {
      res.status(400).json({
        error: 'Datos de registro inválidos',
        detalles: resultado.error.flatten().fieldErrors,
      });
      return;
    }

    try {
      const respuesta = await authService.registro(resultado.data);
      res.status(201).json(respuesta);
    } catch (error) {
      if (error instanceof EmailYaRegistradoError) {
        res.status(409).json({ error: error.message });
        return;
      }
      console.error('[auth.controller] Error en registro:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  /**
   * POST /auth/login
   *
   * Body: { email, password }
   *
   * Respuestas:
   *   200 -- login exitoso → { token, usuario }
   *   400 -- datos inválidos (zod)
   *   401 -- credenciales incorrectas
   *   500 -- error interno
   */
  async login(req: Request, res: Response): Promise<void> {
    const resultado = loginSchema.safeParse(req.body);
    if (!resultado.success) {
      res.status(400).json({
        error: 'Datos de login inválidos',
        detalles: resultado.error.flatten().fieldErrors,
      });
      return;
    }

    try {
      const respuesta = await authService.login(resultado.data);
      res.status(200).json(respuesta);
    } catch (error) {
      if (error instanceof CredencialesInvalidasError) {
        res.status(401).json({ error: error.message });
        return;
      }
      console.error('[auth.controller] Error en login:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },
};

export default authController;
