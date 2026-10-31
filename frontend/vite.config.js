import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  if (mode === 'production') {
    let apiUrl
    try {
      apiUrl = new URL(env.VITE_API_URL?.trim())
    } catch {
      throw new Error('VITE_API_URL must be a valid HTTPS URL ending in /api')
    }
    if (
      apiUrl.protocol !== 'https:' ||
      apiUrl.username ||
      apiUrl.password ||
      apiUrl.search ||
      apiUrl.hash ||
      !apiUrl.pathname.replace(/\/+$/, '').endsWith('/api')
    ) {
      throw new Error('VITE_API_URL must be a valid HTTPS URL ending in /api')
    }

    if (env.VITE_SOCKET_URL?.trim()) {
      let socketUrl
      try {
        socketUrl = new URL(env.VITE_SOCKET_URL.trim())
      } catch {
        throw new Error('VITE_SOCKET_URL must be a valid HTTPS origin')
      }
      if (
        socketUrl.protocol !== 'https:' ||
        socketUrl.username ||
        socketUrl.password ||
        socketUrl.pathname !== '/' ||
        socketUrl.search ||
        socketUrl.hash
      ) {
        throw new Error('VITE_SOCKET_URL must be a valid HTTPS origin')
      }
    }
  }

  return {
    plugins: [react(), tailwindcss()],
  }
})
