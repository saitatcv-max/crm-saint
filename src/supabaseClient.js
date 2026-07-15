import { createClient } from '@supabase/supabase-js';

// Intentar obtener las credenciales de las variables de entorno de Vite
let supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
let supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Si no están configuradas en las variables de entorno, buscar en localStorage
// Esto permite al usuario configurar sus credenciales directamente desde la interfaz del CRM
if (!supabaseUrl || !supabaseAnonKey) {
  supabaseUrl = localStorage.getItem('saint_crm_supabase_url') || '';
  supabaseAnonKey = localStorage.getItem('saint_crm_supabase_anon_key') || '';
}

// Inicializar el cliente (puede fallar temporalmente si las llaves están vacías,
// pero exportamos una función para reinicializar si cambian)
export let supabase = null;

if (supabaseUrl && supabaseAnonKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  } catch (error) {
    console.error('Error al inicializar Supabase:', error);
  }
}

// Función para actualizar las credenciales y recrear el cliente
export const updateSupabaseCredentials = (url, anonKey) => {
  localStorage.setItem('saint_crm_supabase_url', url);
  localStorage.setItem('saint_crm_supabase_anon_key', anonKey);
  
  if (url && anonKey) {
    supabase = createClient(url, anonKey);
    return true;
  }
  supabase = null;
  return false;
};

// Función para verificar si Supabase está configurado correctamente
export const isSupabaseConfigured = () => {
  return supabase !== null;
};
