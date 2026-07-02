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
        // Driven by CSS variables (see globals.css) so the whole app remaps
        // under `.dark`. Channels are space-separated RGB with <alpha-value>
        // so opacity modifiers (bg-maison-cream/80) keep working.
        maison: {
          cream: 'rgb(var(--m-cream) / <alpha-value>)', // page background
          panel: 'rgb(var(--m-panel) / <alpha-value>)', // raised tint
          ink: 'rgb(var(--m-ink) / <alpha-value>)', // primary text / dark surfaces
          clay: 'rgb(var(--m-clay) / <alpha-value>)', // terracotta accent
          'clay-dark': 'rgb(var(--m-clay-dark) / <alpha-value>)', // accent on light, eyebrows
          line: 'rgb(var(--m-line) / <alpha-value>)', // hairline borders
          'line-strong': 'rgb(var(--m-line-strong) / <alpha-value>)', // input borders
          stone: 'rgb(var(--m-stone) / <alpha-value>)', // muted dividers / disabled
          muted: 'rgb(var(--m-muted) / <alpha-value>)', // body copy
          subtle: 'rgb(var(--m-subtle) / <alpha-value>)', // secondary copy
          faint: 'rgb(var(--m-faint) / <alpha-value>)', // tertiary copy / icons
          leaf: 'rgb(var(--m-leaf) / <alpha-value>)', // success / in-stock
          'leaf-soft': 'rgb(var(--m-leaf-soft) / <alpha-value>)', // success surface
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
        'grow-bar': {
          from: { transform: 'scaleY(0)' },
          to: { transform: 'scaleY(1)' },
        },
        'drawer-in': {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
        'drawer-out': {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(100%)' },
        },
        'fade-out': {
          from: { opacity: '1' },
          to: { opacity: '0' },
        },
        'modal-in': {
          from: { opacity: '0', transform: 'translateY(26px) scale(.97)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'auth-reveal': {
          from: { opacity: '0', transform: 'translateY(14px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        sheen: {
          '0%': { transform: 'translateX(-120%) skewX(-18deg)' },
          '100%': { transform: 'translateX(240%) skewX(-18deg)' },
        },
        'drift-slow': {
          '0%,100%': { transform: 'translate(0,0) scale(1)' },
          '50%': { transform: 'translate(16px,-22px) scale(1.08)' },
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
        'grow-bar': 'grow-bar 0.8s cubic-bezier(.16,.84,.44,1) both',
        'drawer-in': 'drawer-in 0.4s cubic-bezier(.16,.84,.44,1) both',
        'drawer-out': 'drawer-out 0.3s cubic-bezier(.4,0,.7,.2) both',
        'fade-out': 'fade-out 0.3s ease both',
        'modal-in': 'modal-in 0.4s cubic-bezier(.16,.84,.44,1) both',
        'fade-in': 'fade-in 0.25s ease both',
        'auth-reveal': 'auth-reveal 0.6s cubic-bezier(.16,.84,.44,1) both',
        sheen: 'sheen 0.9s cubic-bezier(.16,.84,.44,1)',
        'drift-slow': 'drift-slow 12s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
