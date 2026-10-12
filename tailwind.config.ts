import type { Config } from 'tailwindcss'
import typography from '@tailwindcss/typography'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT:     'var(--color-bg)',
          secondary:   'var(--color-bg-secondary)',
          translucent: 'var(--color-bg-translucent)',
        },
        surface: 'var(--color-surface)',
        border: 'var(--color-border)',
        'text-primary':   'var(--color-text-primary)',
        'text-soft':      'var(--color-text-soft)',
        'text-secondary': 'var(--color-text-secondary)',
        'text-muted':     'var(--color-text-muted)',
        accent: {
          DEFAULT: 'var(--color-accent)',
          hover:   'var(--color-accent-hover)',
          soft:    'var(--color-accent-soft)',
        },
      },
      // 본문 글꼴을 400·600만 받으므로(app/layout.tsx) 500은 600으로 맞춘다 — 안 그러면 400으로 내려가 강조가 사라진다
      fontWeight: {
        medium: '600',
      },
      fontFamily: {
        sans: ['"IBM Plex Sans KR"', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      maxWidth: {
        content: '1280px',
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
          },
        },
      },
    },
  },
  plugins: [typography],
}

export default config
