import { useCart } from '../context/CartContext';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { ShoppingBag, Plus, Minus, Trash2, ArrowLeft, LogIn } from 'lucide-react';

export function Cart() {
  const { items, updateQuantity, removeFromCart, getTotalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const navigate  = useNavigate();

  const subtotal = getTotalPrice();
  const iva      = subtotal * 0.21;
  const total    = subtotal + iva;

  const handleFinalizar = () => {
    if (!user) {
      navigate('/login?from=checkout');
    } else {
      navigate('/checkout');
    }
  };

  if (items.length === 0) {
    return (
      <div className="bg-gray-50 min-h-screen py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-12 text-center">
            <ShoppingBag className="w-24 h-24 text-gray-300 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Tu carrito está vacío</h2>
            <p className="text-gray-600 mb-8">Añade productos de nuestro catálogo para comenzar tu compra</p>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-md font-semibold hover:bg-blue-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Ir al Catálogo
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Carrito de Compra</h1>
          <p className="mt-2 text-gray-600">Revisa tus productos antes de finalizar la compra</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Lista de productos */}
          <div className="lg:col-span-2 space-y-4">
            {items.map(item => (
              <div key={item.id} className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                <div className="flex gap-6">
                  <div className="w-32 h-32 flex-shrink-0 rounded-lg overflow-hidden bg-gray-200">
                    <img src={item.image_principal} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-grow">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{item.name}</h3>
                        <p className="text-sm text-gray-500">{item.category}</p>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                    <p className="text-gray-600 text-sm line-clamp-2 mb-4">{item.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-300 hover:bg-gray-100 transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-12 text-center font-semibold text-gray-900">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-300 hover:bg-gray-100 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">{item.price.toFixed(2)}€ / ud.</p>
                        <p className="text-xl font-bold text-blue-600">{(item.price * item.quantity).toFixed(2)}€</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Resumen */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 sticky top-24">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Resumen del Pedido</h2>
              <div className="space-y-4 mb-6 pb-6 border-b border-gray-200">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-semibold">{subtotal.toFixed(2)}€</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Envío</span>
                  <span className="font-semibold text-green-600">GRATIS</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>IVA (21%)</span>
                  <span className="font-semibold">{iva.toFixed(2)}€</span>
                </div>
              </div>
              <div className="flex justify-between items-center mb-6">
                <span className="text-lg font-bold text-gray-900">Total</span>
                <span className="text-2xl font-bold text-blue-600">{total.toFixed(2)}€</span>
              </div>

              {/* Aviso si no está logueado */}
              {!user && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2 text-sm text-amber-700">
                  <LogIn className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>Necesitas iniciar sesión para finalizar la compra.</span>
                </div>
              )}

              <button
                onClick={handleFinalizar}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors mb-3 flex items-center justify-center gap-2"
              >
                {!user && <LogIn className="w-4 h-4" />}
                {user ? 'Finalizar Compra' : 'Iniciar sesión para comprar'}
              </button>

              <Link
                to="/products"
                className="block w-full text-center border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Seguir Comprando
              </Link>

              <button
                onClick={clearCart}
                className="w-full mt-4 text-red-600 text-sm font-medium hover:text-red-700"
              >
                Vaciar carrito
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}