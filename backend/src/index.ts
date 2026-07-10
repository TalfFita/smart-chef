import 'dotenv/config';
import app from './app';

const PORT = process.env.PORT ?? 3000;

app.listen(PORT, () => {
  console.log(`[Smart Chef API] Servidor escuchando en http://localhost:${PORT}`);
  console.log(`[Smart Chef API] Health check: http://localhost:${PORT}/api/health`);
});
