import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        // ── Maison storefront palette ──
        maison: {
          cream: '#FAF6F0', // page background
          panel: '#FBF7F1', // raised tint
          ink: '#211C16', // primary text / dark surfaces
          clay: '#C75B39', // terracotta accent
          'clay-dark': '#A8492C', // accent on light, eyebrows
          line: '#EBE3D7', // hairline borders
          'line-strong': '#E3DACB', // input borders
          stone: '#D8CDBE', // muted dividers / disabled
          muted: '#5C5347', // body copy
          subtle: '#8A8073', // secondary copy
          faint: '#A89C8B', // tertiary copy / icons
          leaf: '#3F7A52', // success / in-stock
          'leaf-soft': '#EAF3EA', // success surface
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'Hanken Grotesk', 'sans-serif'],
        serif: ['var(--font-serif)', 'Instrument Serif', 'Georgia', 'serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'page-in': {
          from: { opacity: '0', transform: 'translateY(18px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        pop: {
          '0%': { transform: 'scale(1)' },
          '40%': { transform: 'scale(1.5)' },
          '100%': { transform: 'scale(1)' },
        },
        'toast-in': {
          from: { opacity: '0', transform: 'translate(-50%, 24px)' },
          to: { opacity: '1', transform: 'translate(-50%, 0)' },
        },
        'ring-scale': {
          from: { transform: 'scale(.5)', opacity: '0' },
          to: { transform: 'scale(1)', opacity: '1' },
        },
        floaty: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'page-in': 'page-in 0.5s cubic-bezier(.16,.84,.44,1) both',
        pop: 'pop 0.42s ease',
        'toast-in': 'toast-in 0.35s cubic-bezier(.16,.84,.44,1) both',
        'ring-scale': 'ring-scale 0.5s cubic-bezier(.16,.84,.44,1) both',
        floaty: 'floaty 7s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
