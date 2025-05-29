"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/use-toast"
import { guardarCotizacion } from "@/services/cotizaciones-service"
import type { CotizacionGeneral } from "@/types/cotizaciones"
import CotizadorGeneralModerno from "./cotizador-general-moderno"

export default function CotizadorGeneralDB({ cotizacionInicial }: { cotizacionInicial: CotizacionGeneral | null }) {
  const router = useRouter()
  const [guardando, setGuardando] = useState(false)

  const handleGuardarCotizacion = async (cotizacion: CotizacionGeneral) => {
    setGuardando(true)
    try {
      const resultado = await guardarCotizacion(cotizacion)
      if (resultado.success) {
        toast({
          title: "Cotización guardada",
          description: "La cotización se ha guardado correctamente en la base de datos.",
        })
        // Si es una nueva cotización, redirigir a la página de edición
        if (!cotizacion.id && resultado.id) {
          router.push(`/cotizador-general?id=${resultado.id}`)
        }
        return resultado.id
      } else {
        throw new Error(resultado.error || "Error al guardar la cotización")
      }
    } catch (error) {
      console.error("Error al guardar cotización:", error)
      toast({
        title: "Error al guardar",
        description: (error as Error).message,
        variant: "destructive",
      })
      return null
    } finally {
      setGuardando(false)
    }
  }

  return (
    <CotizadorGeneralModerno
      cotizacionInicial={cotizacionInicial}
      onGuardarDB={handleGuardarCotizacion}
      guardando={guardando}
    />
  )
}
