import 'dotenv/config';
import app from './app';

const PORT = Number(process.env.PORT ?? 3000);
// Bind explícito a todas las interfaces de red, no solo localhost/127.0.0.1,
// para que dispositivos de la misma LAN puedan conectarse.
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`[Smart Chef API] Servidor escuchando en http://localhost:${PORT}`);
  console.log(`[Smart Chef API] Health check: http://localhost:${PORT}/api/health`);
  // Nota: si este proceso corre dentro de Docker, os.networkInterfaces()
  // solo vería la IP interna del contenedor (p.ej. 172.x), no la IP real
  // de este PC en tu WiFi -- por eso no se imprime ninguna IP concreta aquí.
  console.log(`[Smart Chef API] Accesible en tu red local a través de la IP de este PC (no la de este contenedor), puerto ${PORT}. Consulta 'ipconfig' o el README.`);
});
