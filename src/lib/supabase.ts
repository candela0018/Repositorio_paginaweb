import { createClient } from '@supabase/supabase-js';

// Esto le dice a TypeScript que import.meta.env es válido en Vite
/// <reference types="vite/client" />

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltan las variables de entorno de Supabase. Revisa tu archivo .env');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);