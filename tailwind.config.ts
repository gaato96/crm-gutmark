import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Verde de marca. El ancla es brand-500 = #00BE86, el valor exacto del
        // manual; el resto de la escala se deriva de ahí.
        //
        // Ojo con el contraste: #00BE86 es un verde BRILLANTE. Con texto blanco
        // da 2.41:1 y reprueba WCAG AA; con texto oscuro (brand-950) da 8.12:1.
        // Por eso el botón primario es verde con letra oscura, no al revés.
        // Para texto verde sobre fondo claro hay que bajar a brand-700 (7.52:1
        // sobre blanco) — brand-600 se queda en 4.48:1, apenas por debajo.
        brand: {
          50: "#E7F9F4",
          100: "#D0F3E9",
          200: "#9FE7D2",
          300: "#6EDABA",
          400: "#3ACDA2",
          500: "#00BE86",
          600: "#008860",
          700: "#006144",
          800: "#003E2C",
          900: "#001E15",
          950: "#000F0B",
        },
        // Violeta de acento. Ancla accent-600 = #5B2EE5, también del manual.
        // A diferencia del verde, este SÍ funciona como fondo con texto blanco
        // (7.08:1). Reemplaza a la escala `gold` de la identidad anterior.
        accent: {
          50: "#F2EFFD",
          100: "#E6DFFB",
          200: "#CCBEF7",
          300: "#B29CF3",
          400: "#977AEE",
          500: "#7B56EA",
          600: "#5B2EE5",
          700: "#3C1E97",
          800: "#261360",
          900: "#12092E",
          950: "#090517",
        },
        // Tokens semánticos (cambian con el tema via CSS vars)
        canvas: "rgb(var(--canvas) / <alpha-value>)",
        surface: {
          DEFAULT: "rgb(var(--surface) / <alpha-value>)",
          2: "rgb(var(--surface-2) / <alpha-value>)",
          3: "rgb(var(--surface-3) / <alpha-value>)",
        },
        line: {
          DEFAULT: "rgb(var(--line) / <alpha-value>)",
          soft: "rgb(var(--line-soft) / <alpha-value>)",
        },
        ink: {
          DEFAULT: "rgb(var(--ink) / <alpha-value>)",
          soft: "rgb(var(--ink-soft) / <alpha-value>)",
          muted: "rgb(var(--ink-muted) / <alpha-value>)",
          faint: "rgb(var(--ink-faint) / <alpha-value>)",
        },
      },
      fontFamily: {
        // Montserrat para titulares y Poppins para cuerpo, según el manual.
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        // El manual pide no mezclar familias de marca, y no se mezcla: esta no
        // carga ninguna webfont, es la monoespaciada del sistema. Está para lo
        // que necesita ancho fijo de verdad — pegar CSV, bloques de código,
        // mostrar una contraseña — no para decorar. Las versalitas usan
        // `font-display` con tracking.
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px 0 rgb(2 6 23 / 0.04), 0 8px 24px -12px rgb(2 6 23 / 0.12)",
        pop: "0 12px 40px -8px rgb(2 6 23 / 0.28)",
        glow: "0 0 0 1px rgb(0 190 134 / 0.12), 0 8px 30px -6px rgb(0 190 134 / 0.25)",
      },
      borderRadius: {
        xl: "0.9rem",
        "2xl": "1.15rem",
        "3xl": "1.5rem",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.96)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(100%)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        // La pista de la cinta de rubros lleva el contenido duplicado, así que
        // desplazar el 50% deja la segunda copia justo donde estaba la primera.
        marquee: {
          from: { transform: "translate3d(0,0,0)" },
          to: { transform: "translate3d(-50%,0,0)" },
        },
        // Deriva lenta de las manchas de color del hero. Dos ritmos distintos
        // y primos entre sí para que el fondo nunca se repita a ojo.
        "drift-a": {
          "0%, 100%": { transform: "translate3d(0,0,0) scale(1)" },
          "50%": { transform: "translate3d(6%, -8%, 0) scale(1.12)" },
        },
        "drift-b": {
          "0%, 100%": { transform: "translate3d(0,0,0) scale(1.06)" },
          "50%": { transform: "translate3d(-7%, 6%, 0) scale(1)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.3s cubic-bezier(0.16,1,0.3,1)",
        "scale-in": "scale-in 0.2s cubic-bezier(0.16,1,0.3,1)",
        "slide-up": "slide-up 0.28s cubic-bezier(0.16,1,0.3,1)",
        marquee: "marquee 46s linear infinite",
        "drift-a": "drift-a 19s ease-in-out infinite",
        "drift-b": "drift-b 26s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
