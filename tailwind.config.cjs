/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                sonexa: {
                    primary: 'var(--color-primary)',
                    secondary: 'var(--color-secondary)',
                    // Semantic tokens
                    bg: 'var(--color-bg)',
                    text: 'var(--color-text)',
                    'text-muted': 'var(--color-text-muted)',
                    surface: 'var(--color-surface)',
                    'surface-hover': 'var(--color-surface-hover)',
                    border: 'var(--color-border)',
                    input: 'var(--color-input)',
                    ring: 'var(--color-ring)',

                    // Legacy mappings (for backward compatibility if needed, but we should migrate)
                    dark: 'var(--color-bg)',
                    darker: 'var(--color-surface)',
                }
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
