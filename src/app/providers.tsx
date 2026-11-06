"use client";
// ============================================================
// Proveedores de cliente:
// 1) CartProvider — carrito persistente (localStorage) en PAQUETES
// 2) CurrencyProvider — tasa de cambio USD→COP desde /api/meta
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

// ---------------- Carrito ----------------
export interface CartItem {
  productId: string;
  /** Número de paquetes (SIEMPRE entero ≥ 1; venta por paquetes de 200) */
  packages: number;
}

interface CartApi {
  items: CartItem[];
  hydrated: boolean;
  /** suma de paquetes en el carrito */
  totalPackages: number;
  add: (productId: string, packages?: number) => void;
  setPackages: (productId: string, packages: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartApi | null>(null);
const STORAGE_KEY = "janida.cart.v1";

function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Hidratación desde localStorage (solo navegador)
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CartItem[];
        if (Array.isArray(parsed)) {
          setItems(
            parsed
              .filter((i) => i && typeof i.productId === "string")
              // La venta es únicamente por paquetes: enteros positivos
              .filter((i) => Number.isInteger(i.packages) && i.packages >= 1)
              .map((i) => ({ productId: i.productId, packages: i.packages }))
          );
        }
      }
    } catch {
      // carrito dañado o ilegible: se ignora
    }
    setHydrated(true);
  }, []);

  // Persistencia
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // almacenamiento lleno o bloqueado: se ignora en demo
    }
  }, [items, hydrated]);

  const add = useCallback((productId: string, packages = 1) => {
    setItems((prev) => {
      const found = prev.find((i) => i.productId === productId);
      if (found) {
        return prev.map((i) =>
          i.productId === productId ? { ...i, packages: i.packages + packages } : i
        );
      }
      return [...prev, { productId, packages }];
    });
  }, []);

  const setPackages = useCallback((productId: string, packages: number) => {
    // Se exige entero ≥ 1: no se permite venta por unidad ni fracciones
    const n = Math.max(1, Math.round(Number(packages)));
    setItems((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, packages: n } : i))
    );
  }, []);

  const remove = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const totalPackages = useMemo(
    () => items.reduce((a, i) => a + i.packages, 0),
    [items]
  );

  const api = useMemo(
    () => ({ items, hydrated, totalPackages, add, setPackages, remove, clear }),
    [items, hydrated, totalPackages, add, setPackages, remove, clear]
  );

  return <CartContext.Provider value={api}>{children}</CartContext.Provider>;
}

export function useCart(): CartApi {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de <AppProviders>");
  return ctx;
}

// ---------------- Divisa (tasa USD→COP del servidor) ----------------
interface CurrencyApi {
  rate: number; // 1 USD = rate COP
  packageSize: number;
  ready: boolean;
}

const CurrencyContext = createContext<CurrencyApi>({
  rate: 4200, // fallback demo si /api/meta tarda
  packageSize: 200,
  ready: false,
});

function CurrencyProvider({ children }: { children: ReactNode }) {
  const [meta, setMeta] = useState({ rate: 4200, packageSize: 200, ready: false });

  useEffect(() => {
    let alive = true;
    fetch("/api/meta")
      .then((r) => r.json())
      .then((m) => {
        if (alive && m && typeof m.exchangeRateCOP === "number") {
          setMeta({
            rate: m.exchangeRateCOP,
            packageSize: m.packageSize ?? 200,
            ready: true,
          });
        }
      })
      .catch(() => {
        /* se mantiene el fallback demo */
      });
    return () => {
      alive = false;
    };
  }, []);

  const api = useMemo(() => meta, [meta]);
  return <CurrencyContext.Provider value={api}>{children}</CurrencyContext.Provider>;
}

export function useCurrency(): CurrencyApi {
  return useContext(CurrencyContext);
}

// ---------------- Ensamble ----------------
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <CartProvider>
      <CurrencyProvider>{children}</CurrencyProvider>
    </CartProvider>
  );
}
