// ============================================================
// Runtime de i18n para el SERVIDOR.
// La fuente única de textos es scripts/i18n.py, que genera
// src/lib/i18n.json. Aquí solo se carga ese JSON y se expone:
//   - dictLang(lang): el diccionario plano del idioma
//   - t(lang, key, vars): texto interpolado
//   - getLangCookie(): idioma activo desde la cookie `janida_lang`
//
// El EXTRACTO visible de la UI siempre sale de este diccionario
// (inglés por defecto; español vía cookie).
// ============================================================
import { cookies } from "next/headers";
import raw from "./i18n.json";

export type Lang = "en" | "es";

type Dict = Record<string, string>;

const DICTS: Record<Lang, Dict> = {
  en: raw.en as Dict,
  es: raw.es as Dict,
};

export const DEFAULT_LANG: Lang = "en";
export const LANG_COOKIE = "janida_lang";

function isLang(v: string | undefined | null): v is Lang {
  return v === "en" || v === "es";
}

/** Diccionario plano del idioma (para pasar al cliente por props) */
export function dictLang(lang: Lang): Dict {
  return DICTS[lang] ?? DICTS[DEFAULT_LANG];
}

/** Texto por clave con variables {nombre}. Sin cadena dura fuera de este archivo. */
export function t(lang: Lang, key: string, vars?: Record<string, string | number>): string {
  const dict = DICTS[lang] ?? DICTS[DEFAULT_LANG];
  let text = dict[key] ?? DICTS[DEFAULT_LANG][key] ?? "";
  if (!text) return key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replaceAll(`{${k}}`, String(v));
    }
  }
  return text;
}

/** Idioma activo leyendo la cookie `janida_lang` (server components) */
export async function getLangCookie(): Promise<Lang> {
  const store = await cookies();
  const v = store.get(LANG_COOKIE)?.value;
  return isLang(v) ? v : DEFAULT_LANG;
}

/** Normaliza un idioma cualquiera a uno válido */
export function normalizeLang(v: string | undefined | null): Lang {
  return isLang(v) ? v : DEFAULT_LANG;
}

/** Etiquetas de estados de tracking en un idioma */
export function statusLabel(lang: Lang, code: string): string {
  return t(lang, `status.${code}`);
}
