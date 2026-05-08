/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          dark: '#7C4DFF',
          light: '#1A1A2E',
          DEFAULT: '#7C4DFF',
        },
        neon: {
          green: '#A8FF3E',
          purple: '#7C4DFF',
        },
        surface: {
          DEFAULT: '#12121E',
          raised: '#1A1A2E',
          elevated: '#222238',
        },
        accent: {
          peach: '#FFD4C8',
          coral: '#FF9B9B',
          green: '#A8FF3E',
        },
        text: {
          dark: '#FFFFFF',
          muted: '#8B8BA7',
          dim: '#5A5A7A',
        },
        border: {
          light: '#2A2A40',
        },
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Space Grotesk', 'DM Sans', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        soft: '0 2px 16px 0 rgba(124, 77, 255, 0.15)',
        card: '0 4px 24px 0 rgba(0, 0, 0, 0.5)',
        float: '0 8px 40px 0 rgba(124, 77, 255, 0.35)',
        neon: '0 0 20px rgba(168, 255, 62, 0.4)',
        glow: '0 0 30px rgba(124, 77, 255, 0.4)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(20px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        scaleIn: { from: { opacity: '0', transform: 'scale(0.95)' }, to: { opacity: '1', transform: 'scale(1)' } },
      },
    },
  },
  plugins: [],
}
