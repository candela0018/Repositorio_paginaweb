import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { Product } from "../data/products";
import { Link } from "react-router";
import { ArrowRight, ShieldCheck, Factory, Award, Clock, Tag } from "lucide-react";

// Array de imágenes profesionales (metacrilato, industria, reflejos, láser)
const HERO_IMAGES = [
  "/imagenes_productos/metacrilatoFondo1.jpg",
  "/imagenes_productos/metacrilatoFondo2.jpg",
  "/imagenes_productos/metacrilatoFondo3.jpg"
];

export function Home() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [featuredProducts, setFeaturedProducts]   = useState<Product[]>([]);

  // Carrusel automático cada 5 segundos
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImageIndex(prev =>
        prev === HERO_IMAGES.length - 1 ? 0 : prev + 1
      );
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Carga productos destacados desde Supabase
  useEffect(() => {
    async function cargarDestacados() {
      const [
        { data: cats  },
        { data: prods },
        { data: ofs   },
      ] = await Promise.all([
        supabase.from('categorias_productos').select('id, nombre_categoria'),
        supabase
          .from('productos')
          .select('*')
          .eq('activo', true)
          .eq('destacado', true)
          .order('nombre', { ascending: true })
          .limit(4),
        supabase.from('ofertas').select('*').eq('activa', true),
      ]);

      // Mapa id → nombre_categoria
      const catMap: Record<string, string> = {};
      (cats || []).forEach(c => { catMap[c.id] = c.nombre_categoria; });

      // Mapa producto_id → oferta
      const ofertaMap: Record<string, any> = {};
      (ofs || []).forEach(o => { ofertaMap[o.producto_id] = o; });

      const mapped: Product[] = (prods || []).map(p => {
        const oferta = ofertaMap[p.id] || null;
        const tieneOferta =
          oferta &&
          oferta.activa &&
          new Date(oferta.fecha_inicio) <= new Date() &&
          new Date() <= new Date(oferta.fecha_fin);

        return {
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
        };
      });

      // Si no hay destacados, cargamos los 4 primeros activos como fallback
      if (mapped.length === 0) {
        const { data: fallback } = await supabase
          .from('productos')
          .select('*')
          .eq('activo', true)
          .order('nombre', { ascending: true })
          .limit(4);

        const fallbackMapped: Product[] = (fallback || []).map(p => ({
          id:              p.id,
          name:            p.nombre,
          description:     p.descripcion || '',
          price:           p.precio,
          category:        catMap[p.categoria_id] || '',
          image_principal: p.imagen_principal || '',
          stock:           p.stock ?? undefined,
        }));
        setFeaturedProducts(fallbackMapped);
      } else {
        setFeaturedProducts(mapped);
      }
    }

    cargarDestacados();
  }, []);

  return (
    <div className="bg-white">

      {/* Hero Section Animado */}
      <div className="relative bg-gray-900 text-white min-h-[600px] flex items-center overflow-hidden">

        {HERO_IMAGES.map((img, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentImageIndex ? "opacity-100 z-0" : "opacity-0 -z-10"
            }`}
          >
            <img
              src={img}
              alt={`Fondo de metacrilato ${index + 1}`}
              className={`w-full h-full object-cover transition-transform duration-[10000ms] ease-linear ${
                index === currentImageIndex ? "scale-110" : "scale-100"
              }`}
            />
          </div>
        ))}

        <div className="absolute inset-0 bg-black/50 z-0"></div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32 flex flex-col items-center text-center">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl drop-shadow-lg">
            Soluciones en Metacrilato
          </h1>
          <p className="mt-6 text-xl max-w-2xl text-gray-100 drop-shadow-md">
            En AHB Solutions somos especialistas en diseño, fabricación y distribución de productos de metacrilato de la más alta calidad para comercios y particulares.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <Link
              to="/products"
              className="bg-blue-600 text-white px-8 py-3 rounded-md font-bold hover:bg-blue-700 transition-all transform hover:scale-105 shadow-xl flex items-center justify-center gap-2 border border-blue-600"
            >
              Ver Catálogo <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/offers"
              className="bg-white/10 backdrop-blur-sm border-2 border-white text-white px-8 py-3 rounded-md font-bold hover:bg-white/20 transition-all transform hover:scale-105 shadow-xl flex items-center justify-center gap-2"
            >
              <Tag className="w-5 h-5" />
              Productos en Oferta
            </Link>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="flex flex-col items-center text-center p-6 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all">
              <Factory className="w-12 h-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Fabricación Propia</h3>
              <p className="text-gray-600">Controlamos todo el proceso para asegurar la máxima calidad en cada corte y doblez.</p>
            </div>
            <div className="flex flex-col items-center text-center p-6 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all">
              <Award className="w-12 h-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Calidad Premium</h3>
              <p className="text-gray-600">Utilizamos metacrilato de colada de alta transparencia y resistencia al paso del tiempo.</p>
            </div>
            <div className="flex flex-col items-center text-center p-6 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all">
              <ShieldCheck className="w-12 h-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Compra Segura</h3>
              <p className="text-gray-600">Garantía total en envíos y devoluciones para que tu negocio nunca se detenga.</p>
            </div>
            <div className="flex flex-col items-center text-center p-6 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all">
              <Clock className="w-12 h-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Servicio 24/7</h3>
              <p className="text-gray-600">Tienda online disponible las 24 horas y sistema automatizado de recepción de llaves.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Products */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Productos Destacados</h2>
            <p className="mt-2 text-gray-600">Nuestros artículos de metacrilato más populares</p>
          </div>
          <Link to="/products" className="hidden sm:flex items-center text-blue-600 font-medium hover:text-blue-800 transition-colors">
            Ver todo <ArrowRight className="ml-1 w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {featuredProducts.map(product => (
            <Link key={product.id} to={`/products/${product.id}`} className="group">
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden transition-all transform group-hover:-translate-y-1 group-hover:shadow-xl">
                <div className="relative h-64 overflow-hidden bg-gray-100">
                  <img
                    src={product.image_principal}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="bg-white/95 backdrop-blur px-3 py-1 rounded-full text-xs font-semibold text-gray-800 shadow-sm">
                      {product.category}
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">{product.name}</h3>
                  <p className="text-gray-600 text-sm line-clamp-2 mb-4">{product.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-extrabold text-blue-600">{product.price.toFixed(2)}€</span>
                    <span className="text-sm font-medium text-gray-500 group-hover:text-blue-600 transition-colors">Ver detalles</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-8 sm:hidden flex justify-center">
          <Link to="/products" className="flex items-center text-blue-600 font-medium hover:text-blue-800">
            Ver todo el catálogo <ArrowRight className="ml-1 w-4 h-4" />
          </Link>
        </div>
      </div>

    </div>
  );
}