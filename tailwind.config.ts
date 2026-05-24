import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: {
          DEFAULT: '#fdfcf0',
          deep: '#f5f4e8',
          dim: '#e9e9dd'
        },
        navy: {
          DEFAULT: '#001f3f',
          deep: '#000613',
          soft: '#2f486a'
        },
        tangerine: {
          DEFAULT: '#ff8200',
          deep: '#c46200',
          light: '#ffb785'
        },
        ink: '#1b1c15',
        muted: '#43474e',
        live: '#ff3838'
      },
      fontFamily: {
        display: ['var(--font-source-serif)', 'Georgia', 'serif'],
        sans: ['var(--font-archivo)', 'system-ui', 'sans-serif']
      },
      letterSpacing: {
        wider2: '0.08em',
        widest2: '0.16em',
        widest3: '0.24em'
      },
      boxShadow: {
        // Solid offset shadow (broadcast "hard stack")
        offsetNavy: '8px 8px 0 0 #001f3f',
        offsetTangerine: '8px 8px 0 0 #ff8200',
        offsetSm: '4px 4px 0 0 #001f3f'
      },
      keyframes: {
        tickerScroll: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' }
        },
        livePulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.3' }
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        }
      },
      animation: {
        ticker: 'tickerScroll 30s linear infinite',
        livePulse: 'livePulse 1s ease-in-out infinite',
        slideUp: 'slideUp 0.6s ease-out'
      }
    }
  },
  safelist: [
    'bg-tangerine', 'bg-navy', 'bg-cream', 'bg-live',
    'text-tangerine', 'text-navy', 'text-cream', 'text-live',
    'border-tangerine', 'border-navy',
    'shadow-offsetNavy', 'shadow-offsetTangerine'
  ],
  plugins: []
};

export default config;
