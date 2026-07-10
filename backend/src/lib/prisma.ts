/**
 * prisma.ts -- Cliente Prisma singleton
 *
 * Exporta una única instancia de PrismaClient reutilizada por todos
 * los repositorios. Evita abrir múltiples conexiones a la base de datos.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default prisma;
