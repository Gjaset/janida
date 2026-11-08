import type { OrderStatus } from "@/lib/types";

/** Etiquetas de estados del tracking en español (panel admin) */
export function statusEs(status: OrderStatus | string): string {
  const map: Record<string, string> = {
    order_received: "Pedido recibido",
    payment_confirmed: "Pago confirmado",
    pickup_scheduled: "Recogida en finca programada",
    picked_up_farm: "Recogido en finca aliada",
    post_harvest_review: "Revisión y conteo en poscosecha",
    export_docs_ready: "Documentos de exportación listos (ICA y DIAN)",
    delivered_airline: "Entregado a la aerolínea",
    in_transit: "En tránsito",
    arrival_us: "Llegada a EE. UU. (aduana e inspección)",
    delivered: "Entregado",
    cancelled: "Cancelado",
  };
  return map[status] ?? status;
}

export const STATUS_ES = statusEs;
