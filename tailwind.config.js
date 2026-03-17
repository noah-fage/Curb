/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        cream: '#F9F6F0',
        'warm-white': '#FDFCFA',
        ink: '#1A1714',
        gold: '#C9994A',
        'gold-light': '#F5EDD8',
        'gold-mid': '#E8C97A',
        sage: '#5C7A65',
        'sage-light': '#EAF0EC',
      },
      fontFamily: {
        sans: ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-playfair)', 'Georgia', 'serif'],
      },
      animation: {
        blink: 'blink 0.8s step-end infinite',
        fadeIn: 'fadeIn 0.6s ease both',
        slideUp: 'slideUp 0.4s ease both',
      },
      keyframes: {
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
