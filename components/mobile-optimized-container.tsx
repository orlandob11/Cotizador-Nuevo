"use client"

import type { ReactNode } from "react"
import { usePreventZoom } from "@/hooks/use-prevent-zoom"

interface MobileOptimizedContainerProps {
  children: ReactNode
  className?: string
}

/**
 * Contenedor optimizado para dispositivos móviles que previene el zoom automático
 * y proporciona una experiencia más similar a una aplicación nativa.
 */
export function MobileOptimizedContainer({ children, className = "" }: MobileOptimizedContainerProps) {
  // Usar el hook para prevenir zoom
  usePreventZoom()

  return <div className={`mobile-container ${className}`}>{children}</div>
}
