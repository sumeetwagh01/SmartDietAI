export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        canvas: 'rgb(var(--color-bg) / <alpha-value>)',
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        'surface-2': 'rgb(var(--color-surface-2) / <alpha-value>)',
        line: 'rgb(var(--color-border) / <alpha-value>)',
        ink: 'rgb(var(--color-text) / <alpha-value>)',
        muted: 'rgb(var(--color-muted) / <alpha-value>)',
        accent: '#D9EC7D',
        'accent-ink': '#101010',
        water: '#4FB3E8', protein: '#6AA9FF', carbs: '#F5B84B', fat: '#F0806A', fibre: '#6FD08C', error: '#FF6B6B',
        brand: { green: '#D9EC7D', blue: '#6AA9FF', amber: '#F5B84B', coral: '#F0806A' },
      },
      borderRadius: { card: '24px' },
      boxShadow: { soft: '0 12px 40px rgb(0 0 0 / 0.08)' },
    },
  },
  plugins: [],
}
