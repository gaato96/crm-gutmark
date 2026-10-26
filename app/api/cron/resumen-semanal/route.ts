import { sendWeeklySummaries } from "@/lib/weekly-summary";

// La dispara el cron de Vercel los lunes (vercel.json). Vercel manda
// "Authorization: Bearer <CRON_SECRET>"; sin ese secreto configurado la ruta no
// hace nada, para que nadie pueda mandar emails pegándole desde afuera.
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }
  const result = await sendWeeklySummaries();
  return Response.json(result);
}
