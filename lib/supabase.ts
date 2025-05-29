import { createClient } from "@supabase/supabase-js"

// Singleton para el cliente de Supabase en el navegador
let supabaseBrowserClient: ReturnType<typeof createClient> | null = null

export function getSupabaseBrowserClient() {
  if (!supabaseBrowserClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("Error: Variables de entorno de Supabase no configuradas correctamente")
      console.error("NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl ? "Configurado" : "No configurado")
      console.error("NEXT_PUBLIC_SUPABASE_ANON_KEY:", supabaseAnonKey ? "Configurado" : "No configurado")
      throw new Error("Variables de entorno de Supabase no configuradas correctamente")
    }

    console.log("Inicializando cliente de Supabase con URL:", supabaseUrl)
    try {
      supabaseBrowserClient = createClient(supabaseUrl, supabaseAnonKey)
      console.log("Cliente de Supabase inicializado correctamente")
    } catch (error) {
      console.error("Error al inicializar cliente de Supabase:", error)
      throw error
    }
  }
  return supabaseBrowserClient
}

// Cliente para operaciones del servidor
export function getSupabaseServerClient() {
  const supabaseUrl = process.env.SUPABASE_URL || ""
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Error: Variables de entorno de Supabase para el servidor no configuradas correctamente")
    throw new Error("Variables de entorno de Supabase para el servidor no configuradas correctamente")
  }

  return createClient(supabaseUrl, supabaseServiceKey)
}
