/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  // Puedes añadir más variables de entorno aquí si las necesitas en el futuro
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}