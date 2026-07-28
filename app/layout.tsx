import type { Metadata, Viewport } from "next";
import { Inter, Calistoga, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const calistoga = Calistoga({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
});
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

// El manifest y las meta apple-web-app se declaran solo en app/(app)/layout.tsx:
// la app instalable es el panel, no esta landing pública (ver Fase 4).
export const metadata: Metadata = {
  title: "GUTMARK Fideliza — Hacé volver a tus clientes",
  description:
    "Plataforma de fidelización post-venta para PYMES. Conocé, cuidá y hacé volver a tus clientes.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f7fa" },
    { media: "(prefers-color-scheme: dark)", color: "#080b10" },
  ],
};

// Evita el parpadeo (FOUC) aplicando el tema antes de pintar.
const themeScript = `
(function () {
  try {
    var t = localStorage.getItem('gf-theme');
    if (!t) t = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    if (t === 'dark') document.documentElement.classList.add('dark');
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es"
      className={`${inter.variable} ${calistoga.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
