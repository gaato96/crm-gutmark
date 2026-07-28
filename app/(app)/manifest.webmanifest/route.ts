import type { MetadataRoute } from "next";

// Handler manual en vez del archivo especial `manifest.ts`: ese convention
// file de Next SOLO produce una ruta real en la raíz de `app/` — anidado
// bajo `(app)/` compila en dev (por su resolución on-demand más laxa) pero
// el build de producción no lo incluye como ruta, así que el manifest
// termina 404. Un Route Handler sí respeta su ubicación anidada en ambos
// entornos, y como no es el archivo especial, Next tampoco inyecta el
// `<link rel="manifest">` solo — eso lo controla `app/(app)/layout.tsx` vía
// `metadata.manifest`, que es lo que de verdad acota la instalabilidad al
// panel (ver Fase 4 / CLAUDE.md).
function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "GUTMARK Fideliza",
    short_name: "Fideliza",
    description:
      "Plataforma de fidelización post-venta para PYMES. Conocé, cuidá y hacé volver a tus clientes.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    background_color: "#f6f7fa",
    theme_color: "#059669",
    lang: "es-AR",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}

export function GET() {
  return Response.json(manifest(), {
    headers: { "Content-Type": "application/manifest+json" },
  });
}
