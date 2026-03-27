import { Box } from "lucide-react";
import { Link } from "react-router";
import { useAuth } from "../context/AuthContext";

const ADMIN_EMAIL = "admin@ahbsolutions.com";

export function Footer() {
  const { user } = useAuth();
  const isAdmin = user?.email === ADMIN_EMAIL;

  const handleLinkClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <Box className="h-8 w-8 text-blue-500" />
              <span className="font-bold text-xl tracking-tight">AHB Solutions</span>
            </div>
            <p className="text-gray-400 max-w-sm">
              Tu proveedor de confianza para soluciones profesionales en metacrilato. 
              Calidad y resistencia en cada diseño.
            </p>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4 text-gray-100">Enlaces Rápidos</h4>
            <ul className="space-y-2">
              <li><Link to="/" onClick={handleLinkClick} className="text-gray-400 hover:text-white transition-colors">Inicio</Link></li>
              <li><Link to="/products" onClick={handleLinkClick} className="text-gray-400 hover:text-white transition-colors">Catálogo</Link></li>
              <li><Link to="/offers" onClick={handleLinkClick} className="text-gray-400 hover:text-white transition-colors">Ofertas</Link></li>
              <li><Link to="/about" onClick={handleLinkClick} className="text-gray-400 hover:text-white transition-colors">Sobre Nosotros</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4 text-gray-100">Cuenta</h4>
            <ul className="space-y-2">
              {!user && (
                <>
                  <li><Link to="/login" onClick={handleLinkClick} className="text-gray-400 hover:text-white transition-colors">Iniciar Sesión</Link></li>
                  <li><Link to="/register" onClick={handleLinkClick} className="text-gray-400 hover:text-white transition-colors">Crear Cuenta</Link></li>
                </>
              )}

              {user && (
                <li><Link to="/cart" onClick={handleLinkClick} className="text-gray-400 hover:text-white transition-colors">Mi Carrito</Link></li>
              )}

              {isAdmin && (
                <li className="pt-2">
                  <Link to="/admin" onClick={handleLinkClick} className="text-blue-400 hover:text-blue-300 text-sm flex items-center transition-colors">
                    ⚙️ Panel de Administración
                  </Link>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* MÉTODOS DE PAGO */}
        <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col items-center justify-center">
          <h4 className="text-sm font-semibold text-gray-400 mb-6 uppercase tracking-wider">
            Pago 100% Seguro
          </h4>

          <div className="flex flex-wrap justify-center gap-4 md:gap-6 items-center opacity-80 hover:opacity-100 transition-opacity">

            <a href="https://www.visa.es/paga-con-visa/click-to-pay.html" target="_blank" rel="noopener noreferrer">
              <div className="bg-white px-2 py-1 rounded-md flex items-center justify-center h-18 w-25 shadow-sm border border-gray-200">
                <img src="/imagenes_productos/logoVisa.jpg" alt="Visa" className="h-7 w-auto object-contain" />
              </div>
            </a>

            <a href="https://www.mastercard.com/es/es/personal/ways-to-pay/click-to-pay.html" target="_blank" rel="noopener noreferrer">
              <div className="bg-white px-2 py-1 rounded-md flex items-center justify-center h-18 w-25 shadow-sm border border-gray-200">
                <img src="/imagenes_productos/logoMastercard.jpg" alt="Mastercard" className="h-8 w-auto object-contain" />
              </div>
            </a>

            <a href="https://www.americanexpress.com/es/beneficios/centro-de-seguridad/formas-de-pagar/pagos-moviles/" target="_blank" rel="noopener noreferrer">
              <div className="bg-white px-2 py-1 rounded-md flex items-center justify-center h-18 w-25 shadow-sm border border-gray-200">
                <img src="/imagenes_productos/logoAmericanExpress.jpg" alt="American Express" className="h-8 w-auto object-contain" />
              </div>
            </a>

            <a href="https://www.dinersclub.es/tarjetas-virtuales" target="_blank" rel="noopener noreferrer">
              <div className="bg-white px-2 py-1 rounded-md flex items-center justify-center h-18 w-25 shadow-sm border border-gray-200">
                <img src="/imagenes_productos/logoDinnersClubInternational.jpg" alt="Diners Club" className="h-7 w-auto object-contain" />
              </div>
            </a>

            <a href="https://www.paypal.com/es/legalhub/paypal/useragreement-full" target="_blank" rel="noopener noreferrer">
              <div className="bg-white px-2 py-1 rounded-md flex items-center justify-center h-18 w-25 shadow-sm border border-gray-200">
                <img src="/imagenes_productos/logoPaypal.jpg" alt="PayPal" className="h-6 w-auto object-contain"/>
                
                
              </div>
            </a>

          </div>
        </div>

        {/* COPYRIGHT */}
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-500 text-sm flex flex-col md:flex-row justify-between items-center">
          <p>&copy; {new Date().getFullYear()} AHB Solutions. Todos los derechos reservados.</p>
          <div className="mt-4 md:mt-0 space-x-6">
            <Link to="#" className="hover:text-gray-300 transition-colors">Política de Privacidad</Link>
            <Link to="#" className="hover:text-gray-300 transition-colors">Términos y Condiciones</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}