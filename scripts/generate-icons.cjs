const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const root = path.join(__dirname, "..");
const src = path.join(__dirname, "icon-source.svg");
const srcMaskable = path.join(__dirname, "icon-source-maskable.svg");

const outIcons = path.join(root, "public", "icons");
fs.mkdirSync(outIcons, { recursive: true });

const jobs = [
  // Manifest icons (PWA)
  { src, size: 192, out: path.join(outIcons, "icon-192.png") },
  { src, size: 512, out: path.join(outIcons, "icon-512.png") },
  { src: srcMaskable, size: 512, out: path.join(outIcons, "icon-512-maskable.png") },
  // iOS home screen
  { src, size: 180, out: path.join(outIcons, "apple-touch-icon.png") },
  // Favicon / Next.js app icon conventions (browser tab)
  { src, size: 512, out: path.join(root, "app", "icon.png") },
  { src, size: 180, out: path.join(root, "app", "apple-icon.png") },
];

async function run() {
  for (const job of jobs) {
    await sharp(job.src, { density: 384 })
      .resize(job.size, job.size)
      .png()
      .toFile(job.out);
    console.log(`✓ ${path.relative(root, job.out)} (${job.size}x${job.size})`);
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
