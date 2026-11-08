// GET /api/lang/en | /api/lang/es — cambia el idioma del sitio y
// vuelve a la página original (cookie `janida_lang`).
import { NextResponse } from "next/server";
import { LANG_COOKIE } from "@/lib/i18n";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ to: string }> }
) {
  const { to } = await params;
  const lang = to === "es" ? "es" : "en";
  const nextURL = new URL(req.url).searchParams.get("next") || "/";
  // Solo rutas internas (sin "//" ni protocolos) para no armar un redirect abierto
  const safeNext = nextURL.startsWith("/") && !nextURL.startsWith("//") ? nextURL : "/";
  const res = NextResponse.redirect(new URL(safeNext, req.url), 303);
  res.cookies.set(LANG_COOKIE, lang, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  return res;
}
