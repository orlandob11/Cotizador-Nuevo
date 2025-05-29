"use client"

import { useEffect } from "react"
import { Check, X } from "lucide-react"

interface NotificacionGuardadoProps {
  visible: boolean
  exito: boolean
  mensaje: string
  onClose: () => void
}

export function NotificacionGuardado({ visible, exito, mensaje, onClose }: NotificacionGuardadoProps) {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        onClose()
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [visible, onClose])

  if (!visible) return null

  return (
    <div
      className={`fixed top-4 right-4 z-50 p-4 rounded-md shadow-lg flex items-center space-x-2 ${
        exito ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
      }`}
    >
      <div className="flex-shrink-0">
        {exito ? <Check className="h-5 w-5 text-green-500" /> : <X className="h-5 w-5 text-red-500" />}
      </div>
      <div className="flex-1">{mensaje}</div>
      <button onClick={onClose} className="flex-shrink-0">
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
