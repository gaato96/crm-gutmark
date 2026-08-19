import type { Metadata, Viewport } from "next";
import { Montserrat, Poppins } from "next/font/google";
import "./globals.css";

// Las dos familias del manual de marca, y solo esas: Montserrat para titulares,
// números y CTA; Poppins para cuerpo e interfaz. El manual pide explícitamente
// no mezclar más familias, así que no hay una tercera para monoespaciado — las
// versalitas de la landing usan Montserrat con tracking amplio.
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
});
const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-display",
});

// El manifest y las meta apple-web-app se declaran solo en app/(app)/layout.tsx:
// la app instalable es el panel, no esta landing pública (ver "PWA" en CLAUDE.md).
export const metadata: Metadata = {
  title: "Vuelvo CRM | Porque vender una vez no alcanza",
  description:
    "El CRM para conocer mejor a tus clientes, fidelizarlos y hacer que vuelvan. Organizá tu cartera, hacé seguimiento y generá recompra.",
  // Tarjeta de preview para redes y mensajería, generada por
  // scripts/generate-icons.cjs junto con los íconos. No se usa en UI en línea.
  openGraph: {
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Vuelvo CRM" }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og.png"],
  },
};

// Estos dos valores duplican a mano --canvas de cada tema en globals.css.
// Si cambia la paleta, hay que sincronizarlos: no hay nada que los ate.
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f9fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#080b10" },
  ],
};

// Evita el parpadeo (FOUC) aplicando el tema antes de pintar.
const themeScript = `
(function () {
  try {
    var t = localStorage.getItem('vuelvo-theme');
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
      className={`${poppins.variable} ${montserrat.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
