import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  // 监听0.0.0.0
  // 基础路径 mark-canvas-demo/
  base: '/mark-canvas-demo/',
  // 打包文件夹
  build: {
    outDir: 'docs'
  },
  server: {
    host: '0.0.0.0'
  }
})
