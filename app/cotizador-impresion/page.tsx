import { Suspense } from "react"
import { obtenerCotizacionPorId } from "@/services/cotizaciones-service"
import CotizadorImpresionNuevo from "@/cotizador-impresion-nuevo"
import { Loader2 } from "lucide-react"

interface CotizadorImpresionPageProps {
  searchParams: { id?: string }
}

export default async function CotizadorImpresionPage({ searchParams }: CotizadorImpresionPageProps) {
  // Si hay un ID en los parámetros de búsqueda, cargar la cotización
  let cotizacion = null
  if (searchParams.id) {
    cotizacion = await obtenerCotizacionPorId(searchParams.id)
  }

  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }
    >
      <CotizadorImpresionNuevo cotizacionInicial={cotizacion} />
    </Suspense>
  )
}
