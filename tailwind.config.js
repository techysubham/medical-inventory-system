/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        glass: {
          50: 'rgba(255, 255, 255, 0.95)',
          100: 'rgba(255, 255, 255, 0.9)',
          200: 'rgba(255, 255, 255, 0.8)',
        },
      },
      backgroundImage: {
        'gradient-glossy': 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 100%)',
        'gradient-modern': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'gradient-medical': 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)',
        'gradient-success': 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        'gradient-warning': 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        'gradient-danger': 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glossy-sm': '0 4px 6px rgba(0, 0, 0, 0.07), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
        'glossy': '0 20px 25px -5px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
        'glossy-lg': '0 25px 50px -12px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
        'neon-blue': '0 0 20px rgba(14, 165, 233, 0.3), 0 0 40px rgba(6, 182, 212, 0.2)',
        'neon-purple': '0 0 20px rgba(102, 126, 234, 0.3), 0 0 40px rgba(118, 75, 162, 0.2)',
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(14, 165, 233, 0.5)' },
          '50%': { boxShadow: '0 0 30px rgba(6, 182, 212, 0.6)' },
        },
      },
    },
  },
  plugins: [],
};
