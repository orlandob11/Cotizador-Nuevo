import { HistorialCotizaciones } from "@/components/historial-cotizaciones"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MobileOptimizedContainer } from "@/components/mobile-optimized-container"
import Link from "next/link"
import { ChevronRight } from "lucide-react"

export default function HistorialPage() {
  return (
    <MobileOptimizedContainer className="container mx-auto p-4 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="h-9">
            <Link href="/">
              <ChevronRight className="mr-1 h-4 w-4 rotate-180" />
              <span className="sm:inline">Volver</span>
            </Link>
          </Button>
          <h1 className="text-xl sm:text-2xl font-bold truncate">Historial de Cotizaciones</h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Todas las Cotizaciones</CardTitle>
          <CardDescription>Gestiona todas tus cotizaciones guardadas en la base de datos</CardDescription>
        </CardHeader>
        <CardContent>
          <HistorialCotizaciones />
        </CardContent>
      </Card>
    </MobileOptimizedContainer>
  )
}
