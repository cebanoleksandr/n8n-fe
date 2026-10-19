import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // .env files and the shell; the shell wins (e2e tests set BACKEND_URL).
  const env = loadEnv(mode, process.cwd(), '')
  const backend = env.BACKEND_URL || 'http://localhost:3000'

  return {
    // The path the app is served under: "/" by default, "/<repo>/" on GitHub Pages.
    base: '/n8n-fe/',
    plugins: [react(), tailwindcss()],
    server: {
      // Same origin as the app: the refresh cookie (path /api/auth) just works.
      // changeOrigin: hosts such as Render route by the Host header.
      proxy: {
        '/api': { target: backend, changeOrigin: true },
        '/socket.io': { target: backend, ws: true, changeOrigin: true },
      },
    },
  }
})
