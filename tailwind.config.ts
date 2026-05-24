import type { Config } from 'tailwindcss';

/**
 * Prompt Clash design tokens.
 * Primary: etkin kampüs deep violet #541fc4 + custom scale.
 * Font: Poppins (single family, weights for hierarchy).
 * DNA: Premium Airy Minimalism with violet tinted shadow + asymmetric composition.
 */
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#541fc4',
          50: '#f5f0ff',
          100: '#ebe1ff',
          200: '#d4c0ff',
          300: '#b89cff',
          400: '#9c75ff',
          500: '#7c4dff',
          600: '#541fc4',
          700: '#4118a3',
          800: '#311380',
          900: '#220c5e',
          fixed: '#541fc4',
        },
        surface: {
          DEFAULT: '#ffffff',
          low: '#faf7ff',
          container: '#f3edff',
          warm: '#fafafa',
        },
        ink: {
          DEFAULT: '#1f1633',
          variant: '#6b5e85',
          light: '#a89db8',
          inverse: '#fafafa',
        },
        border: {
          DEFAULT: '#e8e0f4',
        },
        danger: '#ef4444',
        success: '#22c55e',
        live: '#ff3838',
      },
      fontFamily: {
        display: ['var(--font-poppins)', 'system-ui', 'sans-serif'],
        body: ['var(--font-poppins)', 'system-ui', 'sans-serif'],
        sans: ['var(--font-poppins)', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display-2xl': ['72px', { lineHeight: '1.0', letterSpacing: '-0.03em', fontWeight: '800' }],
        'display-xl': ['56px', { lineHeight: '1.05', letterSpacing: '-0.025em', fontWeight: '800' }],
        'display-lg': ['44px', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '700' }],
        'headline-xl': ['32px', { lineHeight: '40px', letterSpacing: '-0.02em', fontWeight: '700' }],
        'headline-lg': ['24px', { lineHeight: '32px', letterSpacing: '-0.015em', fontWeight: '600' }],
        'body-lg': ['18px', { lineHeight: '28px', fontWeight: '400' }],
        'body-md': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'label-sm': ['13px', { lineHeight: '18px', letterSpacing: '0.04em', fontWeight: '600' }],
        'label-xs': ['11px', { lineHeight: '14px', letterSpacing: '0.08em', fontWeight: '600' }],
      },
      borderRadius: {
        sm: '0.25rem',
        DEFAULT: '0.5rem',
        md: '0.75rem',
        lg: '1rem',
        xl: '1.5rem',
        '2xl': '2rem',
      },
      boxShadow: {
        signature: '0 10px 30px rgba(84, 31, 196, 0.10)',
        card: '0 1px 2px rgba(84, 31, 196, 0.04), 0 12px 32px rgba(84, 31, 196, 0.08), 0 32px 64px rgba(84, 31, 196, 0.06)',
        cardLg: '0 2px 4px rgba(84, 31, 196, 0.06), 0 16px 40px rgba(84, 31, 196, 0.10), 0 48px 96px rgba(84, 31, 196, 0.08)',
        cta: '0 1px 2px rgba(84, 31, 196, 0.20), 0 12px 32px rgba(84, 31, 196, 0.24)',
        ctaActive: '0 1px 2px rgba(84, 31, 196, 0.30), 0 6px 16px rgba(84, 31, 196, 0.32)',
        inner: 'inset 0 1px 2px rgba(84, 31, 196, 0.08)',
      },
      spacing: {
        'stack-sm': '12px',
        'stack-md': '24px',
        'stack-lg': '48px',
        'stack-xl': '96px',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(12px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
        livePulse: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.6', transform: 'scale(1.06)' },
        },
        spinSlow: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        scoreBump: {
          '0%': { transform: 'scale(1)' },
          '40%': { transform: 'scale(1.18)' },
          '100%': { transform: 'scale(1)' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 240ms ease-out both',
        slideUp: 'slideUp 240ms cubic-bezier(0.16, 1, 0.3, 1) both',
        shimmer: 'shimmer 1600ms ease-in-out infinite',
        pulse: 'pulse 1800ms ease-in-out infinite',
        livePulse: 'livePulse 1400ms ease-in-out infinite',
        spinSlow: 'spinSlow 4s linear infinite',
        scoreBump: 'scoreBump 480ms cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      letterSpacing: {
        tighter2: '-0.03em',
        wider2: '0.04em',
        widest2: '0.08em',
        widest3: '0.16em',
      },
    },
  },
  safelist: [
    'bg-primary', 'bg-primary-50', 'bg-primary-100', 'bg-primary-600', 'bg-primary-700',
    'text-primary', 'text-primary-700', 'text-ink', 'text-ink-variant', 'text-ink-light',
    'border-primary', 'border-border',
    'shadow-signature', 'shadow-card', 'shadow-cta',
    'animate-livePulse', 'animate-shimmer', 'animate-scoreBump',
  ],
  plugins: [],
};

export default config;
