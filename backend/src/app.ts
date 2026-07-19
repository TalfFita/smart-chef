import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';

const app = express();

// CORS

/**
 * Whitelist explícita de orígenes permitidos, vía variable de entorno
 * (lista separada por comas). Por defecto solo el frontend en localhost.
 */
const origenesPermitidos = (process.env.CORS_ORIGIN ?? 'http://localhost:5173')
  .split(',')
  .map((origen) => origen.trim())
  .filter(Boolean);

/**
 * Rangos de IP privada (RFC 1918) con puerto opcional, sobre HTTP o HTTPS.
 * Permite que, en desarrollo, cualquier dispositivo de la LAN (p.ej.
 * 192.168.1.50:5173) que acceda al frontend pueda llamar a esta API sin
 * tener que hardcodear cada IP en CORS_ORIGIN.
 */
const RED_PRIVADA_REGEX =
  /^https?:\/\/(10(?:\.\d{1,3}){3}|172\.(?:1[6-9]|2\d|3[01])(?:\.\d{1,3}){2}|192\.168(?:\.\d{1,3}){2})(:\d+)?$/;

function origenPermitido(origen: string): boolean {
  if (origenesPermitidos.includes(origen)) return true;
  // Solo se relaja a rangos de LAN fuera de producción: en producción la
  // whitelist de CORS_ORIGIN debe ser exhaustiva.
  if (process.env.NODE_ENV !== 'production' && RED_PRIVADA_REGEX.test(origen)) {
    return true;
  }
  return false;
}

app.use(
  cors({
    origin(origen, callback) {
      // Sin header Origin (curl, health checks, server-to-server): permitir.
      if (!origen || origenPermitido(origen)) {
        callback(null, true);
        return;
      }
      callback(new Error(`Origen no permitido por CORS: ${origen}`));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    // No usamos cookies de sesión (JWT va por header Authorization), así
    // que no necesitamos credentials:true ni Secure/SameSite.
    credentials: false,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    entorno: process.env.NODE_ENV ?? 'development',
  });
});

// Rutas
import authRoutes from './routes/auth.routes';
import recetaRoutes from './routes/receta.routes';
import recomendacionRoutes from './routes/recomendacion.routes';
import favoritoRoutes from './routes/favorito.routes';
import anotacionRoutes from './routes/anotacion.routes';
import historialRoutes from './routes/historial.routes';
import usuarioRoutes from './routes/usuario.routes';

const API_PREFIX = '/api';

app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/recetas`, recetaRoutes);
app.use(`${API_PREFIX}/recomendacion`, recomendacionRoutes);
app.use(`${API_PREFIX}/favoritos`, favoritoRoutes);
app.use(`${API_PREFIX}/anotaciones`, anotacionRoutes);
app.use(`${API_PREFIX}/historial`, historialRoutes);
app.use(`${API_PREFIX}/usuarios`, usuarioRoutes);

// Manejador de rutas no encontradas
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Manejador de errores global
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Error interno del servidor' });
});

export default app;
