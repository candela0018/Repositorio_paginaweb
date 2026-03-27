// ─── Tipo Product ─────────────────────────────────────────────────────────────
// Esta interfaz es compartida por ProductCard, el carrito y useProductos.
// Los productos ya NO se definen aquí: vienen de Supabase a través de useProductos.

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  image_principal: string;
  description: string;
  originalPrice?: number; // Precio antes del descuento
  discount?: number;      // Porcentaje de descuento (ej: 30 = 30 %)
  stock?: number;         // Unidades disponibles
  endDate?: string;       // Fecha fin de oferta (ISO: "YYYY-MM-DD")
}