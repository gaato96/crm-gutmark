import "server-only";
import { headers } from "next/headers";

// Envío de emails transaccionales (recuperar contraseña, resumen semanal) por
// la API HTTP de Resend. Va con fetch y sin SDK: es un solo endpoint y así no
// se suma una dependencia.
//
// Sin RESEND_API_KEY no se manda nada y se devuelve false: en desarrollo, o
// mientras no esté configurado, el resto del flujo sigue funcionando (el
// superadmin puede generar el link de recuperación desde /admin).

export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return false;
  const from = process.env.EMAIL_FROM || "Vuelvo CRM <onboarding@resend.dev>";
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [params.to], subject: params.subject, html: params.html, text: params.text }),
    });
    if (!res.ok) {
      console.error("Resend respondió", res.status, await res.text().catch(() => ""));
      return false;
    }
    return true;
  } catch (e) {
    console.error("No se pudo mandar el email", e);
    return false;
  }
}

// URL pública de la app, para armar links dentro de los emails. APP_URL manda
// si está; si no, sale del request (sirve en Vercel y en local).
export async function appUrl(): Promise<string> {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  try {
    const h = await headers();
    const host = h.get("x-forwarded-host") ?? h.get("host");
    if (host) {
      const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
      return `${proto}://${host}`;
    }
  } catch {
    // Fuera de un request (cron): cae a la variable de Vercel.
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return "http://localhost:3000";
}

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

// Envoltorio común de los emails: blanco, una columna, el verde de marca solo
// en el botón (con letra oscura, por contraste — ver CLAUDE.md).
export function emailLayout(params: { title: string; body: string; cta?: { label: string; href: string } }): string {
  const cta = params.cta
    ? `<p style="margin:28px 0"><a href="${params.cta.href}" style="background:#00BE86;color:#000F0B;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:12px;display:inline-block">${escapeHtml(params.cta.label)}</a></p>`
    : "";
  return `<!doctype html><html><body style="margin:0;background:#F7F7FA;font-family:Poppins,Segoe UI,Arial,sans-serif;color:#0F172A">
<div style="max-width:520px;margin:0 auto;padding:32px 20px">
<div style="font-family:Montserrat,Arial,sans-serif;font-weight:800;font-size:18px;color:#5B2EE5;margin-bottom:20px">Vuelvo <span style="font-weight:600;font-size:13px;color:#64748B">CRM</span></div>
<div style="background:#fff;border-radius:16px;padding:28px;border:1px solid #E2E8F0">
<h1 style="font-family:Montserrat,Arial,sans-serif;font-size:20px;margin:0 0 14px">${escapeHtml(params.title)}</h1>
${params.body}
${cta}
</div>
<p style="font-size:12px;color:#94A3B8;margin-top:18px">Vuelvo CRM · Desarrollado por GUTMARK</p>
</div></body></html>`;
}
