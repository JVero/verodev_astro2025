/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}",
  ],
  theme: {
    extend: {
      colors: {
        'data-blue': '#3b82f6',
        'data-cyan': '#06b6d4',
        'data-green': '#10b981',
        'data-orange': '#f59e0b',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out',
        'fade-in-slow': 'fadeIn 1s ease-out',
        'slide-up': 'slideUp 0.6s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}

