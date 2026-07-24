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
  // tsconfig.json은 jsx:"preserve"(Next.js SWC가 변환). vite(8)는 기본적으로 oxc 트랜스폼을 쓰는데
  // oxc는 tsconfig의 jsx:"preserve"를 그대로 존중해 .tsx import 파싱에 실패한다(.tsx를 import하는
  // 테스트에서만 발생). oxc를 끄고 esbuild로 되돌려 jsx:'automatic'을 명시 — vitest 한정 override이고
  // tsconfig.json 자체는 건드리지 않으므로 Next.js 빌드(SWC)에는 영향 없음.
  oxc: false,
  esbuild: {
    jsx: 'automatic',
  },
  test: {
    environment: 'node',
    fileParallelism: false,
    exclude: ['**/node_modules/**', '**/.git/**', '**/.claude/**', '**/.worktrees/**', '**/worktrees/**'],
  },
})
