"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Save, Loader2 } from "lucide-react"

interface GuardarCotizacionButtonProps {
  cotizacion: any // Using 'any' to avoid type dependencies, replace with actual type if available
  onGuardado: (id: string) => void
  className?: string
}

export function GuardarCotizacionButton({ cotizacion, onGuardado, className }: GuardarCotizacionButtonProps) {
  const [guardando, setGuardando] = useState(false)

  const handleClick = async () => {
    setGuardando(true)
    try {
      // Simulate saving to a database and getting an ID
      // Replace this with your actual saving logic
      await new Promise((resolve) => setTimeout(resolve, 1000)) // Simulate network request
      const id = cotizacion.id || Math.random().toString(36).substring(7) // Generate a random ID if it's a new cotizacion
      onGuardado(id) // Notify the parent component about the saved cotizacion
    } catch (error) {
      console.error("Error al guardar la cotización:", error)
      alert("Error al guardar la cotización")
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Button onClick={handleClick} disabled={guardando} className={className}>
      {guardando ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Guardando...
        </>
      ) : (
        <>
          <Save className="mr-2 h-4 w-4" />
          Guardar
        </>
      )}
    </Button>
  )
}
