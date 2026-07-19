/**
 * favorito.service.ts -- Lógica de negocio de favoritos
 *
 * Responsabilidades:
 *   - Añadir receta a favoritos (RF06)
 *   - Quitar receta de favoritos (RF06)
 *   - Listar favoritos del usuario (RF06)
 *
 * Gestiona el caso de duplicado: si el usuario intenta añadir una receta
 * que ya tiene como favorita, devuelve un error de dominio claro.
 */

import favoritoRepository from '../repositories/favorito.repository';
import recetaRepository from '../repositories/receta.repository';

// Errores de dominio

export class YaEsFavoritoError extends Error {
  constructor() {
    super('Esta receta ya está en favoritos');
    this.name = 'YaEsFavoritoError';
  }
}

export class NoEsFavoritoError extends Error {
  constructor() {
    super('Esta receta no está en favoritos');
    this.name = 'NoEsFavoritoError';
  }
}

export class RecetaNoExisteError extends Error {
  constructor() {
    super('La receta no existe');
    this.name = 'RecetaNoExisteError';
  }
}

// Servicio

const favoritoService = {

  /**
   * Añade una receta a favoritos del usuario.
   * Verifica que la receta existe y que no es ya favorita.
   * RF06.
   */
  async añadir(usuario_id: number, receta_id: number) {
    const receta = await recetaRepository.findById(receta_id);
    if (!receta) throw new RecetaNoExisteError();

    const yaExiste = await favoritoRepository.existsByUsuarioYReceta(usuario_id, receta_id);
    if (yaExiste) throw new YaEsFavoritoError();

    await favoritoRepository.add(usuario_id, receta_id);
    // Devolver la receta completa para que el frontend pueda añadirla a favoritos[]
    return receta;
  },

  /**
   * Quita una receta de favoritos del usuario.
   * RF06.
   */
  async quitar(usuario_id: number, receta_id: number) {
    const yaExiste = await favoritoRepository.existsByUsuarioYReceta(usuario_id, receta_id);
    if (!yaExiste) throw new NoEsFavoritoError();

    return favoritoRepository.remove(usuario_id, receta_id);
  },

  /**
   * Lista todas las recetas favoritas del usuario con detalle completo.
   * RF06.
   */
  async listar(usuario_id: number) {
    const favoritos = await favoritoRepository.findByUsuario(usuario_id);
    return favoritos.map((f) => f.receta);
  },
};

export default favoritoService;
