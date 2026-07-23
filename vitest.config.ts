import { defineConfig } from 'vitest/config'
import path from 'path'
import { config as loadEnv } from 'dotenv'

loadEnv({ path: '.env.test' })

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
  test: {
    environment: 'node',
    fileParallelism: false,
  },
})
