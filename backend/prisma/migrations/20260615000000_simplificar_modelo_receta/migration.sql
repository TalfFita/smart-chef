-- Migration: simplificar_modelo_receta
-- Drops: descripcion (String), ingredientes (String[])
-- Adds:  ingredientes_texto (String) - texto libre, puramente informativo

ALTER TABLE "recetas" DROP COLUMN "descripcion";
ALTER TABLE "recetas" DROP COLUMN "ingredientes";

-- Añadir con DEFAULT '' para que las filas existentes no rompan el NOT NULL,
-- luego eliminar el default para que los nuevos inserts exijan valor explícito.
ALTER TABLE "recetas" ADD COLUMN "ingredientes_texto" TEXT NOT NULL DEFAULT '';
ALTER TABLE "recetas" ALTER COLUMN "ingredientes_texto" DROP DEFAULT;
