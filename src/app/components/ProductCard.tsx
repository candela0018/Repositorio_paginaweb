import React, { useState } from 'react';
import { Link } from 'react-router';
import { Product } from '../data/products';
import { useCart } from '../context/CartContext';
import { ShoppingCart, Check, Plus, Minus } from 'lucide-react';

export function ProductCard({ product }: { product: Product }) {
  const { addToCart, items, updateQuantity, removeFromCart } = useCart();

  // Cantidad actual en el carrito (0 si no está)
  const itemEnCarrito = items.find(i => i.id === product.id);
  const cantidad      = itemEnCarrito?.quantity ?? 0;

  const [animando, setAnimando] = useState(false);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
    if (cantidad === 0) {
      setAnimando(true);
      setTimeout(() => setAnimando(false), 600);
    }
  };

  const handleMenos = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (cantidad === 1) removeFromCart(product.id);
    else updateQuantity(product.id, cantidad - 1);
  };

  const handleMas = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    updateQuantity(product.id, cantidad + 1);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden group border border-slate-100 flex flex-col h-full">
      <Link to={`/products/${product.id}`} className="block relative aspect-square overflow-hidden bg-slate-100">
        <img
          src={product.image_principal}
          alt={product.name}
          className="w-full h-full object-contain p-4 bg-white transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-slate-800 text-xs font-semibold px-2 py-1 rounded-md shadow-sm uppercase tracking-wider">
          {product.category}
        </div>
        {product.discount && (
          <div className="absolute top-3 right-3">
            <div className="bg-gradient-to-r from-red-600 to-orange-500 text-white px-3 py-1.5 rounded-lg shadow-lg transform rotate-2">
              <span className="text-sm font-bold">-{product.discount}%</span>
            </div>
          </div>
        )}
      </Link>

      <div className="p-5 flex flex-col flex-grow">
        <Link to={`/products/${product.id}`} className="block mb-2">
          <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-700 transition-colors line-clamp-1">
            {product.name}
          </h3>
        </Link>
        <p className="text-sm text-slate-500 line-clamp-2 mb-4 flex-grow">
          {product.description}
        </p>

        <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
          {/* Precio */}
          <div className="flex flex-col">
            {product.originalPrice && product.discount ? (
              <>
                <span className="text-xs text-slate-400 line-through">
                  {product.originalPrice.toFixed(2)} €
                </span>
                <span className="text-xl font-extrabold text-red-600">
                  {product.price.toFixed(2)} €
                </span>
              </>
            ) : (
              <span className="text-xl font-extrabold text-blue-700">
                {product.price.toFixed(2)} €
              </span>
            )}
          </div>

          {/* Botón / Contador */}
          {cantidad === 0 ? (
            /* ── Botón añadir ── */
            <button
              onClick={handleAdd}
              className={`relative flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-300 overflow-hidden
                ${animando
                  ? 'bg-green-500 text-white scale-95'
                  : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg hover:shadow-blue-200 hover:-translate-y-0.5 active:scale-95'
                }`}
              aria-label={`Añadir ${product.name} al carrito`}
            >
              {animando ? (
                <>
                  <Check size={16} className="shrink-0" />
                  <span>¡Listo!</span>
                </>
              ) : (
                <>
                  <ShoppingCart size={16} className="shrink-0" />
                  <span>Añadir</span>
                </>
              )}
            </button>
          ) : (
            /* ── Contador de cantidad ── */
            <div className="flex items-center gap-1 bg-blue-50 border border-blue-200 rounded-xl p-1">
              <button
                onClick={handleMenos}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-white border border-blue-200 text-blue-700 hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-colors active:scale-90"
                aria-label="Quitar uno"
              >
                <Minus size={14} />
              </button>
              <span className="w-8 text-center text-sm font-bold text-blue-700 tabular-nums">
                {cantidad}
              </span>
              <button
                onClick={handleMas}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors active:scale-90"
                aria-label="Añadir uno más"
              >
                <Plus size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}