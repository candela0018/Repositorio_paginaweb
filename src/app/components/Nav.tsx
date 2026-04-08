import { Link, useLocation } from "react-router";
import { Box, User, LogIn, Menu, X, UserCircle, ShoppingCart, LogOut, Settings } from "lucide-react";
import { useState } from "react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../../lib/supabase";

// 🔥 Mismo correo de administrador que usas en el Footer
const ADMIN_EMAIL = "admin@ahbsolutions.com";

export function Nav() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  
  const location = useLocation();
  
  const { getTotalItems } = useCart();
  const { user } = useAuth();
  
  const isAdmin = user?.email === ADMIN_EMAIL;

  const handleCartClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (location.pathname === '/cart') {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    if (location.pathname === path) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsUserMenuOpen(false);
    setIsMobileMenuOpen(false);
    
    // Forzamos una recarga completa de la página enviando al usuario al inicio
    window.location.href = '/';
  };

  const navLinks = [
    { name: "Inicio", path: "/" },
    { name: "Catálogo", path: "/products" },
    { name: "Ofertas", path: "/offers" },
    { name: "Sobre Nosotros", path: "/about" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="bg-white border-b border-gray-200 fixed w-full z-[9999]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <Box className="h-8 w-8 text-blue-600" />
            <span className="font-bold text-xl text-gray-900 hidden sm:block">AHB Solutions</span>
            <span className="font-bold text-xl text-gray-900 sm:hidden">AHB</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={(e) => handleNavClick(e, link.path)}
                className={`text-sm font-medium transition-colors ${
                  isActive(link.path)
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-blue-600 hover:border-b-2 hover:border-blue-600"
                } flex items-center h-16 px-1`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Desktop User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            
            {/* User Dropdown */}
            <div 
              className="relative"
              onMouseEnter={() => setIsUserMenuOpen(true)}
              onMouseLeave={() => setIsUserMenuOpen(false)}
            >
              <button className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 transition-colors text-gray-600 hover:text-blue-600">
                <UserCircle className="h-7 w-7" />
              </button>
              
              {/* Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="absolute right-0 pt-2">
                  <div className="w-56 bg-white rounded-md shadow-lg py-1 border border-gray-200">
                    
                    {user ? (
                      <>
                        <div className="px-4 py-3 border-b border-gray-100">
                          <p className="text-xs text-gray-500 mb-1">Conectado como:</p>
                          <p className="text-sm font-medium text-gray-900 truncate">{user.email}</p>
                        </div>
                        
                        {isAdmin && (
                          <Link
                            to="/admin"
                            className="flex items-center px-4 py-2 mt-1 text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors"
                          >
                            <Settings className="h-4 w-4 mr-3" />
                            Panel de Administración
                          </Link>
                        )}
                        
                        <button
                          onClick={handleLogout}
                          className="w-full text-left flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors mt-1 cursor-pointer"
                        >
                          <LogOut className="h-4 w-4 mr-3" />
                          Cerrar Sesión
                        </button>
                      </>
                    ) : (
                      <>
                        <Link
                          to="/login"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          <LogIn className="h-4 w-4 mr-3" />
                          Iniciar Sesión
                        </Link>
                        <Link
                          to="/register"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          <User className="h-4 w-4 mr-3" />
                          Registrarse
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Cart Icon */}
            <Link to="/cart" onClick={handleCartClick} className="relative flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 transition-colors text-gray-600 hover:text-blue-600">
              <ShoppingCart className="h-6 w-6" />
              {getTotalItems() > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {getTotalItems()}
                </span>
              )}
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-2">
            <Link to="/cart" onClick={handleCartClick} className="relative flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 transition-colors text-gray-600 hover:text-blue-600">
              <ShoppingCart className="h-6 w-6" />
              {getTotalItems() > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {getTotalItems()}
                </span>
              )}
            </Link>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-600 hover:text-gray-900 focus:outline-none"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 shadow-lg">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={(e) => {
                  handleNavClick(e, link.path);
                  setIsMobileMenuOpen(false);
                }}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  isActive(link.path)
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-700 hover:bg-gray-50 hover:text-blue-600"
                }`}
              >
                {link.name}
              </Link>
            ))}
            
            {/* Mobile Auth Divider */}
            <div className="border-t border-gray-200 pt-4 pb-2 mt-4">
              
              {user ? (
                <>
                  <div className="px-3 py-2 mb-2 bg-gray-50 rounded-md">
                    <p className="text-xs text-gray-500 mb-1">Conectado como:</p>
                    <p className="text-sm font-medium text-gray-900 truncate">{user.email}</p>
                  </div>

                  {isAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center px-3 py-2 rounded-md text-base font-medium text-blue-600 hover:bg-blue-50 transition-colors"
                    >
                      <Settings className="mr-3 h-5 w-5" />
                      Panel de Administración
                    </Link>
                  )}

                  <button
                    onClick={handleLogout}
                    className="w-full text-left flex items-center px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    <LogOut className="mr-3 h-5 w-5" />
                    Cerrar Sesión
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-blue-600"
                  >
                    <LogIn className="mr-3 h-5 w-5" />
                    Iniciar Sesión
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center px-3 py-2 mt-1 rounded-md text-base font-medium bg-blue-600 text-white hover:bg-blue-700"
                  >
                    <User className="mr-3 h-5 w-5" />
                    Crear Cuenta
                  </Link>
                </>
              )}
              
            </div>
          </div>
        </div>
      )}
    </header>
  );
}