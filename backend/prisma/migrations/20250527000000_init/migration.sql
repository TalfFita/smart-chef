-- CreateEnum
CREATE TYPE "CategoriaMenu" AS ENUM ('ENTRANTE', 'PRINCIPAL', 'POSTRE', 'APERITIVO');

-- CreateEnum
CREATE TYPE "EstiloCulinario" AS ENUM ('MEDITERRANEO', 'LATINO', 'ASIATICO', 'NORDICO', 'FUSION');

-- CreateEnum
CREATE TYPE "ModoPreparacion" AS ENUM ('TRADICIONAL', 'PROFESIONAL');

-- CreateEnum
CREATE TYPE "Dificultad" AS ENUM ('FACIL', 'MEDIA', 'DIFICIL');

-- CreateEnum
CREATE TYPE "TipoBloque" AS ENUM ('PREPARAR', 'ELABORAR', 'COCINAR', 'ESPERAR', 'FIN');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recetas" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "categoria_menu" "CategoriaMenu" NOT NULL,
    "estilo_culinario" "EstiloCulinario" NOT NULL,
    "modo_preparacion" "ModoPreparacion" NOT NULL,
    "dificultad" "Dificultad" NOT NULL,
    "tiempo_preparacion" INTEGER NOT NULL,
    "ingredientes" TEXT[],
    "tags" TEXT[],
    "autor_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recetas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bloques_receta" (
    "id" SERIAL NOT NULL,
    "receta_id" INTEGER NOT NULL,
    "tipo_bloque" "TipoBloque" NOT NULL,
    "orden" INTEGER NOT NULL,
    "contenido" TEXT NOT NULL,
    "tiempo_estimado" INTEGER,

    CONSTRAINT "bloques_receta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anotaciones_estilo" (
    "id" SERIAL NOT NULL,
    "receta_id" INTEGER NOT NULL,
    "bloque_id" INTEGER,
    "palabra_clave" TEXT NOT NULL,
    "explicacion" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "anotaciones_estilo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anotaciones_privadas" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "receta_id" INTEGER NOT NULL,
    "contenido" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "anotaciones_privadas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "favoritos" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "receta_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favoritos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "favoritos_usuario_id_receta_id_key" ON "favoritos"("usuario_id", "receta_id");

-- AddForeignKey
ALTER TABLE "recetas" ADD CONSTRAINT "recetas_autor_id_fkey" FOREIGN KEY ("autor_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bloques_receta" ADD CONSTRAINT "bloques_receta_receta_id_fkey" FOREIGN KEY ("receta_id") REFERENCES "recetas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anotaciones_estilo" ADD CONSTRAINT "anotaciones_estilo_receta_id_fkey" FOREIGN KEY ("receta_id") REFERENCES "recetas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anotaciones_estilo" ADD CONSTRAINT "anotaciones_estilo_bloque_id_fkey" FOREIGN KEY ("bloque_id") REFERENCES "bloques_receta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anotaciones_privadas" ADD CONSTRAINT "anotaciones_privadas_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anotaciones_privadas" ADD CONSTRAINT "anotaciones_privadas_receta_id_fkey" FOREIGN KEY ("receta_id") REFERENCES "recetas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favoritos" ADD CONSTRAINT "favoritos_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favoritos" ADD CONSTRAINT "favoritos_receta_id_fkey" FOREIGN KEY ("receta_id") REFERENCES "recetas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

