import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';

// Definimos qué datos vamos a compartir en toda la app
type AuthContextType = {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
};

// Creamos el contexto
const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  isLoading: true,
});

// Este es el proveedor que envolverá a toda nuestra aplicación
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1. Obtener la sesión actual al cargar la página por primera vez
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // 2. Escuchar cambios (cuando el usuario hace login o logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // Limpiar la suscripción cuando el componente se desmonta
    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ session, user, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Un "hook" personalizado para usar la autenticación fácilmente en cualquier archivo
export const useAuth = () => {
  return useContext(AuthContext);
};