import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // Relative asset URLs let Electron load dist/index.html directly via file://.
  base: './',
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
  },
})
