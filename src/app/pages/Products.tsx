import { useState } from "react";
import { useProductos } from "../data/useProductos";
import { Filter, Search, AlertCircle } from "lucide-react";
import { ProductCard } from "../components/ProductCard";
import { Product } from "../data/products";

function useCategorias(productos: Product[]) {
  const set = new Set(productos.map(p => p.category).filter(Boolean));
  return Array.from(set).sort();
}

function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden animate-pulse">
      <div className="aspect-square bg-gray-200" />
      <div className="p-5 space-y-3">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-full" />
        <div className="h-3 bg-gray-200 rounded w-5/6" />
        <div className="flex justify-between items-center pt-3 border-t border-slate-100">
          <div className="h-6 bg-gray-200 rounded w-1/4" />
          <div className="h-9 bg-gray-200 rounded w-24" />
        </div>
      </div>
    </div>
  );
}

function SidebarSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-100 animate-pulse">
      <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-100">
        <div className="h-5 w-5 bg-gray-200 rounded" />
        <div className="h-5 bg-gray-200 rounded w-24" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-9 bg-gray-100 rounded-md" />
        ))}
      </div>
    </div>
  );
}

export function Products() {
  const { productos, cargando, error } = useProductos();
  const categorias = useCategorias(productos);

  const [activeCategory, setActiveCategory] = useState<string>("Todas");
  const [searchQuery, setSearchQuery]       = useState("");

  const filteredProducts = productos.filter(product => {
    const matchesCategory =
      activeCategory === "Todas" || product.category === activeCategory;
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Cabecera */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Catálogo de Metacrilato</h1>
            <p className="mt-2 text-gray-600">
              Explora nuestra selección completa de artículos de metacrilato de alta calidad.
            </p>
          </div>
          <div className="relative w-full md:w-72">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar productos..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Error */}
        {!cargando && error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>No se pudo cargar el catálogo: {error}</span>
          </div>
        )}

        {/* Skeleton */}
        {cargando && (
          <div className="flex flex-col md:flex-row gap-8">
            <div className="w-full md:w-64 flex-shrink-0">
              <SidebarSkeleton />
            </div>
            <div className="flex-grow grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          </div>
        )}

        {/* Contenido */}
        {!cargando && !error && (
          <div className="flex flex-col md:flex-row gap-8">

            {/* Sidebar */}
            <div className="w-full md:w-64 flex-shrink-0">
              <div className="bg-white rounded-lg shadow-sm p-5 sticky top-24 border border-gray-100">
                <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-100">
                  <Filter className="h-5 w-5 text-gray-500" />
                  <h3 className="text-lg font-semibold text-gray-900">Categorías</h3>
                </div>
                <ul className="space-y-2">
                  <li>
                    <button
                      onClick={() => handleCategoryChange("Todas")}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        activeCategory === "Todas"
                          ? "bg-blue-50 text-blue-700"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                    >
                      Todas las categorías
                    </button>
                  </li>
                  {categorias.map(category => (
                    <li key={category}>
                      <button
                        onClick={() => handleCategoryChange(category)}
                        className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                          activeCategory === category
                            ? "bg-blue-50 text-blue-700"
                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                        }`}
                      >
                        {category}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Grid */}
            <div className="flex-grow">
              {filteredProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProducts.map(product => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-12 text-center">
                  <p className="text-gray-500 text-lg">
                    No se encontraron productos que coincidan con tu búsqueda.
                  </p>
                  <button
                    onClick={() => { setSearchQuery(""); setActiveCategory("Todas"); }}
                    className="mt-4 text-blue-600 font-medium hover:text-blue-800"
                  >
                    Limpiar filtros
                  </button>
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
