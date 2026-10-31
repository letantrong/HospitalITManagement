import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true, // Cho phép truy cập qua localhost, 127.0.0.1 và IP mạng LAN
    strictPort: false, // Nếu cổng 3000 bận, Vite sẽ tự động thử cổng kế tiếp (3001, 3002...)
    open: false,
  },
});
