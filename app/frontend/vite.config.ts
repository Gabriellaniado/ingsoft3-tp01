import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:8080', changeOrigin: true },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/tests/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'json-summary', 'html'],
      // Solo entran en la cuenta los componentes que tienen tests unitarios.
      // Las páginas de admin, la API layer y el arranque (main.tsx) quedan afuera
      // porque no tienen lógica de negocio propia testeable de forma unitaria.
      include: [
        'src/pages/Login.tsx',
        'src/pages/client/BookingCalendar.tsx',
      ],
      thresholds: {
        lines: 80,
        branches: 80,
        statements: 80,
        functions: 80,
      },
    },
  },
})
