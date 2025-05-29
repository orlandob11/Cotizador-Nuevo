"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/use-toast"
import { guardarCotizacion } from "@/services/cotizaciones-service"
import type { CotizacionImpresion } from "@/types/cotizaciones"
import CotizadorImpresionNuevo from "./cotizador-impresion-nuevo"

export default function CotizadorImpresionDB({ cotizacionInicial }: { cotizacionInicial: CotizacionImpresion | null }) {
  const router = useRouter()
  const [guardando, setGuardando] = useState(false)

  const handleGuardarCotizacion = async (cotizacion: CotizacionImpresion) => {
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
          router.push(`/cotizador-impresion?id=${resultado.id}`)
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
    <CotizadorImpresionNuevo
      cotizacionInicial={cotizacionInicial}
      onGuardarDB={handleGuardarCotizacion}
      guardando={guardando}
    />
  )
}
