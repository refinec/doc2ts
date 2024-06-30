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
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return id.toString().split('node_modules/')[1].split('/')[0].toString();
          }
        },
        // 用于命名代码拆分时创建的共享块的输出命名
        chunkFileNames: "assets/js/[name]-[hash].js",
        // 用于从入口点创建的块的打包输出格式[name]表示文件名,[hash]表示该文件内容hash值
        entryFileNames: "assets/js/[name]-[hash].js",
        // 用于输出静态资源的命名放到dist中的static文件夹下，[ext]表示文件扩展名
        assetFileNames: "assets/[ext]/[name]-[hash].[ext]"
      }
    }
  },
  server: {
    cors: true,
    proxy: {
      "/yapi": {
        target: config.VITE_YAPI_BASE_URL,
        changeOrigin: true, //是否跨域
        rewrite: (path) => path.replace(/^\/yapi/, ""),
        // ws: true,                       //是否代理 websockets
        // secure: true, //是否https接口
      },
    }
  }
})
