import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../../lib/supabase';
import {
  CheckCircle, CreditCard, ShoppingBag, Truck,
  Loader2, AlertCircle, ArrowLeft
} from 'lucide-react';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generarNumeroPedido(): string {
  const fecha  = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 9000 + 1000);
  return `AHB-${fecha}-${random}`;
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function Checkout() {
  const { items, getTotalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const navigate  = useNavigate();

  // Formulario de Envío
  const [nombre,    setNombre]    = useState('');
  const [email,     setEmail]     = useState('');
  const [direccion, setDireccion] = useState('');
  const [ciudad,    setCiudad]    = useState('');
  const [cp,        setCp]        = useState('');
  const [provincia, setProvincia] = useState('');
  const [telefono,  setTelefono]  = useState('');
  const [notas,     setNotas]     = useState('');

  // Estado del proceso
  const [procesando, setProcesando] = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [exito,      setExito]      = useState(false);
  const [numeroPedido, setNumeroPedido] = useState('');

  // Si el carrito está vacío y no hay éxito, volver al carrito
  if (items.length === 0 && !exito) {
    navigate('/cart');
    return null;
  }

  const subtotal = getTotalPrice();
  const iva      = parseFloat((subtotal * 0.21).toFixed(2));
  const total    = parseFloat((subtotal + iva).toFixed(2));

  // ── Pantalla de éxito ────────────────────────────────────────────────────
  if (exito) {
    return (
      <div className="container mx-auto px-4 py-24 max-w-2xl text-center">
        <div className="bg-emerald-50 text-emerald-600 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8">
          <CheckCircle size={48} />
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900 mb-4">¡Pedido Confirmado!</h1>
        <p className="text-lg text-slate-600 mb-2">
          Gracias por confiar en <span className="font-bold">AHB Solutions</span>.
        </p>
        <p className="text-slate-500 mb-6">
          Tu número de pedido es: <span className="font-mono font-bold text-blue-700">{numeroPedido}</span>
        </p>
        <p className="text-slate-500 mb-10">
          Recibirás un correo con los detalles de tu pedido en breve.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
        >
          Volver al inicio
        </Link>
      </div>
    );
  }

  // ── Guardar pedido en Supabase TRAS el cobro de PayPal ───────────────────
  const handleApprove = async (details: any) => {
    try {
      const numPedido = generarNumeroPedido();

      // 1. Guardar dirección de envío
      const { data: dirData, error: dirError } = await supabase
        .from('direcciones_envio')
        .insert({
          usuario_id:       user?.id ?? null,
          nombre_completo:  nombre,
          direccion:        direccion,
          codigo_postal:    cp,
          ciudad:           ciudad,
          provincia:        provincia,
          pais:             'España',
          telefono:         telefono,
          es_predeterminada: false,
        })
        .select('id')
        .single();

      if (dirError) throw new Error('Error al guardar la dirección: ' + dirError.message);

      // 2. Crear el pedido
      const { data: pedidoData, error: pedidoError } = await supabase
        .from('pedidos')
        .insert({
          numero_pedido:      numPedido,
          usuario_id:         user?.id ?? null,
          direccion_envio_id: dirData.id,
          estado:             'procesando',
          subtotal:           subtotal,
          impuestos:          iva,
          gastos_envio:       0,
          total:              total,
          metodo_pago:        'paypal',
          notas:              notas || null,
          fecha_pedido:       new Date().toISOString(),
        })
        .select('id')
        .single();

      if (pedidoError) throw new Error('Error al crear el pedido: ' + pedidoError.message);

      // 3. Insertar líneas del pedido
      const lineas = items.map(item => ({
        pedido_id:      pedidoData.id,
        producto_id:    item.id,
        cantidad:       item.quantity,
        precio_unitario: item.price,
        precio_total:   parseFloat((item.price * item.quantity).toFixed(2)),
        personalizacion: null,
      }));

      const { error: lineasError } = await supabase
        .from('lineas_pedido')
        .insert(lineas);

      if (lineasError) throw new Error('Error al guardar los productos: ' + lineasError.message);

      // 4. Todo correcto: limpiar carrito y mostrar éxito
      setNumeroPedido(numPedido);
      clearCart();
      setExito(true);

    } catch (err: any) {
      console.error("Error en Supabase:", err);
      setError(err.message || 'Pago cobrado, pero ocurrió un error al guardarlo en base de datos. Contacta soporte.');
    }
  };

  // ── Formulario e Interfaz ────────────────────────────────────────────────
  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <Link to="/cart" className="inline-flex items-center gap-2 text-slate-500 hover:text-blue-600 font-medium mb-8 transition-colors">
        <ArrowLeft size={18} /> Volver al carrito
      </Link>

      <h1 className="text-4xl font-extrabold text-slate-900 mb-10 tracking-tight">Finalizar Compra</h1>

      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-6 text-sm">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

        {/* ── Formulario izquierda ── */}
        <div className="lg:col-span-2">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 space-y-10">

            {/* Datos de envío */}
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                <Truck className="text-blue-600" /> Detalles de Envío
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Nombre completo *</label>
                  <input
                    required type="text" value={nombre}
                    onChange={e => setNombre(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="Juan García López"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Email *</label>
                  <input
                    required type="email" value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="juan@ejemplo.com"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Teléfono</label>
                  <input
                    type="tel" value={telefono}
                    onChange={e => setTelefono(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="600 000 000"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Provincia</label>
                  <input
                    type="text" value={provincia}
                    onChange={e => setProvincia(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="Jaén"
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Dirección *</label>
                  <input
                    required type="text" value={direccion}
                    onChange={e => setDireccion(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="Calle Mayor 1, 2º A"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Ciudad *</label>
                  <input
                    required type="text" value={ciudad}
                    onChange={e => setCiudad(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="Úbeda"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Código Postal *</label>
                  <input
                    required type="text" value={cp}
                    onChange={e => setCp(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="23400"
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Notas del pedido</label>
                  <textarea
                    value={notas}
                    onChange={e => setNotas(e.target.value)}
                    rows={2}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                    placeholder="Instrucciones especiales de entrega (opcional)"
                  />
                </div>
              </div>
            </div>

            {/* Método de pago Real con PayPal */}
            <div className="border-t border-slate-100 pt-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                <CreditCard className="text-blue-600" /> Método de Pago Seguro
              </h2>
              
              {procesando ? (
                <div className="flex flex-col items-center justify-center p-8 bg-blue-50 rounded-xl border border-blue-100">
                  <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
                  <p className="text-blue-800 font-medium">Procesando y guardando tu pedido...</p>
                </div>
              ) : (
                <PayPalScriptProvider options={{ clientId: "test", currency: "EUR" }}>
                  <PayPalButtons
                    style={{ layout: "vertical", shape: "rect" }}
                    
                    onClick={(data, actions) => {
                      if (!nombre || !email || !direccion || !ciudad || !cp) {
                        setError("Por favor, completa todos los campos obligatorios de envío (*).");
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                        return actions.reject();
                      }
                      setError(null);
                      return actions.resolve();
                    }}

                    createOrder={(data, actions) => {
                      return actions.order.create({
                        intent: "CAPTURE",
                        purchase_units: [
                          {
                            description: "Pedido en AHB Solutions",
                            amount: {
                              currency_code: "EUR",
                              value: total.toFixed(2),
                            },
                          },
                        ],
                      });
                    }}

                    onApprove={async (data, actions) => {
                      if (!actions.order) return;
                      setProcesando(true);
                      
                      try {
                        const details = await actions.order.capture();
                        await handleApprove(details);
                      } catch (err: any) {
                        console.error("Error capturando pago:", err);
                        setError("Ocurrió un error en la conexión con PayPal. Inténtalo de nuevo.");
                      } finally {
                        setProcesando(false);
                      }
                    }}

                    onError={(err) => {
                      console.error("Error PayPal:", err);
                      setError("Se ha cancelado el pago o ha ocurrido un error. Inténtalo de nuevo.");
                      setProcesando(false);
                    }}
                  />
                </PayPalScriptProvider>
              )}
            </div>

          </div>
        </div>

        {/* ── Resumen derecha ── */}
        <div className="lg:col-span-1">
          <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200 sticky top-24">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3 border-b border-slate-200 pb-4">
              <ShoppingBag className="text-blue-600" /> Tu Pedido
            </h2>

            <div className="space-y-4 mb-6 max-h-80 overflow-y-auto pr-1">
              {items.map(item => (
                <div key={item.id} className="flex gap-4">
                  <img
                    src={item.image_principal}
                    alt={item.name}
                    className="w-16 h-16 object-cover rounded-lg bg-white border border-slate-200"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{item.name}</h4>
                    <p className="text-xs text-slate-500 mb-1">Cantidad: {item.quantity}</p>
                    <p className="text-sm font-bold text-blue-700">{(item.price * item.quantity).toFixed(2)} €</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-200 pt-4 space-y-3">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span>{subtotal.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Envío</span>
                <span className="text-emerald-600 font-semibold">Gratis</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>IVA (21%)</span>
                <span>{iva.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between items-end pt-4 border-t border-slate-200 mt-2">
                <span className="text-lg font-bold text-slate-900">Total</span>
                <span className="text-2xl font-black text-blue-700">{total.toFixed(2)} €</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}