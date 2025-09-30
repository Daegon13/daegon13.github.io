// Tailwind: tokens básicos sobrios (neutros + acento)
import defaultTheme from 'tailwindcss/defaultTheme';

export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#2563EB', // azul sobrio
          dark: '#1E40AF'
        }
      },
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans]
      },
      boxShadow: {
        soft: '0 6px 30px -12px rgba(0,0,0,0.25)'
      }
    }
  },
  plugins: []
};
