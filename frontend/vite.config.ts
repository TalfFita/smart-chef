import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vuetify from 'vite-plugin-vuetify';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [
    vue(),
    vuetify({ autoImport: true }),
  ],
  resolve: {
    alias: {
      // Alias @ apunta a src/ -- coherente con tsconfig.json
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    // true == 0.0.0.0: acepta conexiones desde otros dispositivos de la LAN,
    // no solo desde localhost.
    host: true,
    port: 5173,
    // Si el puerto 5173 está ocupado, falla en vez de saltar a otro puerto
    // en silencio (evita confusión sobre qué URL usar en LAN).
    strictPort: true,
    // No fijamos hmr.host: con host:true, Vite hace que el cliente de HMR
    // use automáticamente window.location.hostname para conectar el
    // WebSocket. Eso funciona tanto accediendo por "localhost" como por la
    // IP de LAN (p.ej. 192.168.1.50) sin necesidad de hardcodear nada aquí.
    // Si en tu red el WebSocket de HMR no conecta (proxy/VPN corporativa,
    // NAT raro, etc.), desactívalo explícitamente en vez de dejarlo roto:
    //   hmr: false,
    proxy: {
      // Solo se usa cuando VITE_API_URL no está definida (frontend/http.ts
      // hace entonces peticiones relativas a /api). Útil en localhost puro;
      // en modo LAN, VITE_API_URL apunta directo a la IP del backend y este
      // proxy queda sin uso.
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
