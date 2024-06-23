import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
const config = loadEnv('development', './')
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  css: {
    preprocessorOptions: {
      less: {
        javascriptEnabled: true,
      }
    }
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    cors: true,
    proxy: {
      "/api": {
        target: config.VITE_BASE_URL,
        changeOrigin: true, //是否跨域
        rewrite: (path) => path.replace(/^\/api/, ""),
        // ws: true,                       //是否代理 websockets
        // secure: true, //是否https接口
      },
    }
  }
})
