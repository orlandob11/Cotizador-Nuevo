import { Suspense } from "react"
import { CotizadorCombinadoWrapper } from "@/cotizador-combinado-wrapper"

export default function CotizadorCombinadoPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <CotizadorCombinadoWrapper />
    </Suspense>
  )
}
