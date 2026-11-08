import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // 自分のパソコン（127.0.0.1）からだけ開けるようにする
    host: '127.0.0.1',
    port: 5173,
    // 5173 が使われていたら、別の番号で起動せずに止める（サーバーの CORS で許可するのは 5173 だけのため）
    strictPort: true,
  },
})
