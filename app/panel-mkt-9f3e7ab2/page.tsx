import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { marked } from "marked";

// Página oculta, sin link desde ningún lado del sistema: el slug aleatorio
// es el único control de acceso, más `robots: noindex` para que no aparezca
// en buscadores. No requiere sesión de la app a propósito, para poder
// abrirla desde el celular sin loguearse.
export const metadata: Metadata = {
  title: "Notas internas",
  robots: { index: false, follow: false, nocache: true },
};

const DOCS_DIR = path.join(process.cwd(), "docs", "marketing");

const DOCUMENTS = [
  { file: "plan-marketing.md", slug: "plan", label: "Plan de marketing y adquisición" },
  { file: "prospeccion.md", slug: "prospeccion", label: "Prospección" },
  { file: "precios.md", slug: "precios", label: "Recomendación de precios" },
  { file: "mensajes-en-frio.md", slug: "mensajes", label: "Mensajes en frío" },
] as const;

function readDoc(file: string): string {
  const full = path.join(DOCS_DIR, file);
  try {
    return fs.readFileSync(full, "utf-8");
  } catch {
    return `_No se encontró ${file}._`;
  }
}

export default async function MarketingDocsPage() {
  const sections = DOCUMENTS.map((doc) => ({
    ...doc,
    html: marked.parse(readDoc(doc.file), { async: false }) as string,
  }));

  return (
    <div className="min-h-screen bg-canvas">
      <header className="sticky top-0 z-10 border-b border-line bg-surface/95 backdrop-blur">
        <div className="mx-auto max-w-3xl px-4 py-3">
          <p className="font-display text-[10px] uppercase tracking-[0.14em] text-ink-faint">
            No indexado · no compartir el link
          </p>
          <h1 className="mt-1 font-display text-lg text-ink">
            Estrategia de marketing — Vuelvo CRM
          </h1>
          <nav className="mt-3 flex flex-wrap gap-2">
            {sections.map((s) => (
              <a
                key={s.slug}
                href={`#${s.slug}`}
                className="rounded-full border border-line bg-surface-2 px-3 py-1.5 text-xs font-semibold text-ink-soft"
              >
                {s.label}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        {sections.map((s, i) => (
          <section
            key={s.slug}
            id={s.slug}
            className={i > 0 ? "mt-14 scroll-mt-24 border-t border-line pt-10" : "scroll-mt-24"}
          >
            <div
              className="md-content"
              dangerouslySetInnerHTML={{ __html: s.html }}
            />
          </section>
        ))}

        <p className="mt-16 border-t border-line pt-6 text-center text-xs text-ink-faint">
          Generado por Claude Code el 2026-07-29. Los archivos fuente viven en{" "}
          <code>docs/marketing/</code> dentro del repo.
        </p>
      </main>

      {/* Estilos del markdown renderizado (marked produce HTML plano sin clases).
          Usa las mismas variables de tema que el resto de la app, así que
          sigue el modo claro/oscuro automáticamente. */}
      <style>{`
        .md-content { color: rgb(var(--ink)); line-height: 1.7; font-size: 0.95rem; }
        .md-content h1 { font-family: var(--font-display); font-size: 1.7rem; margin: 0 0 .75rem; color: rgb(var(--ink)); }
        .md-content h2 { font-family: var(--font-display); font-size: 1.35rem; margin: 2rem 0 .75rem; padding-top: .25rem; color: rgb(var(--ink)); }
        .md-content h3 { font-size: 1.1rem; font-weight: 700; margin: 1.5rem 0 .5rem; color: rgb(var(--ink)); }
        .md-content h4 { font-size: 1rem; font-weight: 700; margin: 1.25rem 0 .4rem; color: rgb(var(--ink)); }
        .md-content p { margin: 0 0 1rem; color: rgb(var(--ink-soft)); }
        .md-content ul, .md-content ol { margin: 0 0 1rem; padding-left: 1.4rem; color: rgb(var(--ink-soft)); }
        .md-content li { margin: 0.3rem 0; }
        .md-content li > ul, .md-content li > ol { margin: .3rem 0 0; }
        .md-content strong { color: rgb(var(--ink)); font-weight: 700; }
        .md-content em { color: rgb(var(--ink-soft)); }
        .md-content blockquote {
          margin: 1rem 0; padding: .5rem 1rem; border-left: 3px solid #00BE86;
          background: rgb(var(--surface-2)); border-radius: .5rem; color: rgb(var(--ink-soft));
        }
        .md-content code {
          font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
          font-size: .85em; background: rgb(var(--surface-2));
          padding: .15em .4em; border-radius: .35em; color: rgb(var(--ink));
        }
        .md-content pre {
          background: rgb(var(--surface-2)); padding: 1rem; border-radius: .75rem; overflow-x: auto;
          margin: 0 0 1rem; border: 1px solid rgb(var(--line));
        }
        .md-content pre code { background: none; padding: 0; }
        .md-content hr { border: none; border-top: 1px solid rgb(var(--line)); margin: 2rem 0; }
        .md-content a { color: #006144; text-decoration: underline; text-underline-offset: 2px; }
        .md-content table {
          width: 100%; border-collapse: collapse; margin: 0 0 1.25rem; font-size: .85rem;
          display: block; overflow-x: auto; white-space: nowrap;
        }
        .md-content th, .md-content td {
          border: 1px solid rgb(var(--line)); padding: .5rem .65rem; text-align: left; white-space: normal;
        }
        .md-content th { background: rgb(var(--surface-2)); font-weight: 700; color: rgb(var(--ink)); white-space: nowrap; }
        .md-content tr:nth-child(even) td { background: rgb(var(--surface-2) / 0.4); }
        .md-content blockquote p:last-child { margin-bottom: 0; }
      `}</style>
    </div>
  );
}
