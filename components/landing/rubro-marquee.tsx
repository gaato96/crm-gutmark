import Image from "next/image";
import { RUBROS } from "@/lib/landing-media";

/**
 * Cinta continua de rubros.
 *
 * Por qué este motion: la lista comunica amplitud, no detalle. Nadie necesita
 * leer los ocho rubros en orden, necesita percibir "hay muchos como el mío".
 * Una cinta transmite eso mejor que una grilla estática, y es la única de toda
 * la página.
 *
 * Es CSS puro, sin JavaScript: la pista se duplica y se desplaza el 50%, así
 * que el bucle es invisible. Se frena al pasar el mouse y queda quieta con
 * prefers-reduced-motion (ver app/globals.css).
 */
export function RubroMarquee() {
  const track = [...RUBROS, ...RUBROS];

  return (
    <div className="marquee-mask group relative overflow-hidden py-2">
      {/* La separación va como padding de cada ítem, no como `gap` del flex:
          con `gap` el ancho total es 2·copia + gap y el desplazamiento del 50%
          no cae justo en el corte, así que el bucle pega un salto visible. */}
      <ul className="animate-marquee flex w-max group-hover:[animation-play-state:paused]">
        {track.map((rubro, i) => (
          <li
            key={`${rubro.name}-${i}`}
            className="w-[164px] shrink-0 pr-4 sm:w-[214px] sm:pr-6"
            // La segunda copia es puramente visual: para un lector de
            // pantalla la lista ya se leyó completa en la primera vuelta.
            aria-hidden={i >= RUBROS.length}
          >
            <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-surface-2 ring-1 ring-line">
              <Image
                src={rubro.src}
                alt={i >= RUBROS.length ? "" : rubro.alt}
                fill
                sizes="190px"
                className="object-cover saturate-[0.85] transition-transform duration-700 ease-out group-hover:scale-[1.03]"
              />
              {/* Tinte de marca: unifica ocho fotos de origen distinto en una
                  sola paleta en vez de un collage de stock. */}
              <div className="pointer-events-none absolute inset-0 bg-brand-950/25 mix-blend-multiply dark:bg-brand-950/45" />
            </div>
            <p className="mt-2.5 text-center text-sm font-semibold text-ink-soft">
              {rubro.name}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
