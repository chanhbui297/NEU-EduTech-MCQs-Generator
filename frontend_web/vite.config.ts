import { defineConfig } from 'vite'
// SỬA DÒNG NÀY: Đổi từ plugin-react-swc sang plugin-react
import react from '@vitejs/plugin-react'
import path from "path"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()], // SỬA DÒNG NÀY: Bỏ chữ swc đi (nếu có)
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: '0.0.0.0', // Để Docker hiểu
    port: 3000,
    watch: {
      usePolling: true, // Quan trọng cho Windows Docker để hot-reload
    },
    hmr: {
        overlay: false // Tắt cái màn hình báo lỗi đỏ lòm đi nếu không cần
    }
  }
})