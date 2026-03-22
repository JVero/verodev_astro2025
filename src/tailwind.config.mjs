/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}",
  ],
  theme: {
    extend: {
      colors: {
        'vero-bg': '#F0EDE8',
        'vero-card': '#FDFCFA',
        'vero-border': '#EBE8E3',
        'vero-border-med': '#DDD9D2',
        'vero-text': '#1A1816',
        'vero-text-mid': '#5C5852',
        'vero-text-muted': '#A8A39C',
        'vero-accent': '#9C4430',
        'vero-accent-hover': '#7A3526',
      },
      fontFamily: {
        'serif': ['"Newsreader"', 'ui-serif', 'Georgia', 'Cambria', 'serif'],
        'sans': ['-apple-system', 'system-ui', '"Segoe UI"', 'sans-serif'],
      },
      boxShadow: {
        'warm': '0 1px 2px rgba(120,110,100,0.04)',
        'warm-hover': '0 2px 8px rgba(120,110,100,0.06)',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out both',
        'fade-in-slow': 'fadeIn 1s ease-out both',
        'slide-up': 'viewShift 0.5s ease-out both',
        'slide-up-delayed': 'viewShift 0.5s ease-out 0.1s both',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        viewShift: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
