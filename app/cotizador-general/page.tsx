import { obtenerCotizacionPorId } from "@/services/cotizaciones-service"
import CotizadorGeneralWrapper from "@/cotizador-general-wrapper"

export default async function CotizadorGeneralPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  // Obtener el ID de la cotización de los parámetros de búsqueda
  const id = searchParams.id as string | undefined

  // Si hay un ID, obtener la cotización de la base de datos
  let cotizacionInicial = null
  if (id) {
    try {
      cotizacionInicial = await obtenerCotizacionPorId(id)
      console.log("Cotización cargada en page.tsx:", cotizacionInicial)

      // Asegurarse de que el precio final sea un número
      if (cotizacionInicial && typeof cotizacionInicial.precioFinal !== "number") {
        cotizacionInicial.precioFinal = Number.parseFloat(cotizacionInicial.precioFinal as any) || 0
      }
    } catch (error) {
      console.error("Error al cargar la cotización:", error)
      // No establecemos cotizacionInicial a null porque ya lo es por defecto
    }
  }

  return <CotizadorGeneralWrapper cotizacionInicial={cotizacionInicial} />
}
