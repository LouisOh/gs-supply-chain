import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background:  '#0B0E11',
        surface:     '#13171D',
        overlay:     '#1A1F28',
        border:      '#242B36',
        muted:       '#2E3748',
        amber: {
          DEFAULT: '#F59E0B',
          light:   '#FCD34D',
          dark:    '#B45309',
        },
        'electric-blue': {
          DEFAULT: '#3B82F6',
          light:   '#60A5FA',
          dark:    '#1D4ED8',
        },
        'text-primary':   '#F1F5F9',
        'text-secondary': '#94A3B8',
        'text-muted':     '#475569',
      },
      fontFamily: {
        sans: ['IBM Plex Sans', 'system-ui', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
      boxShadow: {
        'glow-amber': '0 0 20px rgba(245,158,11,0.25), 0 0 40px rgba(245,158,11,0.10)',
        'glow-blue':  '0 0 20px rgba(59,130,246,0.25),  0 0 40px rgba(59,130,246,0.10)',
        'card':       '0 4px 24px rgba(0,0,0,0.40), 0 1px 0 rgba(255,255,255,0.04) inset',
      },
      animation: {
        'fade-in':  'fadeIn 0.3s ease both',
        'slide-up': 'slideUp 0.4s ease both',
      },
      keyframes: {
        fadeIn:  { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to:   { opacity: '1', transform: 'none' },
        },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
