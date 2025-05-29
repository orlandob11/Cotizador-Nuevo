"use client"

import { useEffect } from "react"

/**
 * Hook personalizado para prevenir el zoom no deseado en dispositivos móviles
 * cuando el usuario interactúa con campos de formulario.
 */
export function usePreventZoom() {
  useEffect(() => {
    // Función para prevenir el zoom en eventos táctiles
    const preventZoom = (e: TouchEvent) => {
      // Verificar si el evento ocurre en un campo de formulario
      const target = e.target as HTMLElement
      const isFormField =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable

      // Si es un campo de formulario, prevenir el zoom
      if (isFormField) {
        // Prevenir el comportamiento predeterminado solo si es necesario
        // No prevenimos todos los eventos para mantener la funcionalidad táctil
        if (e.touches.length > 1) {
          e.preventDefault()
        }
      }
    }

    // Aplicar estilos CSS para mejorar la experiencia en móviles
    const style = document.createElement("style")
    style.innerHTML = `
      @media (max-width: 768px) {
        input, textarea, select {
          font-size: 16px !important; /* iOS no hace zoom en campos con 16px o más */
        }
        
        button, .btn, [role="button"] {
          min-height: 44px;
          min-width: 44px;
        }
        
        .mobile-container {
          touch-action: manipulation;
          -webkit-overflow-scrolling: touch;
        }
      }
    `
    document.head.appendChild(style)

    // Agregar listeners para eventos táctiles
    document.addEventListener("touchstart", preventZoom, { passive: false })
    document.addEventListener("touchmove", preventZoom, { passive: false })

    // Limpiar al desmontar
    return () => {
      document.removeEventListener("touchstart", preventZoom)
      document.removeEventListener("touchmove", preventZoom)
      document.head.removeChild(style)
    }
  }, [])
}
