import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Comprobando permisos...</p>
      </div>
    );
  }

  // Si no hay usuario logueado, lo mandamos a la página principal
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Si está logueado, mostramos el contenido protegido (el panel de admin)
  return <>{children}</>;
};