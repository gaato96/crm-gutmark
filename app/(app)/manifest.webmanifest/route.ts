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
    name: "Vuelvo CRM",
    // Deliberadamente más corto que `name`: es lo que se ve bajo el ícono en
    // la pantalla de inicio, donde el descriptor de categoría no entra.
    short_name: "Vuelvo",
    description:
      "El CRM para conocer mejor a tus clientes, fidelizarlos y hacer que vuelvan.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#5B2EE5",
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
