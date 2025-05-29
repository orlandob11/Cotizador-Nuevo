"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { obtenerCotizaciones, eliminarCotizacion } from "@/services/cotizaciones-service"
import type { Cotizacion } from "@/types/cotizaciones"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Edit, Trash2, FileText, Calculator, Search, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"

// Función para determinar la variante del badge según el margen
const getMarginVariant = (margin: number): "success" | "warning" | "destructive" => {
  if (margin >= 30) return "success"
  if (margin >= 15) return "warning"
  return "destructive"
}

// Función para formatear precios
const formatearPrecioDOP = (precio: number) => {
  return new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP" }).format(precio)
}

export function HistorialCotizaciones() {
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([])
  const [cargando, setCargando] = useState(true)
  const [filtro, setFiltro] = useState("")
  const [tipoActivo, setTipoActivo] = useState<"todas" | "general" | "impresion" | "combinado">("todas")
  const [cotizacionAEliminar, setCotizacionAEliminar] = useState<string | null>(null)
  const router = useRouter()

  // Cargar cotizaciones al montar el componente
  useEffect(() => {
    cargarCotizaciones()
  }, [])

  // Función para cargar cotizaciones
  const cargarCotizaciones = async () => {
    setCargando(true)
    try {
      const data = await obtenerCotizaciones()
      setCotizaciones(data)
    } catch (error) {
      console.error("Error al cargar cotizaciones:", error)
    } finally {
      setCargando(false)
    }
  }

  // Filtrar cotizaciones según el tipo y el texto de búsqueda
  const cotizacionesFiltradas = cotizaciones.filter((cotizacion) => {
    // Filtrar por tipo
    if (tipoActivo !== "todas" && cotizacion.tipo !== tipoActivo) {
      return false
    }

    // Filtrar por texto
    if (filtro) {
      const textoFiltro = filtro.toLowerCase()
      return (
        cotizacion.nombre.toLowerCase().includes(textoFiltro) ||
        (cotizacion.cliente && cotizacion.cliente.toLowerCase().includes(textoFiltro))
      )
    }

    return true
  })

  // Función para confirmar eliminación
  const confirmarEliminar = (id: string) => {
    setCotizacionAEliminar(id)
  }

  // Función para eliminar cotización
  const eliminarCotizacionConfirmada = async () => {
    if (!cotizacionAEliminar) return

    try {
      const eliminado = await eliminarCotizacion(cotizacionAEliminar)
      if (eliminado) {
        // Actualizar la lista de cotizaciones
        setCotizaciones(cotizaciones.filter((c) => c.id !== cotizacionAEliminar))
      }
    } catch (error) {
      console.error("Error al eliminar cotización:", error)
    } finally {
      setCotizacionAEliminar(null)
    }
  }

  // Función para editar cotización
  const editarCotizacion = (cotizacion: Cotizacion) => {
    if (cotizacion.tipo === "general") {
      router.push(`/cotizador-general?id=${cotizacion.id}`)
    } else if (cotizacion.tipo === "combinado") {
      router.push(`/cotizador-combinado?id=${cotizacion.id}`)
    } else {
      router.push(`/cotizador-impresion?id=${cotizacion.id}`)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl">Historial de Cotizaciones</CardTitle>
        <CardDescription>Cotizaciones guardadas en la base de datos</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar cotización..."
                className="pl-8"
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
              />
            </div>
            <Tabs value={tipoActivo} onValueChange={(v) => setTipoActivo(v as any)}>
              <TabsList>
                <TabsTrigger value="todas">Todas</TabsTrigger>
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="combinado">Combinado</TabsTrigger>
                <TabsTrigger value="impresion">Impresión</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {cargando ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : cotizacionesFiltradas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No hay cotizaciones guardadas</p>
            </div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Costo</TableHead>
                    <TableHead>Precio Final</TableHead>
                    <TableHead>Margen</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cotizacionesFiltradas.map((cotizacion) => (
                    <TableRow key={cotizacion.id}>
                      <TableCell className="font-medium">{cotizacion.nombre}</TableCell>
                      <TableCell>{cotizacion.cliente || "N/A"}</TableCell>
                      <TableCell>
                        {cotizacion.tipo === "general" ? (
                          <span className="flex items-center gap-1">
                            <Calculator className="h-4 w-4" /> General
                          </span>
                        ) : cotizacion.tipo === "combinado" ? (
                          <span className="flex items-center gap-1">
                            <Calculator className="h-4 w-4" /> Combinado
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <FileText className="h-4 w-4" /> Impresión
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {cotizacion.fechaCreacion ? new Date(cotizacion.fechaCreacion).toLocaleDateString() : "N/A"}
                      </TableCell>
                      <TableCell>{cotizacion.costoTotal ? formatearPrecioDOP(cotizacion.costoTotal) : "N/A"}</TableCell>
                      <TableCell>
                        {cotizacion.precioFinal ? formatearPrecioDOP(cotizacion.precioFinal) : "N/A"}
                      </TableCell>
                      <TableCell>
                        {cotizacion.costoTotal && cotizacion.precioFinal ? (
                          <Badge
                            variant={getMarginVariant(
                              ((cotizacion.precioFinal - cotizacion.costoTotal) / cotizacion.precioFinal) * 100,
                            )}
                          >
                            {(
                              ((cotizacion.precioFinal - cotizacion.costoTotal) / cotizacion.precioFinal) *
                              100
                            ).toFixed(2)}
                            %
                          </Badge>
                        ) : (
                          "N/A"
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => editarCotizacion(cotizacion)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive"
                            onClick={() => confirmarEliminar(cotizacion.id!)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={cargarCotizaciones}>
          Actualizar
        </Button>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/cotizador-general">Nueva Cotización General</Link>
          </Button>
          <Button asChild>
            <Link href="/cotizador-impresion">Nueva Cotización de Impresión</Link>
          </Button>
        </div>
      </CardFooter>

      {/* Diálogo de confirmación para eliminar */}
      <Dialog open={!!cotizacionAEliminar} onOpenChange={(open) => !open && setCotizacionAEliminar(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar esta cotización? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCotizacionAEliminar(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={eliminarCotizacionConfirmada}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
