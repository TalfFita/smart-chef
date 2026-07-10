/**
 * usuario.repository.ts -- Repositorio de usuarios
 *
 * Único punto de acceso a la tabla "usuarios".
 * No contiene lógica de negocio: el hash de contraseña y la
 * emisión de JWT los gestiona auth.service.ts.
 *
 * Métodos:
 *   findByEmail  -- buscar usuario por email para login (RF01)
 *   findById     -- buscar usuario por id para validar JWT (RF02)
 *   create       -- registrar nuevo usuario (RF01)
 */

import prisma from '../lib/prisma';

// Tipos

/**
 * Datos necesarios para crear un usuario nuevo.
 * password_hash ya viene hasheado desde auth.service.ts.
 */
export interface UsuarioCreateInput {
  email: string;
  password_hash: string;
  nombre: string;
}

// Repositorio

const usuarioRepository = {

  /**
   * Busca un usuario por email.
   * Devuelve null si no existe.
   * Usado por auth.service.ts en el login para comparar el hash.
   */
  async findByEmail(email: string) {
    return prisma.usuario.findUnique({
      where: { email },
    });
  },

  /**
   * Busca un usuario por su ID.
   * Devuelve null si no existe.
   * Usado por el middleware JWT para verificar que el usuario
   * del token sigue existiendo en la base de datos.
   */
  async findById(id: number) {
    return prisma.usuario.findUnique({
      where: { id },
      // Nunca devolvemos password_hash fuera del repositorio de auth
      select: {
        id: true,
        email: true,
        nombre: true,
        created_at: true,
      },
    });
  },

  /**
   * Crea un usuario nuevo.
   * Devuelve el usuario sin el campo password_hash por seguridad.
   * Usado por auth.service.ts en el registro.
   */
  async create(datos: UsuarioCreateInput) {
    return prisma.usuario.create({
      data: {
        email: datos.email,
        password_hash: datos.password_hash,
        nombre: datos.nombre,
      },
      select: {
        id: true,
        email: true,
        nombre: true,
        created_at: true,
      },
    });
  },
};

export default usuarioRepository;
