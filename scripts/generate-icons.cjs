const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const root = path.join(__dirname, "..");
// Fuente: el ícono de marca generado por IA (public/logo.png), no un SVG a
// mano — desde el rediseño "Vuelvo" la marca es un raster, así que estos
// archivos se recortan/redondean a partir de ahí en vez de rasterizar un
// vector propio (ver CLAUDE.md → "Identidad de marca").
const src = path.join(root, "public", "logo.png");

const outIcons = path.join(root, "public", "icons");
fs.mkdirSync(outIcons, { recursive: true });

// Mismo radio de esquina que usaba el ícono anterior (rx=112 sobre un lienzo
// de 512), para que el recorte no cambie de "personalidad" entre versiones.
const CORNER_RATIO = 112 / 512;

function roundedMask(size) {
  const r = Math.round(size * CORNER_RATIO);
  return Buffer.from(
    `<svg width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${r}" ry="${r}" fill="#fff"/></svg>`
  );
}

async function makeIcon(size, out, { rounded }) {
  const resized = await sharp(src).resize(size, size, { fit: "cover" }).png().toBuffer();
  if (!rounded) {
    // El maskable NO lleva esquinas redondeadas propias: el sistema operativo
    // aplica su propia máscara (círculo, squircle, etc.) sobre el lienzo
    // completo, así que acá el arte tiene que llegar a los bordes.
    await sharp(resized).toFile(out);
    return;
  }
  await sharp(resized)
    .composite([{ input: roundedMask(size), blend: "dest-in" }])
    .png()
    .toFile(out);
}

const jobs = [
  // Manifest icons (PWA)
  { size: 192, out: path.join(outIcons, "icon-192.png"), rounded: true },
  { size: 512, out: path.join(outIcons, "icon-512.png"), rounded: true },
  { size: 512, out: path.join(outIcons, "icon-512-maskable.png"), rounded: false },
  // iOS home screen
  { size: 180, out: path.join(outIcons, "apple-touch-icon.png"), rounded: true },
  // Favicon / Next.js app icon conventions (browser tab)
  { size: 512, out: path.join(root, "app", "icon.png"), rounded: true },
  { size: 180, out: path.join(root, "app", "apple-icon.png"), rounded: true },
];

async function run() {
  for (const job of jobs) {
    await makeIcon(job.size, job.out, { rounded: job.rounded });
    console.log(
      `✓ ${path.relative(root, job.out)} (${job.size}x${job.size}${job.rounded ? "" : ", full-bleed"})`
    );
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
