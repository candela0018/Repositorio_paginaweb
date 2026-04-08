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

// ─── Helpers y Datos ──────────────────────────────────────────────────────────

// Lista exhaustiva de países y sus prefijos telefónicos
const PAISES = [
  { nombre: 'Afganistán', prefijo: '+93' }, { nombre: 'Albania', prefijo: '+355' }, { nombre: 'Alemania', prefijo: '+49' }, { nombre: 'Andorra', prefijo: '+376' },
  { nombre: 'Angola', prefijo: '+244' }, { nombre: 'Antigua y Barbuda', prefijo: '+1' }, { nombre: 'Arabia Saudita', prefijo: '+966' }, { nombre: 'Argelia', prefijo: '+213' },
  { nombre: 'Argentina', prefijo: '+54' }, { nombre: 'Armenia', prefijo: '+374' }, { nombre: 'Australia', prefijo: '+61' }, { nombre: 'Austria', prefijo: '+43' },
  { nombre: 'Azerbaiyán', prefijo: '+994' }, { nombre: 'Bahamas', prefijo: '+1' }, { nombre: 'Bangladés', prefijo: '+880' }, { nombre: 'Barbados', prefijo: '+1' },
  { nombre: 'Baréin', prefijo: '+973' }, { nombre: 'Bélgica', prefijo: '+32' }, { nombre: 'Belice', prefijo: '+501' }, { nombre: 'Benín', prefijo: '+229' },
  { nombre: 'Bielorrusia', prefijo: '+375' }, { nombre: 'Birmania', prefijo: '+95' }, { nombre: 'Bolivia', prefijo: '+591' }, { nombre: 'Bosnia y Herzegovina', prefijo: '+387' },
  { nombre: 'Botsuana', prefijo: '+267' }, { nombre: 'Brasil', prefijo: '+55' }, { nombre: 'Brunéi', prefijo: '+673' }, { nombre: 'Bulgaria', prefijo: '+359' },
  { nombre: 'Burkina Faso', prefijo: '+226' }, { nombre: 'Burundi', prefijo: '+257' }, { nombre: 'Bután', prefijo: '+975' }, { nombre: 'Cabo Verde', prefijo: '+238' },
  { nombre: 'Camboya', prefijo: '+855' }, { nombre: 'Camerún', prefijo: '+237' }, { nombre: 'Canadá', prefijo: '+1' }, { nombre: 'Catar', prefijo: '+974' },
  { nombre: 'Chad', prefijo: '+235' }, { nombre: 'Chile', prefijo: '+56' }, { nombre: 'China', prefijo: '+86' }, { nombre: 'Chipre', prefijo: '+357' },
  { nombre: 'Ciudad del Vaticano', prefijo: '+379' }, { nombre: 'Colombia', prefijo: '+57' }, { nombre: 'Comoras', prefijo: '+269' }, { nombre: 'Congo', prefijo: '+242' },
  { nombre: 'Corea del Sur', prefijo: '+82' }, { nombre: 'Costa Rica', prefijo: '+506' }, { nombre: 'Costa de Marfil', prefijo: '+225' }, { nombre: 'Croacia', prefijo: '+385' },
  { nombre: 'Cuba', prefijo: '+53' }, { nombre: 'Dinamarca', prefijo: '+45' }, { nombre: 'Dominica', prefijo: '+1' }, { nombre: 'Ecuador', prefijo: '+593' },
  { nombre: 'Egipto', prefijo: '+20' }, { nombre: 'El Salvador', prefijo: '+503' }, { nombre: 'Emiratos Árabes Unidos', prefijo: '+971' }, { nombre: 'Eritrea', prefijo: '+291' },
  { nombre: 'Eslovaquia', prefijo: '+421' }, { nombre: 'Eslovenia', prefijo: '+386' }, { nombre: 'España', prefijo: '+34' }, { nombre: 'Estados Unidos', prefijo: '+1' },
  { nombre: 'Estonia', prefijo: '+372' }, { nombre: 'Etiopía', prefijo: '+251' }, { nombre: 'Filipinas', prefijo: '+63' }, { nombre: 'Finlandia', prefijo: '+358' },
  { nombre: 'Fiyi', prefijo: '+679' }, { nombre: 'Francia', prefijo: '+33' }, { nombre: 'Gabón', prefijo: '+241' }, { nombre: 'Gambia', prefijo: '+220' },
  { nombre: 'Georgia', prefijo: '+995' }, { nombre: 'Ghana', prefijo: '+233' }, { nombre: 'Granada', prefijo: '+1' }, { nombre: 'Grecia', prefijo: '+30' },
  { nombre: 'Guatemala', prefijo: '+502' }, { nombre: 'Guinea', prefijo: '+224' }, { nombre: 'Guinea-Bisáu', prefijo: '+245' }, { nombre: 'Guinea Ecuatorial', prefijo: '+240' },
  { nombre: 'Guyana', prefijo: '+592' }, { nombre: 'Haití', prefijo: '+509' }, { nombre: 'Honduras', prefijo: '+504' }, { nombre: 'Hungría', prefijo: '+36' },
  { nombre: 'India', prefijo: '+91' }, { nombre: 'Indonesia', prefijo: '+62' }, { nombre: 'Irak', prefijo: '+964' }, { nombre: 'Irán', prefijo: '+98' },
  { nombre: 'Irlanda', prefijo: '+353' }, { nombre: 'Islandia', prefijo: '+354' }, { nombre: 'Islas Marshall', prefijo: '+692' }, { nombre: 'Islas Salomón', prefijo: '+677' },
  { nombre: 'Israel', prefijo: '+972' }, { nombre: 'Italia', prefijo: '+39' }, { nombre: 'Jamaica', prefijo: '+1' }, { nombre: 'Japón', prefijo: '+81' },
  { nombre: 'Jordania', prefijo: '+962' }, { nombre: 'Kazajistán', prefijo: '+7' }, { nombre: 'Kenia', prefijo: '+254' }, { nombre: 'Kirguistán', prefijo: '+996' },
  { nombre: 'Kiribati', prefijo: '+686' }, { nombre: 'Kuwait', prefijo: '+965' }, { nombre: 'Laos', prefijo: '+856' }, { nombre: 'Lesoto', prefijo: '+266' },
  { nombre: 'Letonia', prefijo: '+371' }, { nombre: 'Líbano', prefijo: '+961' }, { nombre: 'Liberia', prefijo: '+231' }, { nombre: 'Libia', prefijo: '+218' },
  { nombre: 'Liechtenstein', prefijo: '+423' }, { nombre: 'Lituania', prefijo: '+370' }, { nombre: 'Luxemburgo', prefijo: '+352' }, { nombre: 'Macedonia del Norte', prefijo: '+389' },
  { nombre: 'Madagascar', prefijo: '+261' }, { nombre: 'Malasia', prefijo: '+60' }, { nombre: 'Malaui', prefijo: '+265' }, { nombre: 'Maldivas', prefijo: '+960' },
  { nombre: 'Malí', prefijo: '+223' }, { nombre: 'Malta', prefijo: '+356' }, { nombre: 'Marruecos', prefijo: '+212' }, { nombre: 'Mauricio', prefijo: '+230' },
  { nombre: 'Mauritania', prefijo: '+222' }, { nombre: 'México', prefijo: '+52' }, { nombre: 'Micronesia', prefijo: '+691' }, { nombre: 'Moldavia', prefijo: '+373' },
  { nombre: 'Mónaco', prefijo: '+377' }, { nombre: 'Mongolia', prefijo: '+976' }, { nombre: 'Montenegro', prefijo: '+382' }, { nombre: 'Mozambique', prefijo: '+258' },
  { nombre: 'Namibia', prefijo: '+264' }, { nombre: 'Nauru', prefijo: '+674' }, { nombre: 'Nepal', prefijo: '+977' }, { nombre: 'Nicaragua', prefijo: '+505' },
  { nombre: 'Níger', prefijo: '+227' }, { nombre: 'Nigeria', prefijo: '+234' }, { nombre: 'Noruega', prefijo: '+47' }, { nombre: 'Nueva Zelanda', prefijo: '+64' },
  { nombre: 'Omán', prefijo: '+968' }, { nombre: 'Países Bajos', prefijo: '+31' }, { nombre: 'Pakistán', prefijo: '+92' }, { nombre: 'Palaos', prefijo: '+680' },
  { nombre: 'Panamá', prefijo: '+507' }, { nombre: 'Papúa Nueva Guinea', prefijo: '+675' }, { nombre: 'Paraguay', prefijo: '+595' }, { nombre: 'Perú', prefijo: '+51' },
  { nombre: 'Polonia', prefijo: '+48' }, { nombre: 'Portugal', prefijo: '+351' }, { nombre: 'Reino Unido', prefijo: '+44' }, { nombre: 'República Centroafricana', prefijo: '+236' },
  { nombre: 'República Checa', prefijo: '+420' }, { nombre: 'República Democrática del Congo', prefijo: '+243' }, { nombre: 'República Dominicana', prefijo: '+1' },
  { nombre: 'Ruanda', prefijo: '+250' }, { nombre: 'Rumania', prefijo: '+40' }, { nombre: 'Rusia', prefijo: '+7' }, { nombre: 'Samoa', prefijo: '+685' },
  { nombre: 'San Cristóbal y Nieves', prefijo: '+1' }, { nombre: 'San Marino', prefijo: '+378' }, { nombre: 'San Vicente y las Granadinas', prefijo: '+1' },
  { nombre: 'Santa Lucía', prefijo: '+1' }, { nombre: 'Santo Tomé y Príncipe', prefijo: '+239' }, { nombre: 'Senegal', prefijo: '+221' }, { nombre: 'Serbia', prefijo: '+381' },
  { nombre: 'Seychelles', prefijo: '+248' }, { nombre: 'Sierra Leona', prefijo: '+232' }, { nombre: 'Singapur', prefijo: '+65' }, { nombre: 'Siria', prefijo: '+963' },
  { nombre: 'Somalia', prefijo: '+252' }, { nombre: 'Sri Lanka', prefijo: '+94' }, { nombre: 'Suazilandia', prefijo: '+268' }, { nombre: 'Sudáfrica', prefijo: '+27' },
  { nombre: 'Sudán', prefijo: '+249' }, { nombre: 'Sudán del Sur', prefijo: '+211' }, { nombre: 'Suecia', prefijo: '+46' }, { nombre: 'Suiza', prefijo: '+41' },
  { nombre: 'Surinam', prefijo: '+597' }, { nombre: 'Tailandia', prefijo: '+66' }, { nombre: 'Tanzania', prefijo: '+255' }, { nombre: 'Tayikistán', prefijo: '+992' },
  { nombre: 'Timor Oriental', prefijo: '+670' }, { nombre: 'Togo', prefijo: '+228' }, { nombre: 'Tonga', prefijo: '+676' }, { nombre: 'Trinidad y Tobago', prefijo: '+1' },
  { nombre: 'Túnez', prefijo: '+216' }, { nombre: 'Turkmenistán', prefijo: '+993' }, { nombre: 'Turquía', prefijo: '+90' }, { nombre: 'Tuvalu', prefijo: '+688' },
  { nombre: 'Ucrania', prefijo: '+380' }, { nombre: 'Uganda', prefijo: '+256' }, { nombre: 'Uruguay', prefijo: '+598' }, { nombre: 'Uzbekistán', prefijo: '+998' },
  { nombre: 'Vanuatu', prefijo: '+678' }, { nombre: 'Venezuela', prefijo: '+58' }, { nombre: 'Vietnam', prefijo: '+84' }, { nombre: 'Yemen', prefijo: '+967' },
  { nombre: 'Yibuti', prefijo: '+253' }, { nombre: 'Zambia', prefijo: '+260' }, { nombre: 'Zimbabue', prefijo: '+263' }
];

function generarNumeroPedido(): string {
  const fecha  = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 9000 + 1000);
  return `AHB-${fecha}-${random}`;
}

// Formateador para poner espacios en el teléfono (ej: 600 000 000)
function formatearTelefono(tel: string): string {
  if (!tel) return '';
  if (tel.length > 6) {
    return `${tel.slice(0, 3)} ${tel.slice(3, 6)} ${tel.slice(6, 9)}`;
  }
  if (tel.length > 3) {
    return `${tel.slice(0, 3)} ${tel.slice(3)}`;
  }
  return tel;
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function Checkout() {
  const { items, getTotalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const navigate  = useNavigate();

  // Formulario de Envío
  const [pais,      setPais]      = useState('España');
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

  // Busca automáticamente el prefijo del país seleccionado
  const getPrefijoTelefono = () => {
    const paisSeleccionado = PAISES.find(p => p.nombre === pais);
    return paisSeleccionado ? paisSeleccionado.prefijo : '+34';
  };

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
          pais:             pais, // Se guarda el país real
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
                
                {/* Selector Exhaustivo de País */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">País *</label>
                  <div className="relative">
                    <select
                      required
                      value={pais}
                      onChange={e => setPais(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer text-slate-700"
                    >
                      {PAISES.map(p => (
                        <option key={p.nombre} value={p.nombre}>{p.nombre}</option>
                      ))}
                    </select>
                    {/* Flechita para el select personalizado */}
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Provincia / Región</label>
                  <input
                    type="text" value={provincia}
                    onChange={e => setProvincia(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="Madrid"
                  />
                </div>

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

                {/* Teléfono Dinámico con Espacios */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Teléfono *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="text-slate-500 font-medium">{getPrefijoTelefono()}</span>
                    </div>
                    <input
                      required
                      type="tel"
                      value={formatearTelefono(telefono)}
                      onChange={e => {
                        const soloNumeros = e.target.value.replace(/\D/g, ''); 
                        if (soloNumeros.length <= 9) {
                          setTelefono(soloNumeros); 
                        }
                      }}
                      // Ajustamos el margen dependiendo del tamaño del prefijo elegido (algunos prefijos como +1-242 son muy largos)
                      className={`w-full ${getPrefijoTelefono().length > 4 ? 'pl-16' : 'pl-14'} pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all`}
                      placeholder="600 000 000"
                    />
                  </div>
                </div>

                {/* Código Postal Limitado */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Código Postal *</label>
                  <input
                    required 
                    type="text" 
                    value={cp}
                    maxLength={10} // Restricción universal de código postal máximo
                    onChange={e => setCp(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="28001"
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
                    placeholder="Madrid"
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
                      if (!nombre || !email || !telefono || !direccion || !ciudad || !cp || !pais) {
                        setError("Por favor, completa todos los campos obligatorios de envío (*).");
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                        return actions.reject();
                      }
                      
                      if (telefono.length !== 9) {
                        setError("El teléfono debe tener exactamente 9 dígitos.");
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