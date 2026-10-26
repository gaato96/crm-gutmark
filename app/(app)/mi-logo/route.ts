import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

// El logo del negocio de la sesión. Se sirve aparte (y no dentro de la sesión
// ni como prop) porque pesa decenas de KB; la URL lleva ?v=<fecha de subida>,
// así que puede quedar en caché del navegador para siempre: un logo nuevo es
// una URL nueva. Es `private` porque depende de la cookie.
export async function GET() {
  const session = await getSessionUser();
  if (!session) return new Response("No autorizado", { status: 401 });

  const biz = await db.business.findUnique({
    where: { id: session.business.id },
    select: { logoData: true },
  });
  const match = biz?.logoData?.match(/^data:(image\/(?:png|jpeg|webp));base64,(.+)$/);
  if (!match) return new Response("Sin logo", { status: 404 });

  return new Response(Buffer.from(match[2], "base64"), {
    headers: {
      "Content-Type": match[1],
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}
