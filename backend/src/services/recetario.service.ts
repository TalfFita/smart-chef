/**
 * recetario.service.ts -- Agregado de las 3 colecciones del recetario personal.
 *
 * Responsabilidad única: obtener en paralelo las 3 colecciones del usuario
 * y devolverlas con forma homogénea (Receta[]). No contiene lógica de negocio
 * propia; delega en los repositorios existentes.
 *
 * Colecciones:
 *   misRecetas  -- recetas cuyo autor_id coincide con el usuario (RF09)
 *   guardadas   -- recetas marcadas como favorito por el usuario (RF06)
 *   conNotas    -- recetas en las que el usuario tiene al menos una
 *                 anotación privada (RF07, sin entidad nueva)
 *
 * Decisión de arquitectura: el filtrado se realiza en backend mediante
 * este endpoint agregado en lugar de hacerlo en frontend sobre el catálogo
 * completo, para que escale con el número de recetas y respete la separación
 * de responsabilidades de la arquitectura en capas (Bloque 5 ampliado en 6.5).
 */

import recetaRepository from '../repositories/receta.repository';
import favoritoRepository from '../repositories/favorito.repository';

export async function obtenerRecetario(usuarioId: number) {
  const [misRecetas, favoritosConRelacion, conNotas] = await Promise.all([
    recetaRepository.findByAutor(usuarioId),
    favoritoRepository.findByUsuario(usuarioId),
    recetaRepository.findByUsuarioConNotas(usuarioId),
  ]);

  // findByUsuario devuelve Favorito[] con include.receta; extraemos solo la receta
  const guardadas = favoritosConRelacion.map((f) => f.receta);

  return { misRecetas, guardadas, conNotas };
}
