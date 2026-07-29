// Fotografía de la landing pública (Unsplash, licencia libre).
// Archivo puro: lo importan tanto Server Components como componentes client.
//
// Cada entrada guarda solo el id del CDN; `photo()` arma la URL con el recorte
// y la calidad pedidos, así next/image no descarga el original de 5000px.

function photo(id: string, w: number, h: number) {
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&h=${h}&q=72`;
}

export interface Rubro {
  name: string;
  src: string;
  alt: string;
}

// Los rubros a los que apunta el producto, con una foto de contexto cada uno.
export const RUBROS: Rubro[] = [
  {
    name: "Perfumerías",
    src: photo("1557827983-012eb6ea8dc1", 480, 600),
    alt: "Estantería de perfumes en un local de venta al público",
  },
  {
    name: "Peluquerías",
    src: photo("1761839256840-7780a45b85dc", 480, 600),
    alt: "Puesto de trabajo de una peluquería",
  },
  {
    name: "Veterinarias",
    src: photo("1644675272883-0c4d582528d8", 480, 600),
    alt: "Consulta veterinaria atendiendo a una mascota",
  },
  {
    name: "Pet shops",
    src: photo("1548199973-03cce0bbc87b", 480, 600),
    alt: "Perro acompañado por su dueño",
  },
  {
    name: "Gimnasios",
    src: photo("1574680376345-b2995af0324f", 480, 600),
    alt: "Sala de entrenamiento de un gimnasio de barrio",
  },
  {
    name: "Ópticas",
    src: photo("1556740767-414a9c4860c1", 480, 600),
    alt: "Vidriera de una óptica",
  },
  {
    name: "Indumentaria",
    src: photo("1556742095-adaf2611556c", 480, 600),
    alt: "Local de indumentaria con prendas colgadas",
  },
  {
    name: "Estética",
    src: photo("1618994492420-b4f4d6b4890c", 480, 600),
    alt: "Espacio de un centro de estética",
  },
];

// El hero ya no lleva foto: su fondo es `public/hero.mp4` (ver
// components/landing/hero-video.tsx). La sección de confianza tampoco, es una
// banda tipográfica. Así que la única fotografía de la landing son los rubros.
