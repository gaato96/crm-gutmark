"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Upload,
  FileSpreadsheet,
  Download,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Users,
} from "lucide-react";
import { parseCsv, guessMapping, TargetField, ParsedCsv } from "@/lib/csv";
import { importCustomers, ImportRow } from "@/app/actions";

const FIELDS: { key: TargetField; label: string; required?: boolean }[] = [
  { key: "name", label: "Nombre", required: true },
  { key: "phone", label: "WhatsApp / Teléfono" },
  { key: "email", label: "Email" },
  { key: "birthdate", label: "Cumpleaños" },
  { key: "tags", label: "Etiquetas" },
  { key: "notes", label: "Notas" },
];

const EXAMPLE_CSV = `nombre,telefono,email,cumpleaños,etiquetas,notas
María González,5493815551201,maria@email.com,12/03/1990,vip,Prefiere fragancias florales
Juan Pérez,5493815551202,juan@email.com,05/07/1985,,Cliente nuevo
Lucía Martínez,5493815551203,lucia@email.com,1988-11-30,frecuente,`;

type Step = "input" | "map" | "importing" | "done";

export function ImportCustomers() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("input");
  const [rawText, setRawText] = useState("");
  const [hasHeader, setHasHeader] = useState(true);
  const [fileName, setFileName] = useState("");
  const [parsed, setParsed] = useState<ParsedCsv | null>(null);
  const [mapping, setMapping] = useState<Record<TargetField, number>>({
    name: -1,
    phone: -1,
    email: -1,
    birthdate: -1,
    tags: -1,
    notes: -1,
  });
  const [result, setResult] = useState<{ created: number; skipped: number } | null>(null);
  const [error, setError] = useState("");

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => setRawText((reader.result as string) ?? "");
    reader.readAsText(file, "UTF-8");
  }

  function downloadExample() {
    const blob = new Blob([EXAMPLE_CSV], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "plantilla-clientes.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function goToMap() {
    setError("");
    const p = parseCsv(rawText, hasHeader);
    if (p.rows.length === 0) {
      setError("No se detectaron filas de clientes. Revisá el archivo o el texto pegado.");
      return;
    }
    setParsed(p);
    setMapping(guessMapping(p.headers));
    setStep("map");
  }

  async function runImport() {
    if (!parsed) return;
    if (mapping.name < 0) {
      setError("Tenés que indicar qué columna tiene el nombre del cliente.");
      return;
    }
    setError("");
    setStep("importing");

    const get = (row: string[], field: TargetField) =>
      mapping[field] >= 0 ? row[mapping[field]] ?? "" : "";

    const rows: ImportRow[] = parsed.rows.map((row) => ({
      name: get(row, "name"),
      phone: get(row, "phone"),
      email: get(row, "email"),
      birthdate: get(row, "birthdate"),
      tags: get(row, "tags"),
      notes: get(row, "notes"),
    }));

    try {
      const res = await importCustomers(rows);
      setResult(res);
      setStep("done");
    } catch {
      setError("Ocurrió un error al importar. Intentá de nuevo.");
      setStep("map");
    }
  }

  function reset() {
    setRawText("");
    setFileName("");
    setParsed(null);
    setResult(null);
    setError("");
    setStep("input");
  }

  // -------- PASO 3: LISTO --------
  if (step === "done" && result) {
    return (
      <div className="card px-6 py-12 text-center animate-fade-in">
        <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-brand-500/10 text-brand-600">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-ink">¡Importación completa!</h2>
        <p className="mt-2 text-sm text-ink-muted">
          Se agregaron <span className="font-bold text-brand-700 dark:text-brand-400">{result.created}</span> clientes.
          {result.skipped > 0 && (
            <>
              {" "}
              Se omitieron <span className="font-semibold">{result.skipped}</span> (sin nombre o
              duplicados).
            </>
          )}
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button onClick={reset} className="btn-secondary">
            Importar otro archivo
          </button>
          <Link href="/clientes" className="btn-primary">
            <Users className="h-4 w-4" /> Ver clientes
          </Link>
        </div>
      </div>
    );
  }

  // -------- PASO EN CURSO --------
  if (step === "importing") {
    return (
      <div className="card px-6 py-16 text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-brand-600" />
        <p className="mt-3 text-sm font-medium text-ink-soft">Importando clientes…</p>
      </div>
    );
  }

  // -------- PASO 2: MAPEAR --------
  if (step === "map" && parsed) {
    const preview = parsed.rows.slice(0, 5);
    return (
      <div className="animate-fade-in">
        <div className="card p-5 sm:p-6">
          <h2 className="font-bold text-ink">Asigná las columnas</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Detectamos {parsed.rows.length} filas. Confirmá a qué dato corresponde cada columna.
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {FIELDS.map((f) => (
              <div key={f.key}>
                <label className="label">
                  {f.label} {f.required && <span className="text-rose-500">*</span>}
                </label>
                <select
                  value={mapping[f.key]}
                  onChange={(e) =>
                    setMapping((m) => ({ ...m, [f.key]: Number(e.target.value) }))
                  }
                  className="input"
                >
                  <option value={-1}>— Ignorar —</option>
                  {parsed.headers.map((h, i) => (
                    <option key={i} value={i}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>

        {/* Vista previa */}
        <div className="card mt-4 overflow-hidden">
          <div className="border-b border-line-soft px-5 py-3 text-sm font-semibold text-ink">
            Vista previa
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line-soft bg-surface-2/60 text-left">
                  {FIELDS.filter((f) => mapping[f.key] >= 0).map((f) => (
                    <th key={f.key} className="whitespace-nowrap px-4 py-2.5 font-semibold text-ink-soft">
                      {f.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((row, ri) => (
                  <tr key={ri} className="border-b border-line-soft">
                    {FIELDS.filter((f) => mapping[f.key] >= 0).map((f) => (
                      <td key={f.key} className="whitespace-nowrap px-4 py-2.5 text-ink-soft">
                        {row[mapping[f.key]] || <span className="text-ink-faint">—</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {error && <p className="mt-3 text-sm font-medium text-rose-600">{error}</p>}

        <div className="mt-5 flex justify-between">
          <button onClick={() => setStep("input")} className="btn-secondary">
            <ArrowLeft className="h-4 w-4" /> Volver
          </button>
          <button onClick={runImport} className="btn-primary">
            Importar {parsed.rows.length} clientes <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  // -------- PASO 1: ENTRADA --------
  return (
    <div className="animate-fade-in space-y-4">
      <div className="card p-5 sm:p-6">
        <button
          onClick={() => fileRef.current?.click()}
          className="flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-line bg-surface-2/50 px-6 py-10 text-center transition hover:border-brand-500/50 hover:bg-brand-500/10"
        >
          <div className="mb-3 grid h-12 w-12 place-items-center rounded-xl bg-brand-500/10 text-brand-600">
            <Upload className="h-6 w-6" />
          </div>
          <div className="text-sm font-semibold text-ink">
            {fileName ? fileName : "Subí un archivo CSV"}
          </div>
          <div className="mt-1 text-xs text-ink-muted">
            Exportá tu lista desde Excel o Google Sheets como .csv
          </div>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.txt,text/csv"
          onChange={onFile}
          className="hidden"
        />

        <div className="my-4 flex items-center gap-3 text-xs font-medium text-ink-faint">
          <span className="h-px flex-1 bg-surface-3" /> o pegá el texto <span className="h-px flex-1 bg-surface-3" />
        </div>

        <textarea
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          rows={5}
          placeholder={"nombre,telefono,email,cumpleaños\nMaría González,5493815551201,maria@email.com,12/03/1990"}
          className="input resize-none font-mono text-xs"
        />

        <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm text-ink-soft">
          <input
            type="checkbox"
            checked={hasHeader}
            onChange={(e) => setHasHeader(e.target.checked)}
            className="h-4 w-4 rounded border-line text-brand-600 focus:ring-brand-500"
          />
          La primera fila es el encabezado (nombres de columna)
        </label>

        {error && <p className="mt-3 text-sm font-medium text-rose-600">{error}</p>}

        <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
          <button onClick={downloadExample} className="btn-ghost text-brand-700 dark:text-brand-400">
            <Download className="h-4 w-4" /> Descargar plantilla de ejemplo
          </button>
          <button onClick={goToMap} disabled={!rawText.trim()} className="btn-primary">
            Continuar <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-sky-500/20 bg-sky-500/10 p-4 text-sm text-sky-700 dark:text-sky-300">
        <FileSpreadsheet className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          Solo el <strong>nombre</strong> es obligatorio. Las fechas de cumpleaños aceptan formatos
          como <code className="rounded bg-surface/70 px-1">12/03/1990</code> o{" "}
          <code className="rounded bg-surface/70 px-1">1990-03-12</code>. Los duplicados (mismo
          teléfono o email) se omiten automáticamente.
        </p>
      </div>
    </div>
  );
}
