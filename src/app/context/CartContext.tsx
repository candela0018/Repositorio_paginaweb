import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Product } from '../data/products';
import { supabase } from '../../lib/supabase';
import { useAuth } from './AuthContext';

export interface CartItem extends Product {
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  cargandoCarrito: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const LS_KEY = 'ahb_carrito_anonimo';

// ─── Helpers localStorage ────────────────────────────────────────────────────

function leerCarritoLocal(): CartItem[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function guardarCarritoLocal(items: CartItem[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(items));
}

function limpiarCarritoLocal() {
  localStorage.removeItem(LS_KEY);
}

// ─── Provider ────────────────────────────────────────────────────────────────

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [items, setItems]                     = useState<CartItem[]>([]);
  const [carritoId, setCarritoId]             = useState<string | null>(null);
  const [cargandoCarrito, setCargandoCarrito] = useState(true);

  // ── Cargar carrito al montar o cambiar usuario ──────────────────────────

  useEffect(() => {
    if (user) {
      cargarDesdeSupabase();
    } else {
      setItems(leerCarritoLocal());
      setCargandoCarrito(false);
    }
  }, [user]);

  // ── Al hacer login: fusionar carrito local con el de Supabase ──────────

  useEffect(() => {
    if (!user) return;
    const local = leerCarritoLocal();
    if (local.length > 0) {
      fusionarCarritoLocal(local);
    }
  }, [user]);

  // ── Sincronizar localStorage cuando cambian items (anónimo) ────────────

  useEffect(() => {
    if (!user) {
      guardarCarritoLocal(items);
    }
  }, [items, user]);

  // ─── Supabase: cargar carrito del usuario ────────────────────────────────

  const cargarDesdeSupabase = async () => {
    if (!user) return;
    setCargandoCarrito(true);

    let { data: carrito } = await supabase
      .from('carritos')
      .select('id')
      .eq('usuario_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!carrito) {
      const { data: nuevo } = await supabase
        .from('carritos')
        .insert({ usuario_id: user.id })
        .select('id')
        .single();
      carrito = nuevo;
    }

    if (!carrito) { setCargandoCarrito(false); return; }
    setCarritoId(carrito.id);

    const { data: lineas } = await supabase
      .from('items_carrito')
      .select('*')
      .eq('carrito_id', carrito.id);

    if (!lineas || lineas.length === 0) {
      setItems([]);
      setCargandoCarrito(false);
      return;
    }

    const ids = lineas.map(l => l.producto_id);
    const [{ data: prods }, { data: cats }, { data: ofs }] = await Promise.all([
      supabase.from('productos').select('*').in('id', ids),
      supabase.from('categorias_productos').select('id, nombre_categoria'),
      supabase.from('ofertas').select('*').eq('activa', true),
    ]);

    const catMap: Record<string, string> = {};
    (cats || []).forEach(c => { catMap[c.id] = c.nombre_categoria; });

    const ofertaMap: Record<string, any> = {};
    const ahora = new Date();
    (ofs || []).forEach(o => {
      if (new Date(o.fecha_inicio) <= ahora && ahora <= new Date(o.fecha_fin)) {
        ofertaMap[o.producto_id] = o;
      }
    });

    const itemsRecuperados: CartItem[] = lineas.map(l => {
      const p  = (prods || []).find(x => x.id === l.producto_id);
      const of = ofertaMap[l.producto_id];
      if (!p) return null;
      return {
        id:              p.id,
        name:            p.nombre,
        description:     p.descripcion || '',
        price:           p.precio,
        originalPrice:   of ? (p.precio_original ?? undefined) : undefined,
        discount:        of ? of.porcentaje_descuento : undefined,
        category:        catMap[p.categoria_id] || '',
        image_principal: p.imagen_principal || '',
        stock:           p.stock ?? undefined,
        quantity:        l.cantidad,
      } as CartItem;
    }).filter(Boolean) as CartItem[];

    setItems(itemsRecuperados);
    setCargandoCarrito(false);
  };

  // ─── Fusionar carrito anónimo con Supabase al hacer login ────────────────

  const fusionarCarritoLocal = async (local: CartItem[]) => {
    if (!user || !local.length) return;

    let cid = carritoId;
    if (!cid) {
      let { data: carrito } = await supabase
        .from('carritos')
        .select('id')
        .eq('usuario_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!carrito) {
        const { data: nuevo } = await supabase
          .from('carritos')
          .insert({ usuario_id: user.id })
          .select('id')
          .single();
        carrito = nuevo;
      }
      cid = carrito?.id || null;
      if (cid) setCarritoId(cid);
    }

    if (!cid) return;

    const { data: actuales } = await supabase
      .from('items_carrito')
      .select('*')
      .eq('carrito_id', cid);

    for (const item of local) {
      const existe = (actuales || []).find(a => a.producto_id === item.id);
      if (existe) {
        await supabase
          .from('items_carrito')
          .update({ cantidad: existe.cantidad + item.quantity })
          .eq('id', existe.id);
      } else {
        await supabase
          .from('items_carrito')
          .insert({ carrito_id: cid, producto_id: item.id, cantidad: item.quantity });
      }
    }

    limpiarCarritoLocal();
    await cargarDesdeSupabase();
  };

  // ─── Sincronizar un item con Supabase ────────────────────────────────────

  const syncSupabase = useCallback(async (
    productId: string,
    cantidad: number,
    accion: 'upsert' | 'delete'
  ) => {
    if (!user || !carritoId) return;

    if (accion === 'delete') {
      await supabase
        .from('items_carrito')
        .delete()
        .eq('carrito_id', carritoId)
        .eq('producto_id', productId);
    } else {
      const { data: existe } = await supabase
        .from('items_carrito')
        .select('id')
        .eq('carrito_id', carritoId)
        .eq('producto_id', productId)
        .single();

      if (existe) {
        await supabase
          .from('items_carrito')
          .update({ cantidad })
          .eq('id', existe.id);
      } else {
        await supabase
          .from('items_carrito')
          .insert({ carrito_id: carritoId, producto_id: productId, cantidad });
      }
    }
  }, [user, carritoId]);

  // ─── Limpiar carrito en Supabase (borra items Y el carrito) ─────────────

  const limpiarSupabase = useCallback(async () => {
    if (!user || !carritoId) return;
    // Primero borra los items
    await supabase.from('items_carrito').delete().eq('carrito_id', carritoId);
    // Luego borra el carrito contenedor
    await supabase.from('carritos').delete().eq('id', carritoId);
    // Resetea el id para que la próxima vez cree uno nuevo
    setCarritoId(null);
  }, [user, carritoId]);

  // ─── Acciones del carrito ────────────────────────────────────────────────

  const addToCart = (product: Product) => {
    setItems(prev => {
      const existe = prev.find(i => i.id === product.id);
      const nuevos = existe
        ? prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i)
        : [...prev, { ...product, quantity: 1 }];
      const nueva_cantidad = existe ? existe.quantity + 1 : 1;
      syncSupabase(product.id, nueva_cantidad, 'upsert');
      return nuevos;
    });
  };

  const removeFromCart = (productId: string) => {
    setItems(prev => prev.filter(i => i.id !== productId));
    syncSupabase(productId, 0, 'delete');
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) { removeFromCart(productId); return; }
    setItems(prev => prev.map(i => i.id === productId ? { ...i, quantity } : i));
    syncSupabase(productId, quantity, 'upsert');
  };

  const clearCart = () => {
    setItems([]);
    limpiarCarritoLocal();
    limpiarSupabase();
  };

  const getTotalItems = () => items.reduce((t, i) => t + i.quantity, 0);
  const getTotalPrice = () => items.reduce((t, i) => t + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{
      items, addToCart, removeFromCart, updateQuantity,
      clearCart, getTotalItems, getTotalPrice, cargandoCarrito,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
}