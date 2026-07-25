import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "GUTMARK Fideliza — Hacé volver a tus clientes",
  description:
    "Plataforma de fidelización post-venta para PYMES. Conocé, cuidá y hacé volver a tus clientes.",
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
    <html lang="es" className={inter.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
