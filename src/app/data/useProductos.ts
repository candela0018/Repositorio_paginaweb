
import { useEffect, useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Product } from './products';

// ─── Caché global en memoria ──────────────────────────────────────────────────
// Persiste entre navegaciones sin necesidad de localStorage.
// Se invalida solo cuando el usuario recarga la pestaña.

let cache: Product[] | null = null;
let cachePromise: Promise<Product[]> | null = null;

function mapearProducto(row: any, catMap: Record<string, string>): Product {
  const tieneOferta =
    row.oferta?.activa &&
    new Date(row.oferta.fecha_inicio) <= new Date() &&
    new Date() <= new Date(row.oferta.fecha_fin);

  return {
    id:             row.id,
    name:           row.nombre,
    description:    row.descripcion || '',
    price:          row.precio,
    originalPrice:  tieneOferta ? (row.precio_original ?? undefined) : undefined,
    discount:       tieneOferta ? row.oferta.porcentaje_descuento : undefined,
    category:       catMap[row.categoria_id] || '',
    image_principal: row.imagen_principal || '',
    stock:          row.stock ?? undefined,
    endDate:        tieneOferta
                      ? new Date(row.oferta.fecha_fin).toISOString().split('T')[0]
                      : undefined,
  };
}

async function fetchProductos(): Promise<Product[]> {
  const [
    { data: cats  },
    { data: prods },
    { data: ofs   },
  ] = await Promise.all([
    supabase.from('categorias_productos').select('id, nombre_categoria'),
    supabase.from('productos').select('*').eq('activo', true).order('nombre', { ascending: true }),
    supabase.from('ofertas').select('*').eq('activa', true),
  ]);

  const catMap: Record<string, string> = {};
  (cats || []).forEach(c => { catMap[c.id] = c.nombre_categoria; });

  const ofertaMap: Record<string, any> = {};
  (ofs || []).forEach(o => { ofertaMap[o.producto_id] = o; });

  return (prods || []).map(p => mapearProducto({ ...p, oferta: ofertaMap[p.id] || null }, catMap));
}

// ─── Hook principal ───────────────────────────────────────────────────────────

export function useProductos() {
  // Si ya hay caché, arrancamos con ella directamente (sin spinner)
  const [productos, setProductos] = useState<Product[]>(cache || []);
  const [cargando, setCargando]   = useState(!cache);
  const [error, setError]         = useState<string | null>(null);
  const montado = useRef(true);

  useEffect(() => {
    montado.current = true;
    return () => { montado.current = false; };
  }, []);

  useEffect(() => {
    if (cache) {
      // Ya tenemos datos — no mostramos spinner
      setProductos(cache);
      setCargando(false);
      return;
    }

    // Compartir la misma promesa si ya hay una petición en vuelo
    if (!cachePromise) {
      cachePromise = fetchProductos();
    }

    cachePromise
      .then(data => {
        cache = data;
        cachePromise = null;
        if (montado.current) {
          setProductos(data);
          setCargando(false);
        }
      })
      .catch(err => {
        cachePromise = null;
        if (montado.current) {
          setError(err.message || 'Error al cargar productos');
          setCargando(false);
        }
      });
  }, []);

  // Función para forzar recarga (útil tras crear/editar desde Admin)
  const recargar = async () => {
    cache = null;
    cachePromise = null;
    setCargando(true);
    try {
      const data = await fetchProductos();
      cache = data;
      if (montado.current) { setProductos(data); setCargando(false); }
    } catch (err: any) {
      if (montado.current) { setError(err.message); setCargando(false); }
    }
  };

  return { productos, cargando, error, recargar };
}

// Precarga proactiva — llámala en App.tsx o en el router para que los datos
// estén listos antes de que el usuario navegue al catálogo.
export function precargarProductos() {
  if (!cache && !cachePromise) {
    cachePromise = fetchProductos().then(data => { cache = data; return data; });
  }
}