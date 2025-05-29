"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import CotizadorGeneralModerno from "./cotizador-general-moderno"
import { GuardarCotizacionButton } from "@/components/guardar-cotizacion-button"
import type { CotizacionGeneral } from "@/types/cotizaciones"
import { Loader2 } from "lucide-react"

interface CotizadorGeneralWrapperProps {
  cotizacionInicial?: CotizacionGeneral | null
}

export default function CotizadorGeneralWrapper({ cotizacionInicial }: CotizadorGeneralWrapperProps) {
  const [cotizacionActual, setCotizacionActual] = useState<CotizacionGeneral | null>(null)
  const [cargando, setCargando] = useState(false)
  const router = useRouter()

  // Usamos useRef para evitar actualizaciones innecesarias
  const cotizacionInicialRef = useRef(cotizacionInicial)
  const cotizacionActualizadaRef = useRef(false)

  // Cuando se carga una cotización inicial, actualizamos el estado solo una vez
  useEffect(() => {
    if (cotizacionInicial && !cotizacionActualizadaRef.current) {
      console.log("Cotización inicial en wrapper:", cotizacionInicial)
      console.log("Precio final en cotización inicial (wrapper):", cotizacionInicial.precioFinal)
      setCotizacionActual(cotizacionInicial)
      cotizacionActualizadaRef.current = true
    }
  }, [cotizacionInicial])

  // Función para actualizar la cotización actual desde el componente hijo
  // Usamos una función de callback para evitar dependencias circulares
  const handleCotizacionActualizada = (cotizacion: CotizacionGeneral) => {
    console.log("Cotización actualizada en wrapper:", cotizacion)
    console.log("Precio final en cotización actualizada (wrapper):", cotizacion.precioFinal)

    // Solo actualizamos si hay cambios significativos
    setCotizacionActual((prevCotizacion) => {
      if (!prevCotizacion) return cotizacion

      // Comparamos solo los campos relevantes para evitar actualizaciones innecesarias
      if (
        prevCotizacion.precioFinal !== cotizacion.precioFinal ||
        prevCotizacion.margenGanancia !== cotizacion.margenGanancia ||
        prevCotizacion.porcentajeComision !== cotizacion.porcentajeComision ||
        prevCotizacion.nombre !== cotizacion.nombre ||
        prevCotizacion.cliente !== cotizacion.cliente ||
        prevCotizacion.nota !== cotizacion.nota ||
        JSON.stringify(prevCotizacion.items) !== JSON.stringify(cotizacion.items)
      ) {
        return cotizacion
      }

      return prevCotizacion
    })
  }

  // Función para manejar cuando se guarda la cotización
  const handleCotizacionGuardada = (id: string) => {
    // Si es una nueva cotización, redirigir a la página de edición
    if (!cotizacionActual?.id) {
      router.push(`/cotizador-general?id=${id}`)
    }
    // Actualizar el ID de la cotización actual
    if (cotizacionActual) {
      setCotizacionActual({
        ...cotizacionActual,
        id,
      })
    }
  }

  // Renderizamos el componente original con props adicionales
  return (
    <div>
      {cargando ? (
        <div className="flex justify-center items-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <>
          {/* Botón para guardar en la base de datos */}
          {cotizacionActual && (
            <div className="fixed bottom-4 right-4 z-50">
              <GuardarCotizacionButton
                cotizacion={cotizacionActual}
                onGuardado={handleCotizacionGuardada}
                className="shadow-lg"
              />
            </div>
          )}

          {/* Componente original */}
          <CotizadorGeneralModerno
            cotizacionInicial={cotizacionInicialRef.current}
            onCotizacionActualizada={handleCotizacionActualizada}
          />
        </>
      )}
    </div>
  )
}
