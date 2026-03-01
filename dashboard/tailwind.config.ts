import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        farmacia: {
          green: '#0d9488',
          'green-dark': '#0f766e',
          'green-light': '#5eead4',
          'green-pale': '#ccfbf1',
        },
      },
    },
  },
  plugins: [],
};

export default config;
