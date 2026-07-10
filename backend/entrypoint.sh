#!/bin/sh
set -e

echo "Generando Prisma Client para Linux..."
npx prisma generate

echo "Aplicando migraciones Prisma..."
npx prisma migrate deploy

echo "Ejecutando seed..."
npx ts-node --transpile-only prisma/seed.ts

echo "Arrancando servidor..."
exec npm run dev
