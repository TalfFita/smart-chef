/**
 * auth.service.ts -- Lógica de autenticación
 *
 * Gestiona el registro y login de usuarios.
 * Responsabilidades:
 *   - Validar que el email no esté ya registrado
 *   - Hashear la contraseña con bcrypt (saltRounds 10)
 *   - Comparar contraseñas en el login
 *   - Emitir tokens JWT firmados
 *
 * No accede a Prisma directamente: usa usuarioRepository.
 * No gestiona HTTP: eso lo hace auth.controller.ts.
 */

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import usuarioRepository from '../repositories/usuario.repository';

// Configuración

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET ?? 'secreto_desarrollo_inseguro';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '15m';

// Tipos

export interface RegistroInput {
  email: string;
  password: string;
  nombre: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthRespuesta {
  token: string;
  usuario: {
    id: number;
    email: string;
    nombre: string;
  };
}

/**
 * Payload que se firma dentro del JWT.
 * El middleware lo extrae y lo añade a req.usuario.
 */
export interface JwtPayload {
  sub: number;   // id del usuario
  email: string;
}

// Errores de dominio

export class EmailYaRegistradoError extends Error {
  constructor() {
    super('El email ya está registrado');
    this.name = 'EmailYaRegistradoError';
  }
}

export class CredencialesInvalidasError extends Error {
  constructor() {
    super('Email o contraseña incorrectos');
    this.name = 'CredencialesInvalidasError';
  }
}

// Servicio

const authService = {

  /**
   * Registra un nuevo usuario.
   *
   * 1. Comprueba que el email no esté ya en uso.
   * 2. Hashea la contraseña con bcrypt.
   * 3. Crea el usuario en la base de datos.
   * 4. Devuelve token JWT + datos del usuario (sin password_hash).
   *
   * Cubre RF01.
   */
  async registro(datos: RegistroInput): Promise<AuthRespuesta> {
    const existente = await usuarioRepository.findByEmail(datos.email);
    if (existente !== null) {
      throw new EmailYaRegistradoError();
    }

    const password_hash = await bcrypt.hash(datos.password, SALT_ROUNDS);

    const usuario = await usuarioRepository.create({
      email: datos.email,
      password_hash,
      nombre: datos.nombre,
    });

    const token = emitirToken({ sub: usuario.id, email: usuario.email });

    return {
      token,
      usuario: {
        id: usuario.id,
        email: usuario.email,
        nombre: usuario.nombre,
      },
    };
  },

  /**
   * Autentica un usuario existente.
   *
   * 1. Busca el usuario por email.
   * 2. Compara la contraseña con el hash almacenado.
   * 3. Devuelve token JWT + datos del usuario.
   *
   * Si el email no existe o la contraseña no coincide, lanza
   * CredencialesInvalidasError (mismo error en ambos casos para
   * no revelar si el email existe o no -- práctica de seguridad estándar).
   *
   * Cubre RF01, RF02.
   */
  async login(datos: LoginInput): Promise<AuthRespuesta> {
    const usuario = await usuarioRepository.findByEmail(datos.email);
    if (usuario === null) {
      throw new CredencialesInvalidasError();
    }

    const coincide = await bcrypt.compare(datos.password, usuario.password_hash);
    if (!coincide) {
      throw new CredencialesInvalidasError();
    }

    const token = emitirToken({ sub: usuario.id, email: usuario.email });

    return {
      token,
      usuario: {
        id: usuario.id,
        email: usuario.email,
        nombre: usuario.nombre,
      },
    };
  },
};

// Utilidad interna

/**
 * Firma y devuelve un JWT con el payload indicado.
 * La expiración viene de la variable de entorno JWT_EXPIRES_IN.
 */
function emitirToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN as unknown as Exclude<jwt.SignOptions['expiresIn'], undefined>,
  });
}

export default authService;
