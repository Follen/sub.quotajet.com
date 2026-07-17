/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: 'oklch(var(--qj-primary-50) / <alpha-value>)',
          100: 'oklch(var(--qj-primary-100) / <alpha-value>)',
          200: 'oklch(var(--qj-primary-200) / <alpha-value>)',
          300: 'oklch(var(--qj-primary-300) / <alpha-value>)',
          400: 'oklch(var(--qj-primary-400) / <alpha-value>)',
          500: 'oklch(var(--qj-primary-500) / <alpha-value>)',
          600: 'oklch(var(--qj-primary-600) / <alpha-value>)',
          700: 'oklch(var(--qj-primary-700) / <alpha-value>)',
          800: 'oklch(var(--qj-primary-800) / <alpha-value>)',
          900: 'oklch(var(--qj-primary-900) / <alpha-value>)',
          950: 'oklch(var(--qj-primary-950) / <alpha-value>)'
        },
        // 辅助色 - 深蓝灰
        accent: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: 'oklch(0.285 0 0)',
          900: 'oklch(0.235 0 0)',
          950: 'oklch(0.225 0 0)'
        },
        dark: {
          50: 'oklch(0.985 0 0 / <alpha-value>)',
          100: 'oklch(0.965 0 0 / <alpha-value>)',
          200: 'oklch(0.9 0 0 / <alpha-value>)',
          300: 'oklch(0.78 0 0 / <alpha-value>)',
          400: 'oklch(0.68 0 0 / <alpha-value>)',
          500: 'oklch(0.365 0 0 / <alpha-value>)',
          600: 'oklch(0.335 0 0 / <alpha-value>)',
          700: 'oklch(0.305 0 0 / <alpha-value>)',
          800: 'oklch(0.285 0 0 / <alpha-value>)',
          900: 'oklch(0.235 0 0 / <alpha-value>)',
          950: 'oklch(0.225 0 0 / <alpha-value>)'
        },
        surface: {
          canvas: 'oklch(var(--qj-surface-canvas) / <alpha-value>)',
          sidebar: 'oklch(var(--qj-surface-sidebar) / <alpha-value>)',
          card: 'oklch(var(--qj-surface-card) / <alpha-value>)',
          popover: 'oklch(var(--qj-surface-popover) / <alpha-value>)',
          accent: 'oklch(var(--qj-surface-accent) / <alpha-value>)'
        },
        content: {
          muted: 'oklch(var(--qj-content-muted) / <alpha-value>)'
        }
      },
      fontFamily: {
        sans: [
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'PingFang SC',
          'Hiragino Sans GB',
          'Microsoft YaHei',
          'sans-serif'
        ],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace']
      },
      boxShadow: {
        glass: '0 8px 32px rgba(0, 0, 0, 0.08)',
        'glass-sm': '0 4px 16px rgba(0, 0, 0, 0.06)',
        glow: '0 0 20px rgba(20, 184, 166, 0.25)',
        'glow-lg': '0 0 40px rgba(20, 184, 166, 0.35)',
        card: '0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 10px 40px rgba(0, 0, 0, 0.08)',
        'inner-glow': 'inset 0 1px 0 rgba(255, 255, 255, 0.1)'
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-primary': 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
        'gradient-dark': 'linear-gradient(135deg, oklch(0.285 0 0) 0%, oklch(0.235 0 0) 100%)',
        'gradient-glass':
          'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
        'mesh-gradient':
          'radial-gradient(at 40% 20%, rgba(20, 184, 166, 0.12) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(6, 182, 212, 0.08) 0px, transparent 50%), radial-gradient(at 0% 50%, rgba(20, 184, 166, 0.08) 0px, transparent 50%)'
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        shimmer: 'shimmer 2s linear infinite',
        glow: 'glow 2s ease-in-out infinite alternate'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' }
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' }
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' }
        },
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(20, 184, 166, 0.25)' },
          '100%': { boxShadow: '0 0 30px rgba(20, 184, 166, 0.4)' }
        }
      },
      backdropBlur: {
        xs: '2px'
      },
      borderRadius: {
        '4xl': '2rem'
      }
    }
  },
  plugins: []
}
