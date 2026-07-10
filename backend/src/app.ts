import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';

const app = express();

// Middlewares globales
app.use(cors({ origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173' }));
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
