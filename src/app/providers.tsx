"use client";
// ============================================================
// Proveedores de cliente:
// 1) LangProvider — diccionario i18n inyectado por el layout
//    (servidor lee la cookie y entrega el diccionario activo)
// 2) CartProvider — carrito persistente (localStorage) en CAJAS
// 3) RateProvider — tasa USD→COP desde /api/meta
// ============================================================
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Lang } from "@/lib/i18n";

// ---------------- i18n (colección inyectada del servidor) ----------------
export type TranslateFn = (key: string, vars?: Record<string, string | number>) => string;

interface LangApi {
  lang: Lang;
  t: TranslateFn;
}

const LangContext = createContext<LangApi>({
  lang: "en",
  t: (key) => key,
});

export function LangProvider({
  children,
  lang,
  dict,
}: {
  children: ReactNode;
  lang: Lang;
  dict: Record<string, string>;
}) {
  const t = useCallback<TranslateFn>(
    (key, vars) => {
      let text = dict[key] ?? key;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          text = text.replaceAll(`{${k}}`, String(v));
        }
      }
      return text;
    },
    [dict]
  );
  const api = useMemo(() => ({ lang, t }), [lang, t]);
  return <LangContext.Provider value={api}>{children}</LangContext.Provider>;
}

/** Textos dentro de componentes cliente (público) */
export function useLang(): LangApi {
  return useContext(LangContext);
}

// ---------------- Carrito (en CAJAS enteras) ----------------
export interface CartItem {
  productId: string;
  /** Cajas enteras (SIEMPRE ≥ 1; cada caja es cerrada de 200 tallos) */
  boxes: number;
}

interface CartApi {
  items: CartItem[];
  hydrated: boolean;
  totalBoxes: number;
  add: (productId: string, boxes?: number) => void;
  setBoxes: (productId: string, boxes: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartApi | null>(null);
const STORAGE_KEY = "janida.cart.v2";

function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CartItem[];
        if (Array.isArray(parsed)) {
          setItems(
            parsed
              .filter((i) => i && typeof i.productId === "string")
              // venta únicamente por cajas enteras
              .filter((i) => Number.isInteger(i.boxes) && i.boxes >= 1)
              .map((i) => ({ productId: i.productId, boxes: i.boxes }))
          );
        }
      }
    } catch {
      // carrito dañado o ilegible: se ignora
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // almacenamiento lleno o bloqueado: se ignora
    }
  }, [items, hydrated]);

  const add = useCallback((productId: string, boxes = 1) => {
    setItems((prev) => {
      const found = prev.find((i) => i.productId === productId);
      if (found) {
        return prev.map((i) =>
          i.productId === productId ? { ...i, boxes: i.boxes + boxes } : i
        );
      }
      return [...prev, { productId, boxes }];
    });
  }, []);

  const setBoxes = useCallback((productId: string, boxes: number) => {
    const n = Math.max(1, Math.round(Number(boxes)));
    setItems((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, boxes: n } : i))
    );
  }, []);

  const remove = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const totalBoxes = useMemo(() => items.reduce((a, i) => a + i.boxes, 0), [items]);

  const api = useMemo(
    () => ({ items, hydrated, totalBoxes, add, setBoxes, remove, clear }),
    [items, hydrated, totalBoxes, add, setBoxes, remove, clear]
  );

  return <CartContext.Provider value={api}>{children}</CartContext.Provider>;
}

export function useCart(): CartApi {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de <AppProviders>");
  return ctx;
}

// ---------------- Tasa USD→COP (del servidor vía /api/meta) ----------------
interface RateApi {
  rate: number;
  ready: boolean;
}

const RateContext = createContext<RateApi>({ rate: 3800, ready: false });

function RateProvider({ children }: { children: ReactNode }) {
  const [rate, setRate] = useState(3800);

  useEffect(() => {
    let alive = true;
    fetch("/api/meta")
      .then((r) => r.json())
      .then((m) => {
        if (alive && m && typeof m.exchangeRateCOP === "number") setRate(m.exchangeRateCOP);
      })
      .catch(() => {
        /* se mantiene el valor inicial */
      });
    return () => {
      alive = false;
    };
  }, []);

  const api = useMemo(() => ({ rate, ready: rate > 0 }), [rate]);
  return <RateContext.Provider value={api}>{children}</RateContext.Provider>;
}

export function useRate(): RateApi {
  return useContext(RateContext);
}

// ---------------- Ensamble ----------------
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <RateProvider>
      <CartProvider>{children}</CartProvider>
    </RateProvider>
  );
}
