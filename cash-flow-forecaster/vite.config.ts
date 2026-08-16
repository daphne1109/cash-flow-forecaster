import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    // Keep domain tests outside src so the production bundle never includes
    // test-only files.
    include: ['tests/**/*.test.ts'],
  },
})
