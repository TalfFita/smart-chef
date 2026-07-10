-- CreateTable
CREATE TABLE "historial_cocina" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "receta_id" INTEGER NOT NULL,
    "cocinado_el" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historial_cocina_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "historial_cocina" ADD CONSTRAINT "historial_cocina_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial_cocina" ADD CONSTRAINT "historial_cocina_receta_id_fkey" FOREIGN KEY ("receta_id") REFERENCES "recetas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
