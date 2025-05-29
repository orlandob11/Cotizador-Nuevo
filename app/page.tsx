import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Printer, ArrowRight, BarChart4, Settings, Zap, Layers } from "lucide-react"
import { MobileOptimizedContainer } from "@/components/mobile-optimized-container"
import { HistorialCotizaciones } from "@/components/historial-cotizaciones"

export default function HomePage() {
  return (
    <MobileOptimizedContainer className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8 md:py-16">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-500 to-teal-500 p-8 md:p-12 mb-12 shadow-xl">
          <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,rgba(255,255,255,0.5),rgba(255,255,255,0.1))]"></div>
          <div className="absolute h-32 w-32 rounded-full bg-white/20 blur-3xl -top-10 -right-10"></div>
          <div className="absolute h-20 w-20 rounded-full bg-white/20 blur-2xl bottom-10 left-10"></div>

          <div className="relative z-10 text-center md:text-left md:max-w-2xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4 text-white">
              Cotizador 2025
            </h1>
            <p className="text-lg md:text-xl text-white/90 max-w-2xl">
              Plataforma avanzada para crear cotizaciones profesionales de manera rápida y eficiente
            </p>

            <div className="flex flex-wrap gap-3 mt-8 justify-center md:justify-start">
              <div className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-sm text-white backdrop-blur-md">
                <Zap className="mr-1 h-4 w-4" />
                <span>Cálculos automáticos</span>
              </div>
              <div className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-sm text-white backdrop-blur-md">
                <BarChart4 className="mr-1 h-4 w-4" />
                <span>Análisis de rentabilidad</span>
              </div>
              <div className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-sm text-white backdrop-blur-md">
                <Settings className="mr-1 h-4 w-4" />
                <span>Personalizable</span>
              </div>
            </div>
          </div>
        </div>

        {/* Cards Section */}
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">Nuestras Herramientas</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          <Card className="group overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white dark:bg-gray-800">
            <div className="h-2 bg-gradient-to-r from-blue-500 to-blue-600"></div>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900 group-hover:bg-blue-200 dark:group-hover:bg-blue-800 transition-colors">
                  <Printer className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle className="text-xl">Cotizador de Impresión</CardTitle>
              </div>
              <CardDescription className="text-base">
                Crea cotizaciones para trabajos de impresión con cálculos de área y precios por pie cuadrado.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
                <li className="flex items-center">
                  <span className="mr-2 text-blue-500">•</span>
                  <span>Cálculo automático de áreas</span>
                </li>
                <li className="flex items-center">
                  <span className="mr-2 text-blue-500">•</span>
                  <span>Precios por pie cuadrado</span>
                </li>
                <li className="flex items-center">
                  <span className="mr-2 text-blue-500">•</span>
                  <span>Ideal para banners, vinilos y lonas</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                asChild
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 group-hover:shadow-md transition-all"
              >
                <Link href="/cotizador-impresion" className="flex items-center justify-center">
                  Abrir Cotizador de Impresión
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </CardFooter>
          </Card>

          <Card className="group overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white dark:bg-gray-800">
            <div className="h-2 bg-gradient-to-r from-teal-500 to-teal-600"></div>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 rounded-full bg-teal-100 dark:bg-teal-900 group-hover:bg-teal-200 dark:group-hover:bg-teal-800 transition-colors">
                  <FileText className="h-6 w-6 text-teal-600 dark:text-teal-400" />
                </div>
                <CardTitle className="text-xl">Cotizador General</CardTitle>
              </div>
              <CardDescription className="text-base">
                Crea cotizaciones para fabricaciones, letreros y trabajos en general con opciones flexibles.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
                <li className="flex items-center">
                  <span className="mr-2 text-teal-500">•</span>
                  <span>Fabricaciones y letreros</span>
                </li>
                <li className="flex items-center">
                  <span className="mr-2 text-teal-500">•</span>
                  <span>Cálculo de márgenes y comisiones</span>
                </li>
                <li className="flex items-center">
                  <span className="mr-2 text-teal-500">•</span>
                  <span>Exportación en múltiples formatos</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                asChild
                className="w-full bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 group-hover:shadow-md transition-all"
              >
                <Link href="/cotizador-general" className="flex items-center justify-center">
                  Abrir Cotizador General
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
          <Card className="group overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white dark:bg-gray-800">
            <div className="h-2 bg-gradient-to-r from-purple-500 to-pink-600"></div>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900 group-hover:bg-purple-200 dark:group-hover:bg-purple-800 transition-colors">
                  <Layers className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <CardTitle className="text-xl">Cotizador Combinado</CardTitle>
              </div>
              <CardDescription className="text-base">
                La herramienta más completa que combina impresión y cotización general con gestión avanzada de costos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
                <li className="flex items-center">
                  <span className="mr-2 text-purple-500">•</span>
                  <span>Ítems de venta y costos separados</span>
                </li>
                <li className="flex items-center">
                  <span className="mr-2 text-purple-500">•</span>
                  <span>Precio por pie² o monto total</span>
                </li>
                <li className="flex items-center">
                  <span className="mr-2 text-purple-500">•</span>
                  <span>Análisis avanzado de márgenes</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                asChild
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 group-hover:shadow-md transition-all"
              >
                <Link href="/cotizador-combinado" className="flex items-center justify-center">
                  Abrir Cotizador Combinado
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Historial de Cotizaciones */}
        <div className="mt-16 max-w-5xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Cotizaciones Guardadas</CardTitle>
              <CardDescription>Historial de cotizaciones guardadas en la base de datos</CardDescription>
            </CardHeader>
            <CardContent>
              <HistorialCotizaciones />
            </CardContent>
          </Card>
        </div>

        {/* Features Section */}
        <div className="mt-16 max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <div className="rounded-full w-12 h-12 bg-blue-100 dark:bg-blue-900 flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Rápido y Eficiente</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Genera cotizaciones profesionales en minutos con cálculos automáticos y plantillas personalizables.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <div className="rounded-full w-12 h-12 bg-teal-100 dark:bg-teal-900 flex items-center justify-center mb-4">
                <BarChart4 className="h-6 w-6 text-teal-600 dark:text-teal-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Análisis Detallado</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Visualiza costos, márgenes y rentabilidad con gráficos interactivos y reportes detallados.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <div className="rounded-full w-12 h-12 bg-purple-100 dark:bg-purple-900 flex items-center justify-center mb-4">
                <Settings className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Personalizable</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Adapta el sistema a tus necesidades con opciones flexibles para diferentes tipos de proyectos.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            © {new Date().getFullYear()} Cotizador 2025. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </MobileOptimizedContainer>
  )
}
