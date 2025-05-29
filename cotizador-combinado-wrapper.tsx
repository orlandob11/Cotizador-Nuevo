"use client"

import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { obtenerCotizacionPorId } from "@/services/cotizaciones-service"
import type { CotizacionCombinada } from "@/types/cotizaciones"
import CotizadorCombinadoMejorado from "@/cotizador-combinado-mejorado"

export function CotizadorCombinadoWrapper() {
  const searchParams = useSearchParams()
  const cotizacionId = searchParams.get("id")
  const [cotizacionInicial, setCotizacionInicial] = useState<CotizacionCombinada | null>(null)
  const [cargando, setCargando] = useState(false)

  useEffect(() => {
    if (cotizacionId) {
      setCargando(true)
      obtenerCotizacionPorId(cotizacionId)
        .then((cotizacion) => {
          if (cotizacion && cotizacion.tipo === "combinado") {
            setCotizacionInicial(cotizacion as CotizacionCombinada)
          }
        })
        .catch((error) => {
          console.error("Error al cargar cotización:", error)
        })
        .finally(() => {
          setCargando(false)
        })
    }
  }, [cotizacionId])

  if (cargando) {
    return <div>Cargando cotización...</div>
  }

  return <CotizadorCombinadoMejorado cotizacionInicial={cotizacionInicial} />
}
