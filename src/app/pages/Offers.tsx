import { Link } from "react-router";
import { Tag, Clock, ShoppingCart, AlertCircle } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { Product } from "../data/products";

function OfferCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden border-2 border-transparent animate-pulse">
      <div className="h-64 bg-gray-200" />
      <div className="p-6 space-y-3">
        <div className="h-5 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-full" />
        <div className="h-3 bg-gray-200 rounded w-5/6" />
        <div className="space-y-1 pt-1">
          <div className="h-7 bg-gray-200 rounded w-1/3" />
          <div className="h-3 bg-gray-200 rounded w-1/4" />
        </div>
        <div className="h-3 bg-gray-100 rounded w-1/4" />
        <div className="h-11 bg-gray-200 rounded-md w-full mt-2" />
      </div>
    </div>
  );
}

export function Offers() {
  const { addToCart } = useCart();
  const [offerProducts, setOfferProducts] = useState<Product[]>([]);
  const [cargando, setCargando]           = useState(true);
  const [error, setError]                 = useState<string | null>(null);
  const [addedProducts, setAddedProducts] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function cargarOfertas() {
      setCargando(true);
      setError(null);

      try {
        const [
          { data: cats,  error: eCats },
          { data: ofs,   error: eOfs  },
        ] = await Promise.all([
          supabase.from('categorias_productos').select('id, nombre_categoria'),
          supabase.from('ofertas').select('*').eq('activa', true),
        ]);

        if (eCats) throw new Error(eCats.message);
        if (eOfs)  throw new Error(eOfs.message);

        const ahora = new Date();
        const ofertasVigentes = (ofs || []).filter(o =>
          new Date(o.fecha_inicio) <= ahora && ahora <= new Date(o.fecha_fin)
        );

        if (ofertasVigentes.length === 0) {
          setOfferProducts([]);
          setCargando(false);
          return;
        }

        const ids = ofertasVigentes.map(o => o.producto_id);
        const { data: prods, error: eProds } = await supabase
          .from('productos')
          .select('*')
          .in('id', ids)
          .eq('activo', true);

        if (eProds) throw new Error(eProds.message);

        const catMap: Record<string, string> = {};
        (cats || []).forEach(c => { catMap[c.id] = c.nombre_categoria; });

        const ofertaMap: Record<string, any> = {};
        ofertasVigentes.forEach(o => { ofertaMap[o.producto_id] = o; });

        const mapped: Product[] = (prods || []).map(p => {
          const oferta = ofertaMap[p.id];
          return {
            id:              p.id,
            name:            p.nombre,
            description:     p.descripcion || '',
            price:           p.precio,
            originalPrice:   p.precio_original ?? undefined,
            discount:        oferta.porcentaje_descuento,
            category:        catMap[p.categoria_id] || '',
            image_principal: p.imagen_principal || '',
            stock:           p.stock ?? undefined,
            endDate:         new Date(oferta.fecha_fin).toISOString().split('T')[0],
          };
        });

        setOfferProducts(mapped);
      } catch (err: any) {
        setError(err.message || 'Error al cargar ofertas');
      } finally {
        setCargando(false);
      }
    }

    cargarOfertas();
  }, []);

  const handleAddToCart = (product: Product) => {
    addToCart(product);
    setAddedProducts(prev => new Set(prev).add(product.id));
    setTimeout(() => {
      setAddedProducts(prev => {
        const next = new Set(prev);
        next.delete(product.id);
        return next;
      });
    }, 2000);
  };

  const calculateTimeLeft = (endDate?: string) => {
    if (!endDate) return 0;
    const diff = new Date(endDate).getTime() - new Date().getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero */}
      <div className="bg-gradient-to-r from-red-600 to-orange-500 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center mb-4">
            <Tag className="h-12 w-12 mr-3" />
            <h1 className="text-4xl md:text-5xl font-extrabold">Productos en Oferta</h1>
          </div>
          <p className="text-center text-xl text-red-50 max-w-2xl mx-auto">
            Aprovecha nuestros descuentos especiales en productos de metacrilato de alta calidad. ¡Ofertas por tiempo limitado!
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Ofertas Especiales</h2>
            <p className="text-gray-600 mt-1">
              {cargando ? '' : `${offerProducts.length} producto${offerProducts.length !== 1 ? 's' : ''} en oferta`}
            </p>
          </div>
          <div className="hidden md:flex items-center gap-2 bg-red-100 text-red-800 px-4 py-2 rounded-full">
            <Clock className="h-5 w-5" />
            <span className="font-semibold">Ofertas por tiempo limitado</span>
          </div>
        </div>

        {/* Error */}
        {!cargando && error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>No se pudieron cargar las ofertas: {error}</span>
          </div>
        )}

        {/* Skeleton */}
        {cargando && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, i) => <OfferCardSkeleton key={i} />)}
          </div>
        )}

        {/* Sin ofertas */}
        {!cargando && !error && offerProducts.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-12 text-center">
            <Tag className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg font-medium">No hay ofertas activas en este momento.</p>
            <p className="text-gray-400 text-sm mt-2">Vuelve pronto para descubrir nuevas promociones.</p>
            <Link to="/products" className="mt-6 inline-block text-blue-600 font-medium hover:text-blue-800">
              Ver catálogo completo
            </Link>
          </div>
        )}

        {/* Grid de ofertas */}
        {!cargando && !error && offerProducts.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {offerProducts.map(product => {
              const isAdded  = addedProducts.has(product.id);
              const daysLeft = calculateTimeLeft(product.endDate);

              return (
                <div key={product.id} className="group">
                  <div className="bg-white rounded-lg shadow-md overflow-hidden transition-all transform group-hover:-translate-y-1 group-hover:shadow-xl border-2 border-transparent group-hover:border-red-400">
                    <Link to={`/products/${product.id}`} className="block relative h-64 overflow-hidden bg-gray-200">
                      <img
                        src={product.image_principal}
                        alt={product.name}
                        className="w-full h-full object-contain p-4 bg-white transition-transform group-hover:scale-105"
                      />
                      <div className="absolute top-4 right-4">
                        <div className="bg-red-600 text-white px-3 py-2 rounded-lg shadow-lg transform rotate-3">
                          <span className="text-2xl font-bold">-{product.discount}%</span>
                        </div>
                      </div>
                      <div className="absolute top-4 left-4">
                        <span className="bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-semibold text-gray-800">
                          {product.category}
                        </span>
                      </div>
                      {product.stock && product.stock < 10 && (
                        <div className="absolute bottom-4 left-4">
                          <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                            ¡Solo {product.stock} unidades!
                          </span>
                        </div>
                      )}
                    </Link>

                    <div className="p-6">
                      <Link to={`/products/${product.id}`} className="block mb-2">
                        <h3 className="text-lg font-bold text-gray-900 line-clamp-1 hover:text-red-600 transition-colors">
                          {product.name}
                        </h3>
                      </Link>
                      <p className="text-gray-600 text-sm line-clamp-2 mb-4">{product.description}</p>

                      <div className="mb-4">
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="text-2xl font-extrabold text-red-600">{product.price.toFixed(2)}€</span>
                          <span className="text-lg text-gray-400 line-through">{product.originalPrice?.toFixed(2)}€</span>
                        </div>
                        <p className="text-sm text-green-700 font-medium">
                          Ahorras {((product.originalPrice || 0) - product.price).toFixed(2)}€
                        </p>
                      </div>

                      <div className="flex items-center gap-1 text-xs text-gray-500 mb-4">
                        <Clock className="h-3 w-3" />
                        <span>Quedan {daysLeft} días</span>
                      </div>

                      <button
                        onClick={() => handleAddToCart(product)}
                        disabled={isAdded}
                        className={`w-full py-3 rounded-md font-semibold transition-all flex items-center justify-center gap-2 ${
                          isAdded
                            ? 'bg-green-600 text-white'
                            : 'bg-red-600 text-white hover:bg-red-700'
                        }`}
                      >
                        {isAdded ? (
                          <><span className="text-lg">✓</span> Añadido al carrito</>
                        ) : (
                          <><ShoppingCart className="h-5 w-5" /> Añadir al carrito</>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Banner */}
        <div className="mt-12 bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">¿No encuentras lo que buscas?</h3>
              <p className="text-gray-600">Visita nuestro catálogo completo con todos los productos de metacrilato</p>
            </div>
            <Link
              to="/products"
              className="bg-blue-600 text-white px-6 py-3 rounded-md font-semibold hover:bg-blue-700 transition-colors whitespace-nowrap"
            >
              Ver Catálogo Completo
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}