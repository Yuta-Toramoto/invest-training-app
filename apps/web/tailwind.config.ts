import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-nunito)', 'Nunito', 'sans-serif'],
      },
      colors: {
        brand: {
          green: 'var(--green-500)',
          red: 'var(--red-500)',
          blue: 'var(--blue-500)',
          yellow: 'var(--yellow-500)',
        },
      },
    },
  },
  plugins: [animate],
};

export default config;
