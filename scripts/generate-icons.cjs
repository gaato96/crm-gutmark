const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const root = path.join(__dirname, "..");

// Fuente: el logo vectorial (public/logo.svg), generado desde el PDF del
// manual de marca con scripts/pdf-to-svg.cjs. Al ser vector, cada tamaño se
// rasteriza nítido en vez de reescalar un PNG — y el badge violeta ya trae sus
// esquinas redondeadas, así que no hace falta enmascarar nada a mano.
const src = path.join(root, "public", "logo.svg");
const srcMark = path.join(root, "public", "logo-mark.svg");

const BADGE = "#5B2EE5";

const outIcons = path.join(root, "public", "icons");
fs.mkdirSync(outIcons, { recursive: true });

async function makeIcon(size, out) {
  await sharp(src, { density: 512 }).resize(size, size).png().toFile(out);
}

// El maskable NO puede llevar esquinas redondeadas propias: el sistema
// operativo aplica su propia máscara (círculo, squircle…) sobre el lienzo
// completo, y un badge ya redondeado quedaría recortado dos veces. Por eso se
// arma aparte: violeta a sangre, con la marca al 58% en el centro — dentro de
// la "safe zone" del 80% que define la spec de maskable icons.
async function makeMaskable(size, out) {
  const inner = Math.round(size * 0.58);
  const mark = await sharp(srcMark, { density: 512 })
    .resize(inner, inner)
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: BADGE,
    },
  })
    .composite([{ input: mark, gravity: "center" }])
    .png()
    .toFile(out);
}

// Imagen de Open Graph / Twitter Card: la que se ve cuando alguien comparte el
// link en WhatsApp o en redes.
//
// El texto se rasteriza acá con las fuentes del sistema, así que el resultado
// depende de qué haya instalado la máquina que corre el script. Montserrat es
// la de la marca; si falta, cae a Segoe UI o Arial y el archivo sale con otra
// letra. Como el PNG queda versionado en el repo, esto solo importa al
// regenerarlo — pero conviene mirar el resultado antes de commitear.
async function makeOgImage(out) {
  const W = 1200;
  const H = 630;
  const MARK = 200;

  const mark = await sharp(srcMark, { density: 512 })
    .resize(MARK, MARK)
    .png()
    .toBuffer();

  const text = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
      <text x="${W / 2}" y="448" text-anchor="middle"
            font-family="Montserrat, Segoe UI, Arial, sans-serif"
            font-size="76" font-weight="700" fill="#FFFFFF">Vuelvo CRM</text>
      <text x="${W / 2}" y="510" text-anchor="middle"
            font-family="Poppins, Segoe UI, Arial, sans-serif"
            font-size="32" font-weight="400" fill="#D9CDFB">Porque vender una vez no alcanza.</text>
    </svg>`
  );

  await sharp({
    create: { width: W, height: H, channels: 4, background: BADGE },
  })
    .composite([
      { input: mark, top: 170, left: Math.round((W - MARK) / 2) },
      { input: text, top: 0, left: 0 },
    ])
    .png()
    .toFile(out);
}

const jobs = [
  // Manifest icons (PWA)
  { size: 192, out: path.join(outIcons, "icon-192.png") },
  { size: 512, out: path.join(outIcons, "icon-512.png") },
  // iOS home screen
  { size: 180, out: path.join(outIcons, "apple-touch-icon.png") },
  // Favicon / convenciones de app icon de Next.js (pestaña del navegador)
  { size: 512, out: path.join(root, "app", "icon.png") },
  { size: 180, out: path.join(root, "app", "apple-icon.png") },
];

async function run() {
  for (const job of jobs) {
    await makeIcon(job.size, job.out);
    console.log(`✓ ${path.relative(root, job.out)} (${job.size}x${job.size})`);
  }

  const maskable = path.join(outIcons, "icon-512-maskable.png");
  await makeMaskable(512, maskable);
  console.log(`✓ ${path.relative(root, maskable)} (512x512, full-bleed)`);

  const og = path.join(root, "public", "og.png");
  await makeOgImage(og);
  console.log(`✓ ${path.relative(root, og)} (1200x630)`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
