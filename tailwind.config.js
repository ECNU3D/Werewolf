/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      screens: {
        'xs': '475px',
      },
      fontFamily: {
        'cinzel': ['Cinzel', 'serif'],
        'creepster': ['Creepster', 'cursive'],
        'nosifer': ['Nosifer', 'cursive'],
      },
      colors: {
        werewolf: {
          primary: '#8B1538',
          secondary: '#2D1B69',
        },
        villager: {
          primary: '#1E40AF',
        },
      },
      animation: {
        'moon-glow': 'moonGlow 3s ease-in-out infinite',
        'blood-pulse': 'bloodPulse 1.5s ease-in-out infinite',
        'ghost-float': 'ghostFloat 4s ease-in-out infinite',
        'shimmer': 'shimmer 3s ease-in-out infinite',
      },
      keyframes: {
        moonGlow: {
          '0%, 100%': { 
            boxShadow: '0 0 20px rgba(226, 232, 240, 0.3), 0 0 40px rgba(226, 232, 240, 0.2), 0 0 60px rgba(226, 232, 240, 0.1)',
          },
          '50%': { 
            boxShadow: '0 0 30px rgba(226, 232, 240, 0.5), 0 0 60px rgba(226, 232, 240, 0.3), 0 0 90px rgba(226, 232, 240, 0.2)',
          },
        },
        bloodPulse: {
          '0%, 100%': { 
            backgroundColor: 'rgba(220, 38, 38, 0.8)',
            transform: 'scale(1)',
          },
          '50%': { 
            backgroundColor: 'rgba(220, 38, 38, 1)',
            transform: 'scale(1.02)',
          },
        },
        ghostFloat: {
          '0%, 100%': {
            transform: 'translateY(0px)',
            opacity: '0.7',
          },
          '50%': {
            transform: 'translateY(-10px)',
            opacity: '0.9',
          },
        },
        shimmer: {
          '0%': {
            backgroundPosition: '-200% 0',
          },
          '100%': {
            backgroundPosition: '200% 0',
          },
        },
      },
    },
  },
  plugins: [],
} 