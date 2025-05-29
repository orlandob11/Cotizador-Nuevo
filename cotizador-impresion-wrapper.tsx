"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import CotizadorImpresionNuevo from "./cotizador-impresion-nuevo"
import { GuardarCotizacionButton } from "@/components/guardar-cotizacion-button"
import type { CotizacionImpresion } from "@/types/cotizaciones"

interface CotizadorImpresionWrapperProps {
  cotizacionInicial?: CotizacionImpresion | null
}

export default function CotizadorImpresionWrapper({ cotizacionInicial }: CotizadorImpresionWrapperProps) {
  const [cotizacionActual, setCotizacionActual] = useState<CotizacionImpresion | null>(null)
  const router = useRouter()

  // Cuando se carga una cotización inicial, actualizamos el estado
  useEffect(() => {
    if (cotizacionInicial) {
      setCotizacionActual(cotizacionInicial)
    }
  }, [cotizacionInicial])

  // Función para actualizar la cotización actual desde el componente hijo
  const handleCotizacionActualizada = (cotizacion: CotizacionImpresion) => {
    setCotizacionActual(cotizacion)
  }

  // Función para manejar cuando se guarda la cotización
  const handleCotizacionGuardada = (id: string) => {
    // Si es una nueva cotización, redirigir a la página de edición
    if (!cotizacionActual?.id) {
      router.push(`/cotizador-impresion?id=${id}`)
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
      <CotizadorImpresionNuevo
        cotizacionInicial={cotizacionInicial}
        onCotizacionActualizada={handleCotizacionActualizada}
      />
    </>
  )
}
