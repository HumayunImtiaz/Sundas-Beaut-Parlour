import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: 'var(--color-bg)',
        gold: 'var(--color-gold)',
        'gold-light': 'var(--color-gold-light)',
        'gold-dark': 'var(--color-gold-dark)',
        cream: 'var(--color-text-light)',
        muted: 'var(--color-text-muted)'
      },
      fontFamily: {
        heading: ['var(--font-heading)'],
        body: ['var(--font-body)']
      }
    }
  },
  plugins: []
};

export default config;
