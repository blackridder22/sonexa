/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                sonexa: {
                    primary: '#6366f1',
                    secondary: '#8b5cf6',
                    dark: '#0f0f23',
                    darker: '#09091a',
                    surface: '#1a1a2e',
                    border: '#2d2d44',
                }
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
