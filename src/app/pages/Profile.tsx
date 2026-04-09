import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../context/AuthContext';
import {
  User, ShoppingBag, MapPin, Lock, LogOut, ChevronRight,
  Package, Clock, Truck, CheckCircle, XCircle, ChevronDown,
  ChevronUp, Edit2, Save, X, Plus, Trash2, Star, Eye
} from 'lucide-react';

// ─── Interfaces ──────────────────────────────────────────────────────────────

interface PerfilUsuario {
  id: string;
  nombre_completo: string;
  email: string;
  telefono: string | null;
  empresa: string | null;
}

interface DireccionEnvio {
  id: string;
  nombre_completo: string;
  direccion: string;
  codigo_postal: string;
  ciudad: string;
  provincia: string;
  pais: string;
  telefono: string;
  es_predeterminada: boolean;
}

interface ProductoLinea {
  nombre: string;
  imagen_principal: string | null;
  codigo_producto: string;
}

interface LineaPedido {
  id: string;
  cantidad: number;
  precio_unitario: number;
  precio_total: number;
  // Supabase puede devolver el join como objeto o como array según la relación
  productos: ProductoLinea | ProductoLinea[] | null;
}

interface Pedido {
  id: string;
  numero_pedido: string;
  estado: 'pendiente' | 'procesando' | 'enviado' | 'entregado' | 'cancelado';
  subtotal: number;
  impuestos: number;
  gastos_envio: number;
  total: number;
  metodo_pago: string | null;
  fecha_pedido: string;
  numero_seguimiento: string | null;
  notas: string | null;
  lineas_pedido?: LineaPedido[];
}

type Seccion = 'pedidos' | 'direcciones' | 'datos' | 'seguridad';

// ─── Config estados ───────────────────────────────────────────────────────────

const ESTADOS = {
  pendiente:  { label: 'Pendiente',  color: 'bg-amber-100 text-amber-700',   Icon: Clock        },
  procesando: { label: 'Procesando', color: 'bg-blue-100 text-blue-700',     Icon: Package      },
  enviado:    { label: 'Enviado',    color: 'bg-purple-100 text-purple-700', Icon: Truck        },
  entregado:  { label: 'Entregado',  color: 'bg-green-100 text-green-700',   Icon: CheckCircle  },
  cancelado:  { label: 'Cancelado',  color: 'bg-red-100 text-red-700',       Icon: XCircle      },
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded ${className}`} />;
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [seccion, setSeccion]       = useState<Seccion>('pedidos');
  const [perfil, setPerfil]         = useState<PerfilUsuario | null>(null);
  const [pedidos, setPedidos]       = useState<Pedido[]>([]);
  const [direcciones, setDirecciones] = useState<DireccionEnvio[]>([]);
  const [cargando, setCargando]     = useState(true);
  const [pedidoAbierto, setPedidoAbierto] = useState<string | null>(null);

  // Formulario datos personales
  const [editandoDatos, setEditandoDatos]   = useState(false);
  const [guardandoDatos, setGuardandoDatos] = useState(false);
  const [formDatos, setFormDatos]           = useState({ nombre_completo: '', telefono: '', empresa: '' });
  const [exitoDatos, setExitoDatos]         = useState(false);

  // Formulario contraseña
  const [formPass, setFormPass]       = useState({ nueva: '', confirmar: '' });
  const [guardandoPass, setGuardandoPass] = useState(false);
  const [errorPass, setErrorPass]     = useState<string | null>(null);
  const [exitoPass, setExitoPass]     = useState(false);

  // Formulario dirección
  const [modalDireccion, setModalDireccion] = useState(false);
  const [editandoDirId, setEditandoDirId]   = useState<string | null>(null);
  const [guardandoDir, setGuardandoDir]     = useState(false);
  const [formDir, setFormDir] = useState({
    nombre_completo: '', direccion: '', codigo_postal: '',
    ciudad: '', provincia: '', pais: 'España', telefono: '', es_predeterminada: false,
  });

  // Redirigir si no está logueado
  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    cargarDatos();
  }, [user]);

  // ─── Carga inicial ──────────────────────────────────────────────────────────

  const cargarDatos = async () => {
    if (!user) return;
    setCargando(true);

    const [{ data: perfilData }, { data: pedidosData }, { data: dirsData }] = await Promise.all([
      supabase.from('usuarios').select('*').eq('id', user.id).single(),
      supabase
        .from('pedidos')
        .select(`
          id, numero_pedido, estado, subtotal, impuestos,
          gastos_envio, total, metodo_pago, fecha_pedido,
          numero_seguimiento, notas
        `)
        .eq('usuario_id', user.id)
        .order('fecha_pedido', { ascending: false }),
      supabase
        .from('direcciones_envio')
        .select('*')
        .eq('usuario_id', user.id)
        .order('es_predeterminada', { ascending: false }),
    ]);

    if (perfilData) {
      setPerfil(perfilData);
      setFormDatos({
        nombre_completo: perfilData.nombre_completo || '',
        telefono: perfilData.telefono || '',
        empresa: perfilData.empresa || '',
      });
    }
    setPedidos(pedidosData || []);
    setDirecciones(dirsData || []);
    setCargando(false);
  };

  // ─── Cargar líneas de un pedido al expandirlo ───────────────────────────────

  const togglePedido = async (pedidoId: string) => {
    if (pedidoAbierto === pedidoId) { setPedidoAbierto(null); return; }
    setPedidoAbierto(pedidoId);

    const pedido = pedidos.find(p => p.id === pedidoId);
    if (pedido?.lineas_pedido) return; // ya cargadas

    const { data } = await supabase
      .from('lineas_pedido')
      .select(`
        id, cantidad, precio_unitario, precio_total,
        productos ( nombre, imagen_principal, codigo_producto )
      `)
      .eq('pedido_id', pedidoId);

    // Normalizar: Supabase puede devolver productos como array o como objeto
    const lineasNormalizadas: LineaPedido[] = (data || []).map((l: any) => ({
      ...l,
      productos: Array.isArray(l.productos) ? (l.productos[0] ?? null) : l.productos,
    }));

    setPedidos(prev => prev.map(p =>
      p.id === pedidoId ? { ...p, lineas_pedido: lineasNormalizadas } : p
    ));
  };

  // ─── Guardar datos personales ───────────────────────────────────────────────

  const guardarDatos = async () => {
    if (!user) return;
    setGuardandoDatos(true);
    const { error } = await supabase
      .from('usuarios')
      .update({
        nombre_completo: formDatos.nombre_completo.trim(),
        telefono: formDatos.telefono.trim() || null,
        empresa: formDatos.empresa.trim() || null,
      })
      .eq('id', user.id);

    if (!error) {
      setPerfil(prev => prev ? { ...prev, ...formDatos } : null);
      setEditandoDatos(false);
      setExitoDatos(true);
      setTimeout(() => setExitoDatos(false), 3000);
    }
    setGuardandoDatos(false);
  };

  // ─── Cambiar contraseña ─────────────────────────────────────────────────────

  const cambiarPassword = async () => {
    setErrorPass(null);
    if (formPass.nueva.length < 6) { setErrorPass('La contraseña debe tener al menos 6 caracteres.'); return; }
    if (formPass.nueva !== formPass.confirmar) { setErrorPass('Las contraseñas no coinciden.'); return; }
    setGuardandoPass(true);
    const { error } = await supabase.auth.updateUser({ password: formPass.nueva });
    if (error) { setErrorPass(error.message); }
    else {
      setExitoPass(true);
      setFormPass({ nueva: '', confirmar: '' });
      setTimeout(() => setExitoPass(false), 3000);
    }
    setGuardandoPass(false);
  };

  // ─── Direcciones ────────────────────────────────────────────────────────────

  const abrirNuevaDireccion = () => {
    setEditandoDirId(null);
    setFormDir({ nombre_completo: perfil?.nombre_completo || '', direccion: '', codigo_postal: '', ciudad: '', provincia: '', pais: 'España', telefono: perfil?.telefono || '', es_predeterminada: direcciones.length === 0 });
    setModalDireccion(true);
  };

  const abrirEditarDireccion = (d: DireccionEnvio) => {
    setEditandoDirId(d.id);
    setFormDir({ nombre_completo: d.nombre_completo, direccion: d.direccion, codigo_postal: d.codigo_postal, ciudad: d.ciudad, provincia: d.provincia, pais: d.pais, telefono: d.telefono, es_predeterminada: d.es_predeterminada });
    setModalDireccion(true);
  };

  const guardarDireccion = async () => {
    if (!user) return;
    if (!formDir.nombre_completo.trim() || !formDir.direccion.trim() || !formDir.ciudad.trim() || !formDir.codigo_postal.trim() || !formDir.telefono.trim()) return;
    setGuardandoDir(true);

    // Si es predeterminada, quitar la anterior
    if (formDir.es_predeterminada) {
      await supabase.from('direcciones_envio').update({ es_predeterminada: false }).eq('usuario_id', user.id);
    }

    if (editandoDirId) {
      await supabase.from('direcciones_envio').update({ ...formDir }).eq('id', editandoDirId);
    } else {
      await supabase.from('direcciones_envio').insert({ ...formDir, usuario_id: user.id });
    }

    await cargarDatos();
    setModalDireccion(false);
    setGuardandoDir(false);
  };

  const eliminarDireccion = async (id: string) => {
    await supabase.from('direcciones_envio').delete().eq('id', id);
    setDirecciones(prev => prev.filter(d => d.id !== id));
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  const menuItems: { key: Seccion; label: string; Icon: any }[] = [
    { key: 'pedidos',     label: 'Mis Pedidos',       Icon: ShoppingBag },
    { key: 'direcciones', label: 'Mis Direcciones',   Icon: MapPin      },
    { key: 'datos',       label: 'Datos Personales',  Icon: User        },
    { key: 'seguridad',   label: 'Seguridad',         Icon: Lock        },
  ];

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Cabecera */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Mi Cuenta</h1>
          {perfil && <p className="text-gray-500 mt-1 text-sm">{perfil.email}</p>}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* Sidebar navegación */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Avatar */}
              <div className="p-5 border-b border-gray-100 flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg shrink-0">
                  {perfil?.nombre_completo?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || '?'}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">
                    {perfil?.nombre_completo || 'Mi perfil'}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                </div>
              </div>

              {/* Menú */}
              <nav className="p-2">
                {menuItems.map(({ key, label, Icon }) => (
                  <button key={key} onClick={() => setSeccion(key)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${
                      seccion === key
                        ? 'bg-blue-50 text-blue-600 font-medium'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}>
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{label}</span>
                    {key === 'pedidos' && pedidos.length > 0 && (
                      <span className="ml-auto bg-gray-100 text-gray-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        {pedidos.length}
                      </span>
                    )}
                  </button>
                ))}
                <div className="border-t border-gray-100 mt-2 pt-2">
                  <button onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-500 hover:bg-red-50 transition-colors">
                    <LogOut className="w-4 h-4" />
                    Cerrar sesión
                  </button>
                </div>
              </nav>
            </div>
          </div>

          {/* Contenido principal */}
          <div className="lg:col-span-3">

            {/* ── MIS PEDIDOS ── */}
            {seccion === 'pedidos' && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-gray-800">Mis Pedidos</h2>

                {cargando ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
                      <div className="flex justify-between">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-5 w-20" />
                      </div>
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  ))
                ) : pedidos.length === 0 ? (
                  <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
                    <ShoppingBag className="w-14 h-14 text-gray-200 mx-auto mb-4" />
                    <h3 className="text-base font-semibold text-gray-700 mb-2">Aún no tienes pedidos</h3>
                    <p className="text-sm text-gray-400 mb-6">Cuando realices tu primera compra aparecerá aquí.</p>
                    <Link to="/products"
                      className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors">
                      Ver catálogo
                    </Link>
                  </div>
                ) : (
                  pedidos.map(pedido => {
                    const cfg = ESTADOS[pedido.estado] || ESTADOS.pendiente;
                    const Icon = cfg.Icon;
                    const abierto = pedidoAbierto === pedido.id;

                    return (
                      <div key={pedido.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                        {/* Cabecera del pedido */}
                        <button
                          onClick={() => togglePedido(pedido.id)}
                          className="w-full text-left p-5 hover:bg-gray-50/50 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 flex-wrap mb-2">
                                <span className="font-bold text-gray-900 font-mono text-sm">
                                  #{pedido.numero_pedido}
                                </span>
                                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.color}`}>
                                  <Icon className="w-3 h-3" />
                                  {cfg.label}
                                </span>
                              </div>
                              <div className="flex items-center gap-4 text-xs text-gray-400 flex-wrap">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {new Date(pedido.fecha_pedido).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                                </span>
                                {pedido.metodo_pago && (
                                  <span>{pedido.metodo_pago}</span>
                                )}
                                {pedido.numero_seguimiento && (
                                  <span className="flex items-center gap-1 text-purple-600">
                                    <Truck className="w-3 h-3" />
                                    {pedido.numero_seguimiento}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <span className="text-lg font-bold text-blue-600">
                                {Number(pedido.total).toFixed(2)} €
                              </span>
                              {abierto
                                ? <ChevronUp className="w-4 h-4 text-gray-400" />
                                : <ChevronDown className="w-4 h-4 text-gray-400" />
                              }
                            </div>
                          </div>
                        </button>

                        {/* Detalle expandido */}
                        {abierto && (
                          <div className="border-t border-gray-100 p-5 space-y-4 bg-gray-50/30">

                            {/* Líneas */}
                            {!pedido.lineas_pedido ? (
                              <div className="space-y-2">
                                <Skeleton className="h-14 w-full" />
                                <Skeleton className="h-14 w-full" />
                              </div>
                            ) : pedido.lineas_pedido.length === 0 ? (
                              <p className="text-sm text-gray-400">Sin artículos.</p>
                            ) : (
                              <div className="space-y-2">
                                {pedido.lineas_pedido.map(linea => {
                                  // Normalizar: puede venir como array o como objeto
                                  const prod: ProductoLinea | null = linea.productos
                                    ? Array.isArray(linea.productos)
                                      ? (linea.productos[0] ?? null)
                                      : linea.productos
                                    : null;
                                  return (
                                  <div key={linea.id} className="flex items-center gap-3 bg-white rounded-lg p-3 border border-gray-100">
                                    <div className="w-10 h-10 rounded-lg border border-gray-100 bg-gray-50 overflow-hidden shrink-0 flex items-center justify-center">
                                      {prod?.imagen_principal
                                        ? <img src={prod.imagen_principal} alt={prod.nombre} className="w-full h-full object-cover" />
                                        : <Package className="w-4 h-4 text-gray-300" />
                                      }
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-gray-800 truncate">
                                        {prod?.nombre || 'Producto'}
                                      </p>
                                      <p className="text-xs text-gray-400">
                                        {prod?.codigo_producto} · ×{linea.cantidad} · {Number(linea.precio_unitario).toFixed(2)} € / ud.
                                      </p>
                                    </div>
                                    <span className="text-sm font-bold text-gray-900 shrink-0">
                                      {Number(linea.precio_total).toFixed(2)} €
                                    </span>
                                  </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* Totales */}
                            <div className="bg-white rounded-lg border border-gray-100 p-4 space-y-1.5 text-sm">
                              <div className="flex justify-between text-gray-500">
                                <span>Subtotal</span>
                                <span>{Number(pedido.subtotal).toFixed(2)} €</span>
                              </div>
                              <div className="flex justify-between text-gray-500">
                                <span>IVA</span>
                                <span>{Number(pedido.impuestos).toFixed(2)} €</span>
                              </div>
                              <div className="flex justify-between text-gray-500">
                                <span>Envío</span>
                                <span>{Number(pedido.gastos_envio) === 0 ? 'Gratis' : `${Number(pedido.gastos_envio).toFixed(2)} €`}</span>
                              </div>
                              <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-100">
                                <span>Total</span>
                                <span>{Number(pedido.total).toFixed(2)} €</span>
                              </div>
                            </div>

                            {pedido.notas && (
                              <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-xs text-amber-700">
                                <span className="font-semibold">Notas: </span>{pedido.notas}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* ── MIS DIRECCIONES ── */}
            {seccion === 'direcciones' && (
              <div>
                <div className="flex justify-between items-center mb-5">
                  <h2 className="text-lg font-bold text-gray-800">Mis Direcciones</h2>
                  <button onClick={abrirNuevaDireccion}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors">
                    <Plus className="w-4 h-4" /> Nueva dirección
                  </button>
                </div>

                {cargando ? (
                  <div className="space-y-3">
                    <Skeleton className="h-28 w-full" />
                    <Skeleton className="h-28 w-full" />
                  </div>
                ) : direcciones.length === 0 ? (
                  <div className="bg-white rounded-xl border border-gray-100 p-10 text-center">
                    <MapPin className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                    <p className="text-sm text-gray-400 mb-4">No tienes direcciones guardadas.</p>
                    <button onClick={abrirNuevaDireccion}
                      className="text-blue-600 text-sm font-semibold hover:underline">
                      Añadir primera dirección
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {direcciones.map(d => (
                      <div key={d.id}
                        className={`bg-white rounded-xl border p-5 relative ${d.es_predeterminada ? 'border-blue-300 shadow-sm' : 'border-gray-100'}`}>
                        {d.es_predeterminada && (
                          <span className="absolute top-3 right-3 inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                            <Star className="w-2.5 h-2.5" /> Predeterminada
                          </span>
                        )}
                        <p className="font-semibold text-gray-900 text-sm mb-1 pr-20">{d.nombre_completo}</p>
                        <p className="text-xs text-gray-500 leading-relaxed">
                          {d.direccion}<br />
                          {d.codigo_postal} {d.ciudad}, {d.provincia}<br />
                          {d.pais}<br />
                          {d.telefono}
                        </p>
                        <div className="flex gap-2 mt-3">
                          <button onClick={() => abrirEditarDireccion(d)}
                            className="flex items-center gap-1.5 text-xs text-blue-600 hover:bg-blue-50 px-2.5 py-1.5 rounded-lg transition-colors font-medium">
                            <Edit2 className="w-3 h-3" /> Editar
                          </button>
                          <button onClick={() => eliminarDireccion(d.id)}
                            className="flex items-center gap-1.5 text-xs text-red-500 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-colors font-medium">
                            <Trash2 className="w-3 h-3" /> Eliminar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── DATOS PERSONALES ── */}
            {seccion === 'datos' && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-bold text-gray-800">Datos Personales</h2>
                  {!editandoDatos && (
                    <button onClick={() => setEditandoDatos(true)}
                      className="flex items-center gap-2 text-sm text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors font-medium">
                      <Edit2 className="w-4 h-4" /> Editar
                    </button>
                  )}
                </div>

                {exitoDatos && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
                    ✓ Datos actualizados correctamente.
                  </div>
                )}

                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Nombre completo</label>
                      {editandoDatos ? (
                        <input type="text" value={formDatos.nombre_completo}
                          onChange={e => setFormDatos(f => ({ ...f, nombre_completo: e.target.value }))}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      ) : (
                        <p className="text-sm text-gray-900 font-medium">{perfil?.nombre_completo || '—'}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
                      <p className="text-sm text-gray-500">{user?.email}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">El email no se puede cambiar desde aquí.</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Teléfono</label>
                      {editandoDatos ? (
                        <input type="tel" value={formDatos.telefono}
                          onChange={e => setFormDatos(f => ({ ...f, telefono: e.target.value }))}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="+34 600 000 000" />
                      ) : (
                        <p className="text-sm text-gray-900 font-medium">{perfil?.telefono || '—'}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Empresa</label>
                      {editandoDatos ? (
                        <input type="text" value={formDatos.empresa}
                          onChange={e => setFormDatos(f => ({ ...f, empresa: e.target.value }))}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Nombre de la empresa (opcional)" />
                      ) : (
                        <p className="text-sm text-gray-900 font-medium">{perfil?.empresa || '—'}</p>
                      )}
                    </div>
                  </div>

                  {editandoDatos && (
                    <div className="flex gap-3 pt-2">
                      <button onClick={guardarDatos} disabled={guardandoDatos}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
                        <Save className="w-4 h-4" />
                        {guardandoDatos ? 'Guardando...' : 'Guardar cambios'}
                      </button>
                      <button onClick={() => setEditandoDatos(false)}
                        className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        Cancelar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── SEGURIDAD ── */}
            {seccion === 'seguridad' && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-6">Cambiar Contraseña</h2>

                {exitoPass && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
                    ✓ Contraseña actualizada correctamente.
                  </div>
                )}
                {errorPass && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{errorPass}</div>
                )}

                <div className="space-y-4 max-w-sm">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Nueva contraseña</label>
                    <input type="password" value={formPass.nueva}
                      onChange={e => setFormPass(f => ({ ...f, nueva: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Mínimo 6 caracteres" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Confirmar contraseña</label>
                    <input type="password" value={formPass.confirmar}
                      onChange={e => setFormPass(f => ({ ...f, confirmar: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Repite la contraseña" />
                  </div>
                  <button onClick={cambiarPassword} disabled={guardandoPass || !formPass.nueva || !formPass.confirmar}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
                    <Lock className="w-4 h-4" />
                    {guardandoPass ? 'Guardando...' : 'Actualizar contraseña'}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* ── MODAL DIRECCIÓN ── */}
      {modalDireccion && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center px-6 py-5 border-b border-gray-100 sticky top-0 bg-white">
              <h3 className="text-base font-semibold text-gray-800">
                {editandoDirId ? 'Editar dirección' : 'Nueva dirección'}
              </h3>
              <button onClick={() => setModalDireccion(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-3">
              {[
                { key: 'nombre_completo', label: 'Nombre completo', placeholder: 'Juan García', type: 'text' },
                { key: 'telefono',        label: 'Teléfono',        placeholder: '+34 600 000 000', type: 'tel'  },
                { key: 'direccion',       label: 'Dirección',       placeholder: 'Calle Mayor, 1, 2ºA', type: 'text' },
              ].map(({ key, label, placeholder, type }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{label} <span className="text-red-500">*</span></label>
                  <input type={type} value={(formDir as any)[key]}
                    onChange={e => setFormDir(f => ({ ...f, [key]: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={placeholder} />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Código postal <span className="text-red-500">*</span></label>
                  <input type="text" value={formDir.codigo_postal}
                    onChange={e => setFormDir(f => ({ ...f, codigo_postal: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="28001" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Ciudad <span className="text-red-500">*</span></label>
                  <input type="text" value={formDir.ciudad}
                    onChange={e => setFormDir(f => ({ ...f, ciudad: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Madrid" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Provincia</label>
                  <input type="text" value={formDir.provincia}
                    onChange={e => setFormDir(f => ({ ...f, provincia: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Madrid" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">País</label>
                  <input type="text" value={formDir.pais}
                    onChange={e => setFormDir(f => ({ ...f, pais: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer select-none pt-1">
                <input type="checkbox" checked={formDir.es_predeterminada}
                  onChange={e => setFormDir(f => ({ ...f, es_predeterminada: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <span className="text-sm text-gray-700">Usar como dirección predeterminada</span>
              </label>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 sticky bottom-0 bg-white">
              <button onClick={() => setModalDireccion(false)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button onClick={guardarDireccion} disabled={guardandoDir}
                className="px-5 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg font-semibold transition-colors flex items-center gap-2">
                <Save className="w-4 h-4" />
                {guardandoDir ? 'Guardando...' : editandoDirId ? 'Guardar cambios' : 'Añadir dirección'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}