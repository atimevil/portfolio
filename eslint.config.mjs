import nextVitals from 'eslint-config-next/core-web-vitals'

// Next 16에서 `next lint`가 없어져 ESLint 9 flat config로 옮겼다(예전 .eslintrc.json과 같은 규칙).
const config = [
  ...nextVitals,
  {
    rules: {
      '@next/next/no-img-element': 'off',
    },
  },
  {
    ignores: ['.next/**', 'node_modules/**', 'public/**', 'next-env.d.ts', 'coverage/**'],
  },
]

export default config
