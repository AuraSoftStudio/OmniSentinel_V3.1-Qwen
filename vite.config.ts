// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    // Aumentamos el límite a 1500 kB para chunks lazy-loaded
    chunkSizeWarningLimit: 1500, 
    
    rollupOptions: {
      output: {
        strictExecutionOrder: true,
        codeSplitting: {
          groups: [
            {
              name: 'react-core',
              test: /node_modules[\\/]react/,
              priority: 30,
            },
            {
              name: 'ui-vendor',
              test: /node_modules[\\/](lucide-react|comlink|zustand|uuid)/,
              priority: 20,
            },
            {
              name: 'heavy-vendor',
              test: /node_modules[\\/](@react-pdf|file-saver|papaparse)/,
              priority: 10,
            },
            {
              name: 'vendor',
              test: /node_modules/,
              priority: 5,
            },
            {
              name: 'common',
              minShareCount: 2,
              minSize: 10000,
              priority: 1,
            },
          ],
        },
      },
    },
  },
})