// Convierte docs/marca/LOGO VUELVO CRM.pdf a public/logo.svg.
//
// No es un conversor de PDF general: este archivo en particular es vector puro
// con un vocabulario mínimo de operadores (mover, línea, curva, rellenar,
// trazar, más color y matriz de transformación). Con eso alcanza, y evita
// meter una dependencia de 2 MB para un archivo de 6 KB.
//
// Se corre una sola vez, a mano. Si el logo cambia, volver a correrlo:
//   node scripts/pdf-to-svg.cjs

const fs = require("node:fs");
const path = require("node:path");
const zlib = require("node:zlib");

const root = path.join(__dirname, "..");
const src = path.join(root, "docs", "marca", "LOGO VUELVO CRM.pdf");
const out = path.join(root, "public", "logo.svg");

// --- 1. Sacar los content streams del PDF -----------------------------------

function contentStreams(buf) {
  const streams = [];
  let i = 0;
  while (true) {
    const start = buf.indexOf(Buffer.from("stream"), i);
    if (start < 0) break;
    let s = start + 6;
    if (buf[s] === 0x0d) s++; // CR
    if (buf[s] === 0x0a) s++; // LF
    const end = buf.indexOf(Buffer.from("endstream"), s);
    if (end < 0) break;
    try {
      const text = zlib.inflateSync(buf.slice(s, end)).toString("latin1");
      // El perfil ICC también viaja comprimido; lo distinguimos porque el
      // content stream real tiene operadores de dibujo.
      if (/\bm\b|\bre\b/.test(text)) streams.push(text);
    } catch {
      // No todos los streams están comprimidos con flate; los ignoramos.
    }
    i = end + 9;
  }
  return streams.join("\n");
}

function mediaBox(buf) {
  const m = buf
    .toString("latin1")
    .match(/\/MediaBox\s*\[\s*([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)/);
  if (!m) throw new Error("No se encontró /MediaBox");
  return { x0: +m[1], y0: +m[2], x1: +m[3], y1: +m[4] };
}

// --- 2. Interpretar los operadores ------------------------------------------

const hex = (r, g, b) =>
  "#" +
  [r, g, b]
    .map((v) => Math.round(v * 255).toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();

// Multiplica dos matrices PDF [a b c d e f].
const mul = (m, n) => [
  m[0] * n[0] + m[1] * n[2],
  m[0] * n[1] + m[1] * n[3],
  m[2] * n[0] + m[3] * n[2],
  m[2] * n[1] + m[3] * n[3],
  m[4] * n[0] + m[5] * n[2] + n[4],
  m[4] * n[1] + m[5] * n[3] + n[5],
];

const apply = (m, x, y) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];

function parse(content, box) {
  const tokens = content.split(/\s+/).filter(Boolean);
  const num = (t) => parseFloat(t);

  // Estado gráfico. `ctm` arranca en identidad; el flip vertical (PDF tiene el
  // origen abajo, SVG arriba) se aplica al final, al emitir.
  let ctm = [1, 0, 0, 1, 0, 0];
  let fill = "#000000";
  let stroke = "#000000";
  let width = 1;
  const stack = [];

  const shapes = [];
  let d = "";
  let cur = [0, 0];
  const stackNums = [];

  const pt = (x, y) => {
    const [px, py] = apply(ctm, x, y);
    // Flip vertical y traslación al origen de la MediaBox.
    return [px - box.x0, box.y1 - py];
  };
  const f = (n) => (Math.round(n * 1000) / 1000).toString();

  // Ancho de trazo efectivo: el valor declarado por `w`, escalado por la
  // matriz vigente al momento de trazar. Se usa la raíz del determinante
  // porque una escala uniforme de k multiplica el área por k².
  const strokeW = () => {
    const scale = Math.sqrt(Math.abs(ctm[0] * ctm[3] - ctm[1] * ctm[2])) || 1;
    return width * scale;
  };

  for (const tok of tokens) {
    const n = num(tok);
    if (!Number.isNaN(n) && /^[\d.+-]/.test(tok)) {
      stackNums.push(n);
      continue;
    }

    switch (tok) {
      case "q":
        stack.push({ ctm, fill, stroke, width });
        break;
      case "Q": {
        const st = stack.pop();
        if (st) ({ ctm, fill, stroke, width } = st);
        break;
      }
      case "cm": {
        const a = stackNums.splice(-6);
        if (a.length === 6) ctm = mul(a, ctm);
        break;
      }
      case "w": {
        const a = stackNums.splice(-1);
        // Se guarda crudo. El ancho de línea vive en el espacio de usuario
        // *del momento del trazo*, no del momento en que se declara — y en
        // este PDF el `w` viene antes del `cm` que escala ×6, así que
        // escalarlo acá lo dejaba seis veces más fino.
        width = a[0] ?? 1;
        break;
      }
      case "scn":
      case "sc": {
        const a = stackNums.splice(-3);
        if (a.length === 3) fill = hex(a[0], a[1], a[2]);
        break;
      }
      case "SCN":
      case "SC": {
        const a = stackNums.splice(-3);
        if (a.length === 3) stroke = hex(a[0], a[1], a[2]);
        break;
      }
      case "m": {
        const [x, y] = stackNums.splice(-2);
        const p = pt(x, y);
        d += `M${f(p[0])} ${f(p[1])}`;
        cur = [x, y];
        break;
      }
      case "l": {
        const [x, y] = stackNums.splice(-2);
        const p = pt(x, y);
        d += `L${f(p[0])} ${f(p[1])}`;
        cur = [x, y];
        break;
      }
      case "c": {
        const [x1, y1, x2, y2, x3, y3] = stackNums.splice(-6);
        const a = pt(x1, y1);
        const b = pt(x2, y2);
        const c = pt(x3, y3);
        d += `C${f(a[0])} ${f(a[1])} ${f(b[0])} ${f(b[1])} ${f(c[0])} ${f(c[1])}`;
        cur = [x3, y3];
        break;
      }
      case "v": {
        const [x2, y2, x3, y3] = stackNums.splice(-4);
        const a = pt(cur[0], cur[1]);
        const b = pt(x2, y2);
        const c = pt(x3, y3);
        d += `C${f(a[0])} ${f(a[1])} ${f(b[0])} ${f(b[1])} ${f(c[0])} ${f(c[1])}`;
        cur = [x3, y3];
        break;
      }
      case "y": {
        const [x1, y1, x3, y3] = stackNums.splice(-4);
        const a = pt(x1, y1);
        const c = pt(x3, y3);
        d += `C${f(a[0])} ${f(a[1])} ${f(c[0])} ${f(c[1])} ${f(c[0])} ${f(c[1])}`;
        cur = [x3, y3];
        break;
      }
      case "re": {
        const [x, y, w, h] = stackNums.splice(-4);
        const p0 = pt(x, y);
        const p1 = pt(x + w, y);
        const p2 = pt(x + w, y + h);
        const p3 = pt(x, y + h);
        d +=
          `M${f(p0[0])} ${f(p0[1])}L${f(p1[0])} ${f(p1[1])}` +
          `L${f(p2[0])} ${f(p2[1])}L${f(p3[0])} ${f(p3[1])}Z`;
        break;
      }
      case "h":
        d += "Z";
        break;
      case "f":
      case "f*":
      case "F":
        if (d) shapes.push({ d, fill, stroke: null, width: 0 });
        d = "";
        break;
      case "S":
        if (d) shapes.push({ d, fill: null, stroke, width: strokeW() });
        d = "";
        break;
      case "s":
        if (d) shapes.push({ d: d + "Z", fill: null, stroke, width: strokeW() });
        d = "";
        break;
      case "B":
      case "B*":
        if (d) shapes.push({ d, fill, stroke, width: strokeW() });
        d = "";
        break;
      case "n":
        d = "";
        break;
      default:
        // Operadores que no afectan la geometría (gs, BDC, EMC, J, j, M, d, cs, CS…).
        stackNums.length = 0;
        break;
    }
  }

  return shapes;
}

// --- 3. Emitir el SVG -------------------------------------------------------

const buf = fs.readFileSync(src);
const box = mediaBox(buf);
const w = +(box.x1 - box.x0).toFixed(3);
const h = +(box.y1 - box.y0).toFixed(3);
const shapes = parse(contentStreams(buf), box);

if (shapes.length === 0) throw new Error("No se extrajo ninguna forma del PDF");

const body = shapes
  .map((s) => {
    const attrs = [`d="${s.d}"`];
    attrs.push(s.fill ? `fill="${s.fill}"` : 'fill="none"');
    if (s.stroke) {
      attrs.push(`stroke="${s.stroke}"`);
      attrs.push(`stroke-width="${(Math.round(s.width * 1000) / 1000).toString()}"`);
      attrs.push('stroke-linecap="round"', 'stroke-linejoin="round"');
    }
    return `  <path ${attrs.join(" ")}/>`;
  })
  .join("\n");

const wrap = (inner, label) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${label}">
${inner}
</svg>
`;

fs.writeFileSync(out, wrap(body, "Vuelvo CRM"));
console.log(`✓ ${path.relative(root, out)} — ${shapes.length} formas, ${w}×${h}`);
for (const s of shapes) {
  console.log(`  ${s.fill ? "fill " + s.fill : "stroke " + s.stroke}`);
}

// Variante sin el badge: solo la marca, sobre fondo transparente. Va en
// superficies que ya son violetas (el panel de marca de /login, por ejemplo),
// donde el badge propio se recortaría contra un fondo del mismo color.
// El badge es siempre la primera forma: es el relleno de fondo del PDF.
const markOnly = shapes
  .slice(1)
  .map((s) => {
    const attrs = [`d="${s.d}"`, 'fill="none"'];
    if (s.stroke) {
      attrs.push(`stroke="${s.stroke}"`);
      attrs.push(`stroke-width="${(Math.round(s.width * 1000) / 1000).toString()}"`);
      attrs.push('stroke-linecap="round"', 'stroke-linejoin="round"');
    }
    return `  <path ${attrs.join(" ")}/>`;
  })
  .join("\n");

const outMark = path.join(root, "public", "logo-mark.svg");
fs.writeFileSync(outMark, wrap(markOnly, "Vuelvo CRM"));
console.log(`✓ ${path.relative(root, outMark)} — sin badge, ${shapes.length - 1} formas`);
