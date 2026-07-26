import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "GUTMARK Fideliza",
    short_name: "Fideliza",
    description:
      "Plataforma de fidelización post-venta para PYMES. Conocé, cuidá y hacé volver a tus clientes.",
    start_url: "/",
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
