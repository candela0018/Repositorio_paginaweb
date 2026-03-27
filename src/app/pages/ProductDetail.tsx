import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import { supabase } from '../../lib/supabase';
import { Product } from '../data/products';
import { useCart } from '../context/CartContext';
import { ArrowLeft, ShoppingCart, CheckCircle, ShieldCheck, Tag, Clock } from 'lucide-react';

function ProductDetailSkeleton() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-7xl animate-pulse">
      <div className="h-5 w-36 bg-gray-200 rounded mb-10" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20 bg-white rounded-3xl p-6 md:p-12 shadow-sm border border-slate-100">
        {/* Imagen */}
        <div className="rounded-2xl bg-gray-200 aspect-square" />
        {/* Info */}
        <div className="flex flex-col justify-center space-y-5">
          <div className="flex gap-2">
            <div className="h-6 w-20 bg-gray-200 rounded-full" />
          </div>
          <div className="h-10 bg-gray-200 rounded w-4/5" />
          <div className="h-10 bg-gray-200 rounded w-1/3" />
          <div className="space-y-2 pt-2">
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-5/6" />
            <div className="h-4 bg-gray-200 rounded w-4/6" />
          </div>
          <div className="flex gap-4 pt-4">
            <div className="h-14 bg-gray-200 rounded-xl w-36" />
            <div className="h-14 bg-gray-200 rounded-xl flex-1" />
          </div>
          <div className="h-16 bg-gray-100 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const { addToCart } = useCart();

  const [product, setProduct]   = useState<Product | null>(null);
  const [cargando, setCargando] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded]       = useState(false);

  useEffect(() => {
    if (!id) return;

    async function cargar() {
      setCargando(true);

      const [
        { data: p,    error: eP },
        { data: cats            },
        { data: ofs             },
      ] = await Promise.all([
        supabase.from('productos').select('*').eq('id', id).single(),
        supabase.from('categorias_productos').select('id, nombre_categoria'),
        supabase.from('ofertas').select('*').eq('producto_id', id).eq('activa', true),
      ]);

      if (eP || !p) { setCargando(false); return; }

      const catMap: Record<string, string> = {};
      (cats || []).forEach(c => { catMap[c.id] = c.nombre_categoria; });

      const oferta = (ofs || []).find(o =>
        new Date(o.fecha_inicio) <= new Date() && new Date() <= new Date(o.fecha_fin)
      ) || null;

      const tieneOferta = !!oferta;

      setProduct({
        id:              p.id,
        name:            p.nombre,
        description:     p.descripcion || '',
        price:           p.precio,
        originalPrice:   tieneOferta ? (p.precio_original ?? undefined) : undefined,
        discount:        tieneOferta ? oferta.porcentaje_descuento : undefined,
        category:        catMap[p.categoria_id] || '',
        image_principal: p.imagen_principal || '',
        stock:           p.stock ?? undefined,
        endDate:         tieneOferta
                           ? new Date(oferta.fecha_fin).toISOString().split('T')[0]
                           : undefined,
      });

      setCargando(false);
    }

    cargar();
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;
    for (let i = 0; i < quantity; i++) addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const calculateTimeLeft = (endDate?: string) => {
    if (!endDate) return 0;
    const diff = new Date(endDate).getTime() - new Date().getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  if (cargando) return <ProductDetailSkeleton />;

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <h2 className="text-3xl font-bold text-slate-900 mb-6">Producto no encontrado</h2>
        <Link to="/products" className="text-blue-600 font-semibold hover:underline flex items-center justify-center gap-2">
          <ArrowLeft size={20} /> Volver a Productos
        </Link>
      </div>
    );
  }

  const isOnOffer = product.originalPrice && product.discount;
  const savings   = isOnOffer ? ((product.originalPrice ?? 0) - product.price) : 0;

  return (
    <div className="container mx-auto px-4 py-12 max-w-7xl">
      <Link to="/products" className="inline-flex items-center gap-2 text-slate-500 hover:text-blue-600 font-medium mb-10 transition-colors">
        <ArrowLeft size={20} /> Volver al catálogo
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20 bg-white rounded-3xl p-6 md:p-12 shadow-sm border border-slate-100">

        {/* Imagen */}
        <div className="rounded-2xl overflow-hidden bg-slate-100 aspect-square relative">
          <img
            src={product.image_principal}
            alt={product.name}
            className="w-full h-full object-contain p-6 bg-white shadow-sm hover:scale-105 transition-transform duration-700"
          />
          {isOnOffer && (
            <div className="absolute top-6 right-6">
              <div className="bg-gradient-to-r from-red-600 to-orange-500 text-white px-4 py-3 rounded-lg shadow-lg transform rotate-2">
                <span className="text-3xl font-bold">-{product.discount}%</span>
              </div>
            </div>
          )}
          {isOnOffer && product.stock && product.stock < 10 && (
            <div className="absolute bottom-6 left-6">
              <span className="bg-orange-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                ¡Solo {product.stock} unidades!
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col justify-center">
          <div className="mb-4">
            <div className="flex items-center gap-3 mb-4">
              <span className="inline-block bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                {product.category}
              </span>
              {isOnOffer && (
                <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  <Tag size={12} /> OFERTA
                </span>
              )}
            </div>

            <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">
              {product.name}
            </h1>

            {isOnOffer ? (
              <div className="mb-6">
                <div className="flex items-baseline gap-3 mb-2">
                  <p className="text-5xl font-black text-red-600">{product.price.toFixed(2)} €</p>
                  <p className="text-3xl text-gray-400 line-through font-semibold">{product.originalPrice?.toFixed(2)} €</p>
                </div>
                <div className="inline-block bg-green-100 text-green-800 px-4 py-2 rounded-lg">
                  <p className="text-lg font-bold">
                    ¡Ahorras {savings.toFixed(2)}€! ({product.discount}% de descuento)
                  </p>
                </div>
                {product.endDate && (
                  <div className="flex items-center gap-2 mt-4 text-orange-600">
                    <Clock size={20} />
                    <span className="font-semibold text-sm">
                      ⏰ Oferta válida por {calculateTimeLeft(product.endDate)} días más
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-4xl font-black text-blue-700 mb-8">{product.price.toFixed(2)} €</p>
            )}
          </div>

          <p className="text-lg text-slate-600 mb-10 leading-relaxed border-b border-slate-200 pb-10">
            {product.description}
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-6 mb-10">
            <div className="flex items-center border border-slate-300 rounded-xl bg-white w-full sm:w-auto h-14">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-6 text-slate-500 hover:text-slate-900 font-bold text-xl h-full transition-colors"
              >
                -
              </button>
              <span className="w-12 text-center font-bold text-lg">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="px-6 text-slate-500 hover:text-slate-900 font-bold text-xl h-full transition-colors"
              >
                +
              </button>
            </div>

            <button
              onClick={handleAddToCart}
              className={`flex-1 w-full flex items-center justify-center gap-3 h-14 rounded-xl font-bold text-lg transition-all ${
                added
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-200'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200'
              }`}
            >
              {added ? (
                <><CheckCircle size={24} /> ¡Añadido!</>
              ) : (
                <><ShoppingCart size={24} /> Añadir al Carrito</>
              )}
            </button>
          </div>

          <div className="flex items-center gap-4 text-slate-500 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <ShieldCheck className="text-blue-600" size={28} />
            <p className="text-sm font-medium">Garantía de calidad de 2 años en todos nuestros productos de metacrilato.</p>
          </div>
        </div>

      </div>
    </div>
  );
}