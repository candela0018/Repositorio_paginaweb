import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { supabase } from '../../lib/supabase';
import {
  LayoutDashboard, Users, Package, ArrowLeft, LogOut,
  Plus, Edit, Trash2, Eye, EyeOff, X, Save, Search, Tag,
  ChevronRight, Calendar, FolderOpen, Link, Percent,
  ShoppingBag, Clock, CheckCircle, XCircle, Truck, RefreshCw,
} from 'lucide-react';

// ─── Interfaces ──────────────────────────────────────────────────────────────

interface Usuario {
  id: string;
  nombre_completo: string;
  email: string;
  rol: string;
  activo: boolean;
  created_at: string;
}

interface Categoria {
  id: string;
  nombre_categoria: string;
  codigo_categoria: string;
}

interface Oferta {
  id: string;
  producto_id: string;
  porcentaje_descuento: number;
  fecha_inicio: string;
  fecha_fin: string;
  activa: boolean;
}

interface Producto {
  id: string;
  codigo_producto: string;
  nombre: string;
  descripcion: string | null;
  categoria_id: string;
  precio: number;
  precio_original: number | null;
  stock: number;
  stock_minimo: number;
  activo: boolean;
  destacado: boolean;
  slug: string;
  imagen_principal: string | null;
  personalizable: boolean;
  etiquetas: string[] | null;
  created_at: string;
  updated_at: string;
  oferta?: Oferta | null;
}

interface LineaPedido {
  id: string;
  producto_id: string;
  cantidad: number;
  precio_unitario: number;
  precio_total: number;
  // Enriquecido al cargar el detalle
  nombre?: string;
  codigo_producto?: string;
}

interface DireccionEnvio {
  nombre_completo: string;
  direccion: string;
  ciudad: string;
  codigo_postal: string;
  provincia: string;
  telefono: string;
}

interface Pedido {
  id: string;
  numero_pedido: string;
  usuario_id: string | null;
  direccion_envio_id: string | null;
  estado: string;
  subtotal: number;
  impuestos: number;
  gastos_envio: number;
  total: number;
  metodo_pago: string | null;
  notas: string | null;
  fecha_pedido: string;
  created_at: string;
  lineas?: LineaPedido[];
  direccion?: DireccionEnvio | null;
}

type OrigenImagen = 'local' | 'storage';

type FormProducto = {
  codigo_producto: string;
  nombre: string;
  descripcion: string;
  categoria_id: string;
  precio: number;
  precio_original: number | null;
  stock: number;
  stock_minimo: number;
  activo: boolean;
  destacado: boolean;
  slug: string;
  imagen_principal: string;
  personalizable: boolean;
  en_oferta: boolean;
  descuento_pct: number;
  oferta_fecha_fin: string;
  origen_imagen: OrigenImagen;
};

const FORM_VACIO: FormProducto = {
  codigo_producto: '',
  nombre: '',
  descripcion: '',
  categoria_id: '',
  precio: 0,
  precio_original: null,
  stock: 0,
  stock_minimo: 5,
  activo: true,
  destacado: false,
  slug: '',
  imagen_principal: '',
  personalizable: false,
  en_oferta: false,
  descuento_pct: 10,
  oferta_fecha_fin: '',
  origen_imagen: 'local',
};

// ─── Estado de pedido config ──────────────────────────────────────────────────

const ESTADOS_PEDIDO = [
  { value: 'pendiente',   label: 'Pendiente',   color: 'yellow' },
  { value: 'confirmado',  label: 'Confirmado',  color: 'blue'   },
  { value: 'enviado',     label: 'Enviado',     color: 'purple' },
  { value: 'entregado',   label: 'Entregado',   color: 'green'  },
  { value: 'cancelado',   label: 'Cancelado',   color: 'red'    },
];

function badgeEstado(estado: string) {
  const cfg = ESTADOS_PEDIDO.find(e => e.value === estado);
  const color = cfg?.color || 'gray';
  const label = cfg?.label || estado;
  const map: Record<string, string> = {
    yellow: 'bg-yellow-100 text-yellow-700',
    blue:   'bg-blue-100 text-blue-700',
    purple: 'bg-purple-100 text-purple-700',
    green:  'bg-green-100 text-green-700',
    red:    'bg-red-100 text-red-700',
    gray:   'bg-gray-100 text-gray-600',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${map[color]}`}>
      {label}
    </span>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

function generarCodigo(codigoCategoria: string, productosExistentes: Producto[]): string {
  const prefijo = codigoCategoria.slice(0, 6).toUpperCase();
  const existentes = productosExistentes
    .map(p => p.codigo_producto)
    .filter(c => c.startsWith(prefijo))
    .map(c => { const m = c.match(/(\d+)$/); return m ? parseInt(m[1]) : 0; });
  const siguiente = existentes.length > 0 ? Math.max(...existentes) + 1 : 1;
  return `${prefijo}-${String(siguiente).padStart(3, '0')}`;
}

function generarSlug(nombre: string, productosExistentes: Producto[], idActual?: string): string {
  const base = slugify(nombre);
  const slugsExistentes = productosExistentes.filter(p => p.id !== idActual).map(p => p.slug);
  if (!slugsExistentes.includes(base)) return base;
  let i = 2;
  while (slugsExistentes.includes(`${base}-${i}`)) i++;
  return `${base}-${i}`;
}

function calcularPrecioConDescuento(precioOriginal: number, pct: number): number {
  return precioOriginal * (1 - pct / 100);
}

// ─── Componente ──────────────────────────────────────────────────────────────

export function Admin() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'resumen' | 'productos' | 'clientes' | 'pedidos'>('resumen');

  const [clientes, setClientes]                     = useState<Usuario[]>([]);
  const [productos, setProductos]                   = useState<Producto[]>([]);
  const [productosFiltrados, setProductosFiltrados] = useState<Producto[]>([]);
  const [categorias, setCategorias]                 = useState<Categoria[]>([]);
  const [cargando, setCargando]                     = useState(false);
  const [busqueda, setBusqueda]                     = useState('');

  // Pedidos
  const [pedidos, setPedidos]                       = useState<Pedido[]>([]);
  const [cargandoPedidos, setCargandoPedidos]       = useState(false);
  const [pedidoDetalle, setPedidoDetalle]           = useState<Pedido | null>(null);
  const [filtroEstado, setFiltroEstado]             = useState<string>('todos');
  const [actualizandoEstado, setActualizandoEstado] = useState<string | null>(null);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [guardando, setGuardando]       = useState(false);
  const [form, setForm]                 = useState<FormProducto>(FORM_VACIO);
  const [editandoId, setEditandoId]     = useState<string | null>(null);
  const [errorModal, setErrorModal]     = useState<string | null>(null);
  const [exito, setExito]               = useState<string | null>(null);
  const [confirmar, setConfirmar]       = useState<{ abierto: boolean; id: string; nombre: string }>({
    abierto: false, id: '', nombre: '',
  });

  // ─── Effects ─────────────────────────────────────────────────────────────

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    if (activeTab === 'pedidos') fetchPedidos();
  }, [activeTab]);

  useEffect(() => {
    const q = busqueda.toLowerCase();
    setProductosFiltrados(
      q ? productos.filter(p =>
        p.nombre.toLowerCase().includes(q) ||
        p.codigo_producto.toLowerCase().includes(q)
      ) : productos
    );
  }, [busqueda, productos]);

  useEffect(() => {
    if (!form.nombre.trim() || editandoId) return;
    const cat = categorias.find(c => c.id === form.categoria_id);
    if (cat) {
      setForm(f => ({
        ...f,
        codigo_producto: generarCodigo(cat.codigo_categoria, productos),
        slug: generarSlug(f.nombre, productos),
      }));
    }
  }, [form.nombre, form.categoria_id]);

  useEffect(() => {
    if (form.en_oferta && form.precio_original && form.precio_original > 0) {
      setForm(f => ({
        ...f,
        precio: parseFloat(calcularPrecioConDescuento(f.precio_original!, f.descuento_pct).toFixed(2)),
      }));
    }
  }, [form.precio_original, form.descuento_pct, form.en_oferta]);

  // ─── Fetch ───────────────────────────────────────────────────────────────

  const fetchData = async () => {
    setCargando(true);
    const [{ data: cats }, { data: prods }, { data: ofs }, { data: users }] = await Promise.all([
      supabase.from('categorias_productos').select('*').eq('activa', true),
      supabase.from('productos').select('*').order('nombre', { ascending: true }),
      supabase.from('ofertas').select('*').eq('activa', true),
      supabase.from('usuarios').select('*').order('created_at', { ascending: false }),
    ]);
    const ofertaMap: Record<string, Oferta> = {};
    (ofs || []).forEach(o => { ofertaMap[o.producto_id] = o; });
    setCategorias(cats || []);
    setClientes(users || []);
    setProductos((prods || []).map(p => ({ ...p, oferta: ofertaMap[p.id] || null })));
    setCargando(false);
  };

  const fetchPedidos = async () => {
    setCargandoPedidos(true);
    const { data, error } = await supabase
      .from('pedidos')
      .select('*')
      .order('fecha_pedido', { ascending: false });
    if (!error && data) setPedidos(data);
    setCargandoPedidos(false);
  };

  const fetchDetallePedido = async (pedido: Pedido) => {
    const [{ data: lineas }, { data: dir }] = await Promise.all([
      supabase.from('lineas_pedido').select('*').eq('pedido_id', pedido.id),
      pedido.direccion_envio_id
        ? supabase.from('direcciones_envio').select('*').eq('id', pedido.direccion_envio_id).single()
        : Promise.resolve({ data: null }),
    ]);

    // Enriquecer cada línea con nombre y código del producto
    let lineasEnriquecidas: LineaPedido[] = lineas || [];
    if (lineas && lineas.length > 0) {
      const ids = lineas.map((l: any) => l.producto_id);
      const { data: prods } = await supabase
        .from('productos')
        .select('id, nombre, codigo_producto')
        .in('id', ids);
      const prodMap: Record<string, { nombre: string; codigo_producto: string }> = {};
      (prods || []).forEach((p: any) => { prodMap[p.id] = p; });
      lineasEnriquecidas = lineas.map((l: any) => ({
        ...l,
        nombre:          prodMap[l.producto_id]?.nombre          || '—',
        codigo_producto: prodMap[l.producto_id]?.codigo_producto || l.producto_id.slice(0, 8),
      }));
    }

    setPedidoDetalle({
      ...pedido,
      lineas: lineasEnriquecidas,
      direccion: dir || null,
    });
  };

  const actualizarEstadoPedido = async (pedidoId: string, nuevoEstado: string) => {
    setActualizandoEstado(pedidoId);
    const { error } = await supabase
      .from('pedidos')
      .update({ estado: nuevoEstado })
      .eq('id', pedidoId);
    if (!error) {
      setPedidos(prev => prev.map(p => p.id === pedidoId ? { ...p, estado: nuevoEstado } : p));
      if (pedidoDetalle?.id === pedidoId) {
        setPedidoDetalle(prev => prev ? { ...prev, estado: nuevoEstado } : prev);
      }
      mostrarExito('Estado del pedido actualizado.');
    }
    setActualizandoEstado(null);
  };

  const ofertaActiva = (oferta: Oferta | null | undefined) => {
    if (!oferta || !oferta.activa) return false;
    const ahora = new Date();
    return new Date(oferta.fecha_inicio) <= ahora && ahora <= new Date(oferta.fecha_fin);
  };

  // ─── CRUD Productos ───────────────────────────────────────────────────────

  const mostrarExito = (msg: string) => {
    setExito(msg);
    setTimeout(() => setExito(null), 3500);
  };

  const abrirNuevo = () => {
    setEditandoId(null);
    setErrorModal(null);
    const primeraCat = categorias[0];
    const nuevoCodigo = primeraCat ? generarCodigo(primeraCat.codigo_categoria, productos) : '';
    setForm({
      ...FORM_VACIO,
      categoria_id: primeraCat?.id || '',
      codigo_producto: nuevoCodigo,
      oferta_fecha_fin: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });
    setModalAbierto(true);
  };

  const abrirEditar = (p: Producto) => {
    setEditandoId(p.id);
    setErrorModal(null);
    const oferta = ofertaActiva(p.oferta) ? p.oferta! : null;
    const esStorage = !!(p.imagen_principal && p.imagen_principal.startsWith('http'));
    setForm({
      codigo_producto:  p.codigo_producto,
      nombre:           p.nombre,
      descripcion:      p.descripcion || '',
      categoria_id:     p.categoria_id,
      precio:           p.precio,
      precio_original:  p.precio_original || (oferta ? p.precio / (1 - oferta.porcentaje_descuento / 100) : null),
      stock:            p.stock,
      stock_minimo:     p.stock_minimo,
      activo:           p.activo,
      destacado:        p.destacado,
      slug:             p.slug,
      imagen_principal: p.imagen_principal || '',
      personalizable:   p.personalizable,
      en_oferta:        !!oferta,
      descuento_pct:    oferta?.porcentaje_descuento || 10,
      oferta_fecha_fin: oferta
        ? new Date(oferta.fecha_fin).toISOString().split('T')[0]
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      origen_imagen: esStorage ? 'storage' : 'local',
    });
    setModalAbierto(true);
  };

  const guardar = async () => {
    setErrorModal(null);
    if (!form.nombre.trim())          { setErrorModal('El nombre es obligatorio.');  return; }
    if (!form.codigo_producto.trim()) { setErrorModal('El código es obligatorio.');  return; }
    if (!form.slug.trim())            { setErrorModal('El slug es obligatorio.');    return; }
    if (!form.categoria_id)           { setErrorModal('Selecciona una categoría.'); return; }
    if (form.en_oferta && !form.precio_original) {
      setErrorModal('Introduce el precio original para calcular la oferta.'); return;
    }
    if (form.en_oferta && !form.oferta_fecha_fin) {
      setErrorModal('Introduce la fecha de fin de la oferta.'); return;
    }

    setGuardando(true);
    const payload = {
      codigo_producto:  form.codigo_producto.trim(),
      nombre:           form.nombre.trim(),
      descripcion:      form.descripcion.trim() || null,
      categoria_id:     form.categoria_id,
      precio:           form.precio,
      precio_original:  form.en_oferta ? (form.precio_original || null) : null,
      stock:            form.stock,
      stock_minimo:     form.stock_minimo,
      activo:           form.activo,
      destacado:        form.destacado,
      slug:             form.slug.trim(),
      imagen_principal: form.imagen_principal.trim() || null,
      personalizable:   form.personalizable,
    };

    try {
      let productoId = editandoId;

      if (editandoId) {
        const { error } = await supabase.from('productos').update(payload).eq('id', editandoId);
        if (error) throw error;
        setProductos(prev => prev.map(p => p.id === editandoId ? { ...p, ...payload } : p));
      } else {
        const { data, error } = await supabase.from('productos').insert(payload).select().single();
        if (error) throw error;
        productoId = data.id;
        setProductos(prev => [{ ...data, oferta: null }, ...prev]);
      }

      if (productoId) {
        await supabase.from('ofertas').update({ activa: false }).eq('producto_id', productoId).eq('activa', true);
        if (form.en_oferta && form.precio_original && form.oferta_fecha_fin) {
          const { error: ofertaErr } = await supabase.from('ofertas').insert({
            producto_id:          productoId,
            porcentaje_descuento: form.descuento_pct,
            fecha_inicio:         new Date().toISOString(),
            fecha_fin:            new Date(form.oferta_fecha_fin + 'T23:59:59').toISOString(),
            activa:               true,
            descripcion:          `Oferta ${form.descuento_pct}% — ${form.nombre}`,
          });
          if (ofertaErr) console.warn('Error al crear oferta:', ofertaErr.message);
        }
      }

      await fetchData();
      mostrarExito(editandoId ? 'Producto actualizado correctamente.' : 'Producto creado correctamente.');
      setModalAbierto(false);
    } catch (err: any) {
      setErrorModal('Error: ' + err.message);
    } finally {
      setGuardando(false);
    }
  };

  const toggleActivo = async (p: Producto) => {
    const { error } = await supabase.from('productos').update({ activo: !p.activo }).eq('id', p.id);
    if (error) return;
    setProductos(prev => prev.map(x => x.id === p.id ? { ...x, activo: !p.activo } : x));
    mostrarExito(`Producto ${!p.activo ? 'activado' : 'desactivado'}.`);
  };

  const borrar = async () => {
    await supabase.from('ofertas').update({ activa: false }).eq('producto_id', confirmar.id);
    const { error } = await supabase.from('productos').delete().eq('id', confirmar.id);
    if (error) return;
    setProductos(prev => prev.filter(p => p.id !== confirmar.id));
    setConfirmar({ abierto: false, id: '', nombre: '' });
    mostrarExito('Producto eliminado.');
  };

  const nombreCategoria = (id: string) =>
    categorias.find(c => c.id === id)?.nombre_categoria || '—';

  const precioPreview = form.en_oferta && form.precio_original && form.precio_original > 0
    ? calcularPrecioConDescuento(form.precio_original, form.descuento_pct)
    : null;

  // ─── Pedidos filtrados ────────────────────────────────────────────────────

  const pedidosFiltrados = filtroEstado === 'todos'
    ? pedidos
    : pedidos.filter(p => p.estado === filtroEstado);

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen bg-[#F8F9FB]">

      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm shrink-0">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">Panel Admin</h2>
          <p className="text-sm text-gray-500 mt-1">AHB Solutions</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {([
            { tab: 'resumen',   Icon: LayoutDashboard, label: 'Resumen'    },
            { tab: 'productos', Icon: Package,          label: 'Productos'  },
            { tab: 'pedidos',   Icon: ShoppingBag,      label: 'Pedidos'    },
            { tab: 'clientes',  Icon: Users,            label: 'Clientes'   },
          ] as const).map(({ tab, Icon, label }) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-sm transition-colors ${activeTab === tab ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
              <Icon className="w-4 h-4" /> {label}
              {tab === 'pedidos' && pedidos.filter(p => p.estado === 'pendiente').length > 0 && (
                <span className="ml-auto bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {pedidos.filter(p => p.estado === 'pendiente').length}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-200 space-y-1 bg-gray-50">
          <button onClick={() => navigate('/')} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-lg">
            <ArrowLeft className="w-4 h-4" /> Volver
          </button>
          <button onClick={() => supabase.auth.signOut().then(() => navigate('/'))} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg">
            <LogOut className="w-4 h-4" /> Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
          <h1 className="text-lg font-semibold text-gray-800">
            {activeTab === 'resumen'   ? 'Resumen General'       :
             activeTab === 'productos' ? 'Gestión de Catálogo'   :
             activeTab === 'pedidos'   ? 'Gestión de Pedidos'    :
                                        'Directorio de Clientes'}
          </h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">Administrador</span>
            <div className="w-9 h-9 bg-[#1A56DB] rounded-full flex items-center justify-center text-white text-sm font-bold">A</div>
          </div>
        </header>

        <div className="p-8 flex-1">
          {exito && (
            <div className="mb-5 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm flex justify-between items-center">
              <span>✓ {exito}</span>
              <button onClick={() => setExito(null)}><X className="w-4 h-4" /></button>
            </div>
          )}

          {/* ── RESUMEN ── */}
          {activeTab === 'resumen' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-[#1A56DB] to-blue-700 text-white p-8 rounded-xl shadow-lg">
                <h1 className="text-3xl font-bold mb-2">Bienvenido al Panel de Administración</h1>
                <p className="text-blue-100">Gestiona tus productos, clientes y pedidos desde aquí.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: 'Total Productos', value: productos.length, color: 'blue',   Icon: Package    },
                  { label: 'Stock Total',     value: productos.reduce((s, p) => s + p.stock, 0), color: 'green',  Icon: Package },
                  { label: 'En Oferta',       value: productos.filter(p => ofertaActiva(p.oferta)).length, color: 'orange', Icon: Tag },
                  { label: 'Total Pedidos',   value: pedidos.length,  color: 'purple', Icon: ShoppingBag },
                ].map(({ label, value, color, Icon }) => (
                  <div key={label} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-gray-600 font-semibold text-sm">{label}</h3>
                      <div className={`p-2 bg-${color}-50 rounded-lg`}><Icon className={`w-5 h-5 text-${color}-600`} /></div>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{value}</p>
                  </div>
                ))}
              </div>
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h2 className="text-lg font-bold text-gray-800 mb-4">Acceso Rápido</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { tab: 'productos' as const, Icon: Package,     color: 'blue',   title: 'Gestionar Productos', sub: 'Añade o edita tu catálogo'          },
                    { tab: 'pedidos'   as const, Icon: ShoppingBag, color: 'orange', title: 'Ver Pedidos',         sub: 'Gestiona y actualiza los pedidos'    },
                    { tab: 'clientes'  as const, Icon: Users,       color: 'purple', title: 'Ver Clientes',        sub: 'Listado de usuarios registrados'     },
                  ].map(({ tab, Icon, color, title, sub }) => (
                    <button key={tab} onClick={() => setActiveTab(tab)}
                      className={`p-4 border border-gray-100 rounded-xl hover:border-${color}-500 hover:bg-${color}-50 flex items-center justify-between group transition-all`}>
                      <div className="flex items-center gap-4">
                        <div className={`p-3 bg-${color}-100 text-${color}-600 rounded-xl`}><Icon className="w-6 h-6" /></div>
                        <div className="text-left">
                          <p className="font-bold text-gray-900">{title}</p>
                          <p className="text-sm text-gray-500">{sub}</p>
                        </div>
                      </div>
                      <ChevronRight className={`w-5 h-5 text-gray-300 group-hover:text-${color}-500`} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── CLIENTES ── */}
          {activeTab === 'clientes' && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-[#F9FAFB] border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="px-6 py-4">Cliente</th>
                    <th className="px-6 py-4">Contacto</th>
                    <th className="px-6 py-4">Rol</th>
                    <th className="px-6 py-4">Fecha Registro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {clientes.map(c => (
                    <tr key={c.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-sm">
                            {c.nombre_completo?.charAt(0).toUpperCase() || '?'}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-gray-900">{c.nombre_completo}</div>
                            <div className="text-xs text-gray-400">ID: {c.id.slice(0, 8)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{c.email}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 w-fit">{c.rol}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(c.created_at).toLocaleDateString()}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── PRODUCTOS ── */}
          {activeTab === 'productos' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-gray-800">Catálogo de Productos</h2>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" placeholder="Buscar..." value={busqueda}
                      onChange={e => setBusqueda(e.target.value)}
                      className="pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none w-64" />
                  </div>
                  <button onClick={abrirNuevo}
                    className="bg-[#1A56DB] text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold shadow-md hover:bg-blue-700 transition-all">
                    <Plus className="w-4 h-4" /> Nuevo Producto
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {cargando ? (
                  <div className="p-10 text-center text-gray-400 text-sm">Cargando catálogo...</div>
                ) : productosFiltrados.length === 0 ? (
                  <div className="p-10 text-center text-gray-400 text-sm">No hay productos.</div>
                ) : (
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-[#F9FAFB] border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        <th className="px-6 py-4">Producto</th>
                        <th className="px-6 py-4">Categoría</th>
                        <th className="px-6 py-4 text-center">Stock</th>
                        <th className="px-6 py-4 text-right">Precio</th>
                        <th className="px-6 py-4 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {productosFiltrados.map(p => {
                        const oferta     = ofertaActiva(p.oferta) ? p.oferta! : null;
                        const precioBase = p.precio_original || p.precio;
                        const precioFinal = oferta ? precioBase * (1 - oferta.porcentaje_descuento / 100) : p.precio;
                        return (
                          <tr key={p.id} className="hover:bg-gray-50/60 transition-colors group">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded border bg-gray-50 flex items-center justify-center overflow-hidden shrink-0">
                                  {p.imagen_principal
                                    ? <img src={p.imagen_principal} className="w-full h-full object-cover" alt={p.nombre} />
                                    : <Package className="w-4 h-4 text-gray-300" />}
                                </div>
                                <div>
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-sm font-semibold text-gray-900">{p.nombre}</span>
                                    {oferta && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">-{oferta.porcentaje_descuento}%</span>}
                                    {!p.activo && <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">Inactivo</span>}
                                  </div>
                                  <div className="text-xs text-gray-400">{p.codigo_producto}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                                {nombreCategoria(p.categoria_id)}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className={`px-2 py-1 rounded text-xs font-bold ${p.stock <= p.stock_minimo ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                                {p.stock} uds
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              {oferta ? (
                                <div>
                                  <div className="text-sm font-bold text-gray-900">{precioFinal.toFixed(2)} €</div>
                                  <div className="text-[10px] text-gray-400 line-through">{precioBase.toFixed(2)} €</div>
                                </div>
                              ) : (
                                <div className="text-sm font-bold text-gray-900">{p.precio.toFixed(2)} €</div>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => toggleActivo(p)} title={p.activo ? 'Desactivar' : 'Activar'}
                                  className={`p-1.5 rounded-lg transition-colors ${p.activo ? 'text-gray-400 hover:text-orange-500 hover:bg-orange-50' : 'text-gray-400 hover:text-green-600 hover:bg-green-50'}`}>
                                  {p.activo ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                                <button onClick={() => abrirEditar(p)} title="Editar"
                                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button onClick={() => setConfirmar({ abierto: true, id: p.id, nombre: p.nombre })} title="Eliminar"
                                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* ── PEDIDOS ── */}
          {activeTab === 'pedidos' && (
            <div className="flex gap-6">

              {/* Lista de pedidos */}
              <div className={pedidoDetalle ? 'w-1/2' : 'w-full'}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => setFiltroEstado('todos')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${filtroEstado === 'todos' ? 'bg-gray-800 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                      Todos ({pedidos.length})
                    </button>
                    {ESTADOS_PEDIDO.map(e => (
                      <button key={e.value}
                        onClick={() => setFiltroEstado(e.value)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${filtroEstado === e.value ? 'bg-gray-800 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                        {e.label} ({pedidos.filter(p => p.estado === e.value).length})
                      </button>
                    ))}
                  </div>
                  <button onClick={fetchPedidos}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Actualizar">
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  {cargandoPedidos ? (
                    <div className="p-10 text-center text-gray-400 text-sm">Cargando pedidos...</div>
                  ) : pedidosFiltrados.length === 0 ? (
                    <div className="p-10 text-center text-gray-400 text-sm">No hay pedidos.</div>
                  ) : (
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-[#F9FAFB] border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          <th className="px-4 py-3">Pedido</th>
                          <th className="px-4 py-3">Fecha</th>
                          <th className="px-4 py-3">Estado</th>
                          <th className="px-4 py-3 text-right">Total</th>
                          <th className="px-4 py-3 text-right">Detalle</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {pedidosFiltrados.map(p => (
                          <tr key={p.id}
                            className={`hover:bg-gray-50/60 transition-colors cursor-pointer ${pedidoDetalle?.id === p.id ? 'bg-blue-50/50' : ''}`}
                            onClick={() => fetchDetallePedido(p)}>
                            <td className="px-4 py-3">
                              <div className="text-sm font-bold text-gray-900 font-mono">{p.numero_pedido}</div>
                              <div className="text-xs text-gray-400">{p.metodo_pago || '—'}</div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                <Clock className="w-3 h-3" />
                                {new Date(p.fecha_pedido).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </div>
                            </td>
                            <td className="px-4 py-3">{badgeEstado(p.estado)}</td>
                            <td className="px-4 py-3 text-right">
                              <span className="text-sm font-bold text-gray-900">{p.total.toFixed(2)} €</span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <ChevronRight className="w-4 h-4 text-gray-300 inline" />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* Panel detalle pedido */}
              {pedidoDetalle && (
                <div className="w-1/2 bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5 h-fit sticky top-24">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-base font-bold text-gray-900 font-mono">{pedidoDetalle.numero_pedido}</h3>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(pedidoDetalle.fecha_pedido).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <button onClick={() => setPedidoDetalle(null)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Cambiar estado */}
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Estado del pedido</p>
                    <div className="flex flex-wrap gap-2">
                      {ESTADOS_PEDIDO.map(e => (
                        <button key={e.value}
                          disabled={actualizandoEstado === pedidoDetalle.id}
                          onClick={() => actualizarEstadoPedido(pedidoDetalle.id, e.value)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                            pedidoDetalle.estado === e.value
                              ? 'bg-gray-800 text-white border-gray-800'
                              : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                          }`}>
                          {e.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Dirección */}
                  {pedidoDetalle.direccion && (
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Dirección de envío</p>
                      <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 space-y-0.5">
                        <p className="font-semibold">{pedidoDetalle.direccion.nombre_completo}</p>
                        <p>{pedidoDetalle.direccion.direccion}</p>
                        <p>{pedidoDetalle.direccion.codigo_postal} {pedidoDetalle.direccion.ciudad}</p>
                        {pedidoDetalle.direccion.provincia && <p>{pedidoDetalle.direccion.provincia}</p>}
                        {pedidoDetalle.direccion.telefono && <p className="text-gray-500">{pedidoDetalle.direccion.telefono}</p>}
                      </div>
                    </div>
                  )}

                  {/* Líneas del pedido */}
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Productos</p>
                    <div className="space-y-2">
                      {(pedidoDetalle.lineas || []).map(l => (
                        <div key={l.id} className="flex justify-between items-start bg-gray-50 rounded-lg px-3 py-2.5 text-sm gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-[10px] font-bold font-mono bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                                {l.codigo_producto}
                              </span>
                              <span className="text-xs font-semibold text-gray-800 truncate">{l.nombre}</span>
                            </div>
                            <span className="text-xs text-gray-400">×{l.cantidad} ud. · {l.precio_unitario.toFixed(2)} € / ud.</span>
                          </div>
                          <div className="font-bold text-gray-900 shrink-0">{l.precio_total.toFixed(2)} €</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Totales */}
                  <div className="border-t border-gray-100 pt-4 space-y-1.5 text-sm">
                    <div className="flex justify-between text-gray-500">
                      <span>Subtotal</span><span>{pedidoDetalle.subtotal.toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between text-gray-500">
                      <span>IVA</span><span>{pedidoDetalle.impuestos.toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between text-gray-500">
                      <span>Envío</span><span>{pedidoDetalle.gastos_envio === 0 ? 'Gratis' : `${pedidoDetalle.gastos_envio.toFixed(2)} €`}</span>
                    </div>
                    <div className="flex justify-between font-bold text-gray-900 text-base pt-1 border-t border-gray-100">
                      <span>Total</span><span>{pedidoDetalle.total.toFixed(2)} €</span>
                    </div>
                  </div>

                  {pedidoDetalle.notas && (
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Notas</p>
                      <p className="text-sm text-gray-600 bg-yellow-50 border border-yellow-100 rounded-lg px-3 py-2">{pedidoDetalle.notas}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        </div>
      </main>

      {/* ── MODAL CREAR / EDITAR ── */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[94vh] overflow-y-auto">
            <div className="flex justify-between items-center px-6 py-5 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="text-base font-semibold text-gray-800">
                {editandoId ? 'Editar producto' : 'Nuevo producto'}
              </h2>
              <button onClick={() => setModalAbierto(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              {errorModal && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{errorModal}</div>
              )}

              {/* DATOS BÁSICOS */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Datos básicos</p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Nombre <span className="text-red-500">*</span></label>
                    <input type="text" value={form.nombre}
                      onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Atril de Metacrilato Premium" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Descripción</label>
                    <textarea rows={2} value={form.descripcion}
                      onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      placeholder="Descripción del producto..." />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Categoría <span className="text-red-500">*</span></label>
                    <select value={form.categoria_id}
                      onChange={e => setForm(f => ({ ...f, categoria_id: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                      <option value="">Selecciona una categoría</option>
                      {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre_categoria}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Código <span className="ml-1 text-[10px] text-blue-500 font-normal">auto-generado</span>
                      </label>
                      <input type="text" value={form.codigo_producto}
                        onChange={e => setForm(f => ({ ...f, codigo_producto: e.target.value.toUpperCase() }))}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                        placeholder="ATR-001" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Slug <span className="ml-1 text-[10px] text-blue-500 font-normal">auto-generado</span>
                      </label>
                      <input type="text" value={form.slug}
                        onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                        placeholder="atril-metacrilato" />
                    </div>
                  </div>
                </div>
              </div>

              {/* PRECIO Y OFERTA */}
              <div className="border border-gray-100 rounded-xl p-4 space-y-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Precio y oferta</p>
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Percent className="w-4 h-4 text-orange-500" />
                    <span className="text-sm font-medium text-gray-700">Producto en oferta</span>
                  </div>
                  <div onClick={() => setForm(f => ({ ...f, en_oferta: !f.en_oferta }))}
                    className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${form.en_oferta ? 'bg-orange-500' : 'bg-gray-200'}`}>
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.en_oferta ? 'translate-x-5' : ''}`} />
                  </div>
                </label>

                {form.en_oferta ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Precio original (€) <span className="text-red-500">*</span></label>
                        <input type="number" min="0" step="0.01"
                          value={form.precio_original ?? ''}
                          onChange={e => setForm(f => ({ ...f, precio_original: parseFloat(e.target.value) || null }))}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                          placeholder="39.99" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Descuento (%)</label>
                        <div className="flex items-center gap-2">
                          <input type="range" min="1" max="90" step="1"
                            value={form.descuento_pct}
                            onChange={e => setForm(f => ({ ...f, descuento_pct: parseInt(e.target.value) }))}
                            className="flex-1 accent-orange-500" />
                          <span className="text-sm font-bold text-orange-600 w-10 text-right">{form.descuento_pct}%</span>
                        </div>
                      </div>
                    </div>
                    {precioPreview !== null && (
                      <div className="bg-orange-50 border border-orange-200 rounded-lg px-4 py-3 flex items-center justify-between">
                        <span className="text-xs text-orange-700 font-medium">Precio final con descuento</span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-gray-400 line-through">{form.precio_original?.toFixed(2)} €</span>
                          <span className="text-lg font-bold text-orange-600">{precioPreview.toFixed(2)} €</span>
                        </div>
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Oferta válida hasta <span className="text-red-500">*</span></label>
                      <input type="date"
                        value={form.oferta_fecha_fin}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={e => setForm(f => ({ ...f, oferta_fecha_fin: e.target.value }))}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Precio (€) <span className="text-red-500">*</span></label>
                    <input type="number" min="0" step="0.01"
                      value={form.precio}
                      onChange={e => setForm(f => ({ ...f, precio: parseFloat(e.target.value) || 0 }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                )}
              </div>

              {/* STOCK */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Stock</label>
                  <input type="number" min="0" value={form.stock}
                    onChange={e => setForm(f => ({ ...f, stock: parseInt(e.target.value) || 0 }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Stock mínimo</label>
                  <input type="number" min="0" value={form.stock_minimo}
                    onChange={e => setForm(f => ({ ...f, stock_minimo: parseInt(e.target.value) || 5 }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              {/* IMAGEN */}
              <div className="border border-gray-100 rounded-xl p-4 space-y-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Imagen del producto</p>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button"
                    onClick={() => setForm(f => ({ ...f, origen_imagen: 'local', imagen_principal: '' }))}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors ${form.origen_imagen === 'local' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                    <FolderOpen className="w-4 h-4 shrink-0" />
                    <div className="text-left">
                      <p className="text-xs font-semibold">Ruta del proyecto</p>
                      <p className="text-[10px] font-normal opacity-70">/imagenes_productos/</p>
                    </div>
                  </button>
                  <button type="button"
                    onClick={() => setForm(f => ({ ...f, origen_imagen: 'storage', imagen_principal: '' }))}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors ${form.origen_imagen === 'storage' ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                    <Link className="w-4 h-4 shrink-0" />
                    <div className="text-left">
                      <p className="text-xs font-semibold">Supabase Storage</p>
                      <p className="text-[10px] font-normal opacity-70">URL pública</p>
                    </div>
                  </button>
                </div>
                {form.origen_imagen === 'local' ? (
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Nombre del archivo</label>
                    <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
                      <span className="px-3 py-2 bg-gray-50 text-xs text-gray-400 border-r border-gray-200 whitespace-nowrap">/imagenes_productos/</span>
                      <input type="text"
                        value={form.imagen_principal.replace('/imagenes_productos/', '')}
                        onChange={e => setForm(f => ({
                          ...f,
                          imagen_principal: e.target.value
                            ? `/imagenes_productos/${e.target.value.replace(/^\/imagenes_productos\//, '')}`
                            : ''
                        }))}
                        className="flex-1 px-3 py-2 text-sm focus:outline-none"
                        placeholder="Atril1.jpg" />
                    </div>
                    <p className="mt-1 text-[10px] text-gray-400">El archivo debe estar en la carpeta <code>public/imagenes_productos/</code></p>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">URL pública de Supabase Storage</label>
                    <input type="text"
                      value={form.imagen_principal}
                      onChange={e => setForm(f => ({ ...f, imagen_principal: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="https://xxxx.supabase.co/storage/v1/object/public/..." />
                    <p className="mt-1 text-[10px] text-gray-400">Pega la URL que te da Supabase al subir la imagen en Storage → bucket → Copy URL</p>
                  </div>
                )}
                {form.imagen_principal && (
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-lg border border-gray-200 overflow-hidden bg-gray-50 shrink-0">
                      <img src={form.imagen_principal} alt="preview" className="w-full h-full object-cover"
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-600">Vista previa</p>
                      <p className="text-[10px] text-gray-400 break-all max-w-xs">{form.imagen_principal}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* OPCIONES */}
              <div className="flex items-center gap-6">
                {([
                  { key: 'activo',         label: 'Activo'         },
                  { key: 'destacado',      label: 'Destacado'      },
                  { key: 'personalizable', label: 'Personalizable' },
                ] as const).map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
                    <input type="checkbox" checked={!!form[key]}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 sticky bottom-0 bg-white">
              <button onClick={() => setModalAbierto(false)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button onClick={guardar} disabled={guardando}
                className="px-5 py-2 text-sm bg-[#1A56DB] hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg font-medium transition-colors flex items-center gap-2">
                <Save className="w-4 h-4" />
                {guardando ? 'Guardando...' : editandoId ? 'Guardar cambios' : 'Crear producto'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL BORRAR ── */}
      {confirmar.abierto && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-start gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-800">Eliminar producto</h2>
                <p className="text-sm text-gray-500 mt-1">
                  ¿Eliminar <span className="font-medium text-gray-700">"{confirmar.nombre}"</span>? Esta acción no se puede deshacer.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirmar({ abierto: false, id: '', nombre: '' })}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button onClick={borrar}
                className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2">
                <Trash2 className="w-4 h-4" /> Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}