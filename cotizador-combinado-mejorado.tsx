"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import {
  Calculator,
  FileText,
  Plus,
  Save,
  Trash2,
  GripVertical,
  Download,
  RefreshCw,
  Edit,
  ChevronDown,
  ChevronRight,
  Layers,
  DollarSign,
  Settings,
  Info,
  ChevronUp,
  AlertTriangle,
  Loader2,
  Copy,
  TrendingUp,
  Target,
  Sparkles,
  BarChart3,
  PieChart,
  Activity,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Lightbulb,
  Maximize2,
  Minimize2,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Importar y usar el contenedor optimizado para móviles
import { MobileOptimizedContainer } from "@/components/mobile-optimized-container"

// Importar servicios y tipos
import { guardarCotizacion } from "@/services/cotizaciones-service"
import { NotificacionGuardado } from "@/components/notificacion-guardado"
import type { CotizacionGeneral } from "@/types/cotizaciones"
import type { CotizacionCombinada } from "@/types/cotizaciones"

// Types
type UnidadMedida = "pulgadas" | "pies" | "centimetros" | "metros"

type PrecioConFormula = {
  valor: number | null
  formula?: string
  manual?: boolean
}

type ItemExtendido = {
  ancho: number | null
  alto: number | null
  unidadMedida: UnidadMedida
  costoPorPie: number | null
}

interface ItemBase {
  id: string
}

type Item = ItemBase & {
  descripcion: string
  cantidad: number
  precioUnitario: PrecioConFormula
  extendido?: ItemExtendido
  mostrarExtendido: boolean
  areaPiesCuadrados?: number
  esImpresion: boolean
  costoReal?: number
  categoria?: string
  tipoItem: "venta" | "costo"
  modoPrecio?: "porPie" | "total"
  precioTotal?: number
}

// Utility functions
const convertirAPiesCuadrados = (ancho: number, alto: number, unidad: UnidadMedida): number => {
  const factorConversion = {
    pulgadas: 1 / 144,
    pies: 1,
    centimetros: 1 / 929.0304,
    metros: 10.7639,
  }
  return ancho * alto * factorConversion[unidad]
}

const formatearPrecioDOP = (precio: number) => {
  return new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP" }).format(precio)
}

const calcularExpresion = (expresion: string): number => {
  try {
    // eslint-disable-next-line no-new-func
    const resultado = new Function(`return ${expresion}`)()
    return isNaN(resultado) ? 0 : resultado
  } catch (error) {
    console.error("Error al calcular la expresión:", error)
    return 0
  }
}

// Componente de estadísticas mejorado
const EstadisticasRapidas = ({
  items,
  precioFinal,
  costoTotal,
}: { items: Item[]; precioFinal: number; costoTotal: number }) => {
  const itemsVenta = items.filter((item) => item.tipoItem === "venta")
  const itemsCosto = items.filter((item) => item.tipoItem === "costo")
  const margenFinal = precioFinal > 0 ? ((precioFinal - costoTotal) / precioFinal) * 100 : 0

  const stats = [
    {
      label: "Ítems de Venta",
      value: itemsVenta.length,
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      label: "Ítems de Costo",
      value: itemsCosto.length,
      icon: AlertTriangle,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      label: "Margen Final",
      value: `${margenFinal.toFixed(1)}%`,
      icon: Target,
      color: margenFinal > 30 ? "text-green-600" : margenFinal > 15 ? "text-yellow-600" : "text-red-600",
      bgColor: margenFinal > 30 ? "bg-green-50" : margenFinal > 15 ? "bg-yellow-50" : "bg-red-50",
    },
    {
      label: "Ganancia",
      value: formatearPrecioDOP(precioFinal - costoTotal),
      icon: DollarSign,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, index) => (
        <Card key={index} className="border-0 shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className={`text-lg font-semibold ${stat.color}`}>{stat.value}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// Componente de formulario mejorado
const ItemFormMejorado = ({ onAdd }: { onAdd: (item: Item) => void }) => {
  const [descripcion, setDescripcion] = useState("")
  const [cantidad, setCantidad] = useState<number>(1)
  const [precioUnitario, setPrecioUnitario] = useState<PrecioConFormula>({ valor: null })
  const [mostrarExtendido, setMostrarExtendido] = useState(false)
  const [categoria, setCategoria] = useState<string>("")
  const [tipoItem, setTipoItem] = useState<"venta" | "costo">("venta")
  const [modoPrecio, setModoPrecio] = useState<"porPie" | "total">("porPie")
  const [precioTotal, setPrecioTotal] = useState<number | null>(null)
  const [itemExtendido, setItemExtendido] = useState<ItemExtendido>({
    ancho: null,
    alto: null,
    unidadMedida: "pies",
    costoPorPie: null,
  })
  const [expandido, setExpandido] = useState(true)

  const categorias = [
    { value: "impresion", label: "Impresión", icon: "🖨️", color: "bg-blue-50 text-blue-700 border-blue-200" },
    { value: "materiales", label: "Materiales", icon: "🔧", color: "bg-green-50 text-green-700 border-green-200" },
    { value: "mano_obra", label: "Mano de Obra", icon: "👷", color: "bg-yellow-50 text-yellow-700 border-yellow-200" },
    { value: "transporte", label: "Transporte", icon: "🚚", color: "bg-purple-50 text-purple-700 border-purple-200" },
    { value: "servicios", label: "Servicios", icon: "⚙️", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
    { value: "otros", label: "Otros", icon: "📦", color: "bg-gray-50 text-gray-700 border-gray-200" },
  ]

  const handleDescripcionChange = (value: string) => {
    setDescripcion(value)
    const lowerValue = value.toLowerCase()

    const esImpresion =
      lowerValue.includes("impresion") || lowerValue.includes("banner") || lowerValue.includes("vinil")

    const esMaterial =
      lowerValue.includes("material") ||
      lowerValue.includes("acm") ||
      lowerValue.includes("acrilico") ||
      lowerValue.includes("perfil") ||
      lowerValue.includes("mdf")

    const esManoObra =
      lowerValue.includes("instalacion") ||
      lowerValue.includes("corte") ||
      lowerValue.includes("armado") ||
      lowerValue.includes("soldadura")

    const esTransporte =
      lowerValue.includes("transporte") ||
      lowerValue.includes("envio") ||
      lowerValue.includes("flete") ||
      lowerValue.includes("entrega")

    if (esImpresion) {
      setCategoria("impresion")
      setMostrarExtendido(true)
    } else if (esMaterial) {
      setCategoria("materiales")
      setMostrarExtendido(false)
    } else if (esManoObra) {
      setCategoria("mano de obra")
      setMostrarExtendido(true)
    } else if (esTransporte) {
      setCategoria("transporte")
      setMostrarExtendido(false)
    } else {
      setMostrarExtendido(false)
    }
  }

  const handleCategoriaChange = (value: string) => {
    setCategoria(value)
    if (value === "impresion") {
      setMostrarExtendido(true)
    }
  }

  const handleItemExtendidoChange = (campo: keyof ItemExtendido, valor: number | null | UnidadMedida) => {
    setItemExtendido({ ...itemExtendido, [campo]: valor })
  }

  const handlePrecioChange = (valor: string) => {
    if (valor === "") {
      setPrecioUnitario({ valor: null, manual: true })
    } else if (valor.startsWith("=")) {
      setPrecioUnitario({ valor: null, formula: valor, manual: true })
    } else {
      const numeroValor = Number.parseFloat(valor)
      setPrecioUnitario({ valor: isNaN(numeroValor) ? null : numeroValor, manual: true })
    }
  }

  const calcularYActualizarPrecio = (precio: PrecioConFormula, setter: (value: PrecioConFormula) => void) => {
    if (precio.formula) {
      const resultado = calcularExpresion(precio.formula.slice(1))
      setter({ valor: resultado, formula: undefined })
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Formulario enviado", { descripcion, cantidad, precioUnitario })

    // Usar cantidad por defecto si es null
    const cantidadFinal = cantidad === null ? 1 : cantidad

    if (descripcion && cantidadFinal > 0 && precioUnitario.valor !== null) {
      const esImpresion = categoria === "impresion" || descripcion.toLowerCase().includes("impresion")
      let newItem: Item = {
        id: Date.now().toString(),
        descripcion,
        cantidad: cantidadFinal,
        precioUnitario,
        mostrarExtendido: esImpresion,
        esImpresion,
        categoria,
        tipoItem,
        modoPrecio: esImpresion ? modoPrecio : undefined,
        precioTotal: esImpresion && modoPrecio === "total" ? precioTotal : undefined,
      }

      if (
        esImpresion &&
        itemExtendido.ancho !== null &&
        itemExtendido.alto !== null &&
        itemExtendido.costoPorPie !== null
      ) {
        const areaPiesCuadrados = convertirAPiesCuadrados(
          itemExtendido.ancho,
          itemExtendido.alto,
          itemExtendido.unidadMedida,
        )

        newItem = {
          ...newItem,
          extendido: itemExtendido,
          areaPiesCuadrados,
        }
      }

      console.log("Agregando item:", newItem)
      onAdd(newItem)

      // Reset form
      setDescripcion("")
      setCantidad(1)
      setPrecioUnitario({ valor: null, formula: undefined })
      setMostrarExtendido(false)
      setCategoria("")
      setTipoItem("venta")
      setModoPrecio("porPie")
      setPrecioTotal(null)
      setItemExtendido({
        ancho: null,
        alto: null,
        unidadMedida: "pies",
        costoPorPie: null,
      })
    } else {
      console.log("Validación fallida:", {
        descripcion: !!descripcion,
        cantidad: cantidadFinal,
        precioUnitario: precioUnitario.valor,
      })
    }
  }

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50">
      <Collapsible open={expandido} onOpenChange={setExpandido}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-gray-50/50 transition-colors rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
                  <Plus className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl">Agregar Nuevo Ítem</CardTitle>
                  <CardDescription>Complete los campos para agregar un ítem a la cotización</CardDescription>
                </div>
              </div>
              {expandido ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Información básica */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-1 w-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"></div>
                  <h4 className="font-medium text-gray-900">Información Básica</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="descripcion" className="text-sm font-medium">
                      Descripción del Ítem
                    </Label>
                    <Input
                      id="descripcion"
                      value={descripcion}
                      onChange={(e) => handleDescripcionChange(e.target.value)}
                      placeholder="Ej: Banner publicitario, Letrero acrílico..."
                      className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cantidad" className="text-sm font-medium">
                      Cantidad
                    </Label>
                    <Input
                      id="cantidad"
                      type="number"
                      value={cantidad === null ? "1" : cantidad.toString()}
                      onChange={(e) => setCantidad(e.target.value === "" ? 1 : Number(e.target.value))}
                      min={1}
                      placeholder="1"
                      className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Categoría</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {categorias.map((cat) => (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => handleCategoriaChange(cat.value)}
                        className={`p-3 rounded-lg border-2 transition-all duration-200 hover:scale-105 ${
                          categoria === cat.value
                            ? cat.color + " border-current shadow-md"
                            : "bg-white border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="text-center">
                          <div className="text-lg mb-1">{cat.icon}</div>
                          <div className="text-xs font-medium">{cat.label}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Tipo de ítem */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-1 w-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-full"></div>
                  <h4 className="font-medium text-gray-900">Tipo de Ítem</h4>
                </div>

                <RadioGroup
                  value={tipoItem}
                  onValueChange={(value: "venta" | "costo") => setTipoItem(value)}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  <div
                    className={`relative p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer ${
                      tipoItem === "venta" ? "border-green-500 bg-green-50" : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <RadioGroupItem value="venta" id="tipo-venta" className="absolute top-4 right-4" />
                    <Label htmlFor="tipo-venta" className="cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-green-100">
                          <TrendingUp className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <div className="font-medium">Ítem de Venta</div>
                          <div className="text-sm text-gray-600">Suma al precio final</div>
                        </div>
                      </div>
                    </Label>
                  </div>

                  <div
                    className={`relative p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer ${
                      tipoItem === "costo" ? "border-orange-500 bg-orange-50" : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <RadioGroupItem value="costo" id="tipo-costo" className="absolute top-4 right-4" />
                    <Label htmlFor="tipo-costo" className="cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-orange-100">
                          <AlertTriangle className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                          <div className="font-medium">Ítem de Costo</div>
                          <div className="text-sm text-gray-600">Se deduce de la ganancia</div>
                        </div>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Precio */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-1 w-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
                  <h4 className="font-medium text-gray-900">{tipoItem === "venta" ? "Precio" : "Costo"}</h4>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="precioUnitario" className="text-sm font-medium">
                    {mostrarExtendido ? "Costo por pie cuadrado" : "Costo de materiales"}
                  </Label>
                  <Input
                    id="precioUnitario"
                    type="text"
                    value={
                      precioUnitario.formula || (precioUnitario.valor !== null ? precioUnitario.valor.toString() : "")
                    }
                    onChange={(e) => handlePrecioChange(e.target.value)}
                    onBlur={() => calcularYActualizarPrecio(precioUnitario, setPrecioUnitario)}
                    placeholder={mostrarExtendido ? "Costo por pie² o =expresión" : "Costo de materiales o =expresión"}
                    className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                  <p className="text-xs text-gray-500">
                    {mostrarExtendido
                      ? "Costo de materiales por pie cuadrado. Puede usar expresiones matemáticas comenzando con '='"
                      : "Costo total de materiales. Puede usar expresiones matemáticas comenzando con '='"}
                  </p>
                </div>
              </div>

              {/* Campos de impresión */}
              <Collapsible open={mostrarExtendido} onOpenChange={setMostrarExtendido}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="outline"
                    type="button"
                    className="w-full justify-between border-dashed border-2 hover:border-solid transition-all duration-200"
                  >
                    <span className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      {mostrarExtendido ? "Ocultar campos de impresión" : "Mostrar campos de impresión"}
                    </span>
                    {mostrarExtendido ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>

                <CollapsibleContent className="space-y-4 mt-4">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="h-1 w-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"></div>
                      <h4 className="font-medium text-blue-900">Configuración de Impresión</h4>
                    </div>

                    {tipoItem === "venta" && (
                      <div className="space-y-4 mb-4">
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                          <Label className="text-sm font-medium">Modo de Precio</Label>
                          <div className="flex items-center space-x-3">
                            <Label htmlFor="modoPorPie" className="text-sm cursor-pointer">
                              Por pie²
                            </Label>
                            <Switch
                              id="modoPrecio"
                              checked={modoPrecio === "total"}
                              onCheckedChange={(checked) => setModoPrecio(checked ? "total" : "porPie")}
                            />
                            <Label htmlFor="modoTotal" className="text-sm cursor-pointer">
                              Total
                            </Label>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="ancho" className="text-sm font-medium">
                          Ancho
                        </Label>
                        <Input
                          id="ancho"
                          type="number"
                          value={itemExtendido.ancho === null ? "" : itemExtendido.ancho}
                          onChange={(e) =>
                            handleItemExtendidoChange("ancho", e.target.value === "" ? null : Number(e.target.value))
                          }
                          min={0}
                          step={0.01}
                          placeholder="Ancho"
                          className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="alto" className="text-sm font-medium">
                          Alto
                        </Label>
                        <Input
                          id="alto"
                          type="number"
                          value={itemExtendido.alto === null ? "" : itemExtendido.alto}
                          onChange={(e) =>
                            handleItemExtendidoChange("alto", e.target.value === "" ? null : Number(e.target.value))
                          }
                          min={0}
                          step={0.01}
                          placeholder="Alto"
                          className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="unidadMedida" className="text-sm font-medium">
                          Unidad
                        </Label>
                        <Select
                          value={itemExtendido.unidadMedida}
                          onValueChange={(value) => handleItemExtendidoChange("unidadMedida", value as UnidadMedida)}
                        >
                          <SelectTrigger
                            id="unidadMedida"
                            className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                          >
                            <SelectValue placeholder="Unidad" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pulgadas">Pulgadas</SelectItem>
                            <SelectItem value="pies">Pies</SelectItem>
                            <SelectItem value="centimetros">Centímetros</SelectItem>
                            <SelectItem value="metros">Metros</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="costoPorPie" className="text-sm font-medium">
                          {modoPrecio === "total" ? "Precio total de venta" : "Precio por pie²"}
                        </Label>
                        <Input
                          id="costoPorPie"
                          type="number"
                          value={itemExtendido.costoPorPie === null ? "" : itemExtendido.costoPorPie}
                          onChange={(e) =>
                            handleItemExtendidoChange(
                              "costoPorPie",
                              e.target.value === "" ? null : Number(e.target.value),
                            )
                          }
                          min={0}
                          step={0.01}
                          placeholder={modoPrecio === "total" ? "Precio total de venta" : "Precio por pie²"}
                          className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    {/* Cálculo automático */}
                    {tipoItem === "venta" &&
                      modoPrecio === "total" &&
                      itemExtendido.costoPorPie &&
                      itemExtendido.ancho &&
                      itemExtendido.alto &&
                      cantidad && (
                        <Alert className="mt-4 border-green-200 bg-green-50">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <AlertDescription className="text-green-800">
                            <strong>Precio por pie² calculado:</strong>{" "}
                            {formatearPrecioDOP(
                              itemExtendido.costoPorPie /
                                convertirAPiesCuadrados(
                                  itemExtendido.ancho,
                                  itemExtendido.alto,
                                  itemExtendido.unidadMedida,
                                ),
                            )}
                          </AlertDescription>
                        </Alert>
                      )}
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 rounded-lg transition-all duration-200 hover:shadow-lg"
              >
                <Plus className="mr-2 h-5 w-5" />
                Agregar Ítem
              </Button>
            </form>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}

// Componente de lista mejorado
const ListaItemsMejorada = ({
  items,
  onRemove,
  onEdit,
}: {
  items: Item[]
  onRemove: (id: string) => void
  onEdit: (item: Item) => void
}) => {
  const [vistaCompacta, setVistaCompacta] = useState(false)

  const calcularCostoItem = (item: Item): number => {
    if (item.mostrarExtendido && item.extendido) {
      const { ancho, alto, unidadMedida } = item.extendido
      if (ancho !== null && alto !== null && item.precioUnitario.valor !== null) {
        const areaPiesCuadrados = convertirAPiesCuadrados(ancho, alto, unidadMedida)
        return areaPiesCuadrados * item.precioUnitario.valor * item.cantidad
      }
    }
    return (item.precioUnitario.valor ?? 0) * item.cantidad
  }

  const calcularPrecioItem = (item: Item): number => {
    if (item.tipoItem === "costo") return 0
    if (item.mostrarExtendido && item.extendido && item.areaPiesCuadrados) {
      if (item.modoPrecio === "total" && item.extendido.costoPorPie !== null) {
        return item.extendido.costoPorPie * item.cantidad
      } else if (item.extendido.costoPorPie !== null) {
        return item.extendido.costoPorPie * item.areaPiesCuadrados * item.cantidad
      }
    }
    return (item.precioUnitario.valor ?? 0) * item.cantidad
  }

  if (items.length === 0) {
    return (
      <Card className="border-dashed border-2 border-gray-300">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="p-4 rounded-full bg-gray-100 mb-4">
            <Layers className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay ítems agregados</h3>
          <p className="text-gray-500 text-center max-w-sm">
            Comience agregando ítems a su cotización usando el formulario de arriba.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <Layers className="h-5 w-5" />
              Lista de Ítems ({items.length})
            </CardTitle>
            <CardDescription>Gestione los ítems de su cotización</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setVistaCompacta(!vistaCompacta)}
                    className="h-9 w-9"
                  >
                    {vistaCompacta ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{vistaCompacta ? "Vista expandida" : "Vista compacta"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/50">
                <TableHead className="w-[50px]"></TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Tipo</TableHead>
                {!vistaCompacta && <TableHead>Categoría</TableHead>}
                {!vistaCompacta && <TableHead>Detalles</TableHead>}
                <TableHead>Cant.</TableHead>
                <TableHead>Precio/Costo</TableHead>
                <TableHead>Subtotal</TableHead>
                <TableHead className="w-[100px]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, index) => (
                <TableRow
                  key={item.id}
                  className="hover:bg-gray-50/50 transition-colors cursor-pointer group"
                  onDoubleClick={() => onEdit(item)}
                >
                  <TableCell>
                    <div className="flex items-center justify-center">
                      <GripVertical className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          item.tipoItem === "venta" ? "bg-green-500" : "bg-orange-500"
                        }`}
                      ></div>
                      <div>
                        <div className="font-medium">{item.descripcion}</div>
                        {vistaCompacta && item.categoria && (
                          <div className="text-xs text-gray-500 capitalize">{item.categoria}</div>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <Badge
                      variant={item.tipoItem === "venta" ? "default" : "secondary"}
                      className={
                        item.tipoItem === "venta"
                          ? "bg-green-100 text-green-800 border-green-200"
                          : "bg-orange-100 text-orange-800 border-orange-200"
                      }
                    >
                      {item.tipoItem === "venta" ? "Venta" : "Costo"}
                    </Badge>
                  </TableCell>

                  {!vistaCompacta && (
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {item.categoria || "Sin categoría"}
                      </Badge>
                    </TableCell>
                  )}

                  {!vistaCompacta && (
                    <TableCell>
                      {item.mostrarExtendido && item.extendido ? (
                        <div className="text-sm space-y-1">
                          <div className="flex items-center gap-1">
                            <span className="font-medium">
                              {item.extendido.ancho} × {item.extendido.alto}
                            </span>
                            <span className="text-gray-500">{item.extendido.unidadMedida}</span>
                          </div>
                          <div className="text-gray-600">Área: {item.areaPiesCuadrados?.toFixed(2)} pies²</div>
                          {item.modoPrecio === "total" && item.precioTotal && (
                            <div className="text-blue-600 text-xs">Total: {formatearPrecioDOP(item.precioTotal)}</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">N/A</span>
                      )}
                    </TableCell>
                  )}

                  <TableCell>
                    <span className="font-medium">{item.cantidad}</span>
                  </TableCell>

                  <TableCell>
                    <div className="text-right">
                      <div className="font-medium">{formatearPrecioDOP(item.precioUnitario.valor ?? 0)}</div>
                      {item.tipoItem === "costo" && <div className="text-xs text-orange-600">Costo</div>}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="text-right font-medium">
                      {item.tipoItem === "venta" ? (
                        <span className="text-green-600">{formatearPrecioDOP(calcularPrecioItem(item))}</span>
                      ) : (
                        <span className="text-orange-600">-{formatearPrecioDOP(calcularCostoItem(item))}</span>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-1">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onEdit(item)}
                              className="h-8 w-8 hover:bg-blue-100 hover:text-blue-600"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Editar ítem</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onRemove(item.id)}
                              className="h-8 w-8 hover:bg-red-100 hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Eliminar ítem</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

// Componente de resumen mejorado
const ResumenMejorado = ({
  items,
  margenGanancia,
  porcentajeComision,
  precioFinal,
}: {
  items: Item[]
  margenGanancia: number
  porcentajeComision: number
  precioFinal: PrecioConFormula
}) => {
  const calcularCostoItem = (item: Item): number => {
    if (item.mostrarExtendido && item.extendido) {
      const { ancho, alto, unidadMedida } = item.extendido
      if (ancho !== null && alto !== null && item.precioUnitario.valor !== null) {
        const areaPiesCuadrados = convertirAPiesCuadrados(ancho, alto, unidadMedida)
        return areaPiesCuadrados * item.precioUnitario.valor * item.cantidad
      }
    }
    return (item.precioUnitario.valor ?? 0) * item.cantidad
  }

  const calcularPrecioItem = (item: Item): number => {
    if (item.tipoItem === "costo") return 0
    if (item.mostrarExtendido && item.extendido && item.areaPiesCuadrados) {
      if (item.modoPrecio === "total" && item.extendido.costoPorPie !== null) {
        return item.extendido.costoPorPie * item.cantidad
      } else if (item.extendido.costoPorPie !== null) {
        return item.extendido.costoPorPie * item.areaPiesCuadrados * item.cantidad
      }
    }
    return (item.precioUnitario.valor ?? 0) * item.cantidad
  }

  const itemsVenta = items.filter((item) => item.tipoItem === "venta")
  const itemsCosto = items.filter((item) => item.tipoItem === "costo")

  const costoTotalVenta = itemsVenta.reduce((total, item) => total + calcularCostoItem(item), 0)
  const costoTotalCostos = itemsCosto.reduce((total, item) => total + calcularCostoItem(item), 0)
  const costoTotal = costoTotalVenta + costoTotalCostos

  const precioVentaTotal = itemsVenta.reduce((total, item) => total + calcularPrecioItem(item), 0)
  const comision = ((precioFinal.valor ?? precioVentaTotal) * porcentajeComision) / 100

  const margenGananciaFinal =
    (precioFinal.valor ?? 0) > 0 ? (((precioFinal.valor ?? 0) - costoTotal) / (precioFinal.valor ?? 0)) * 100 : 0

  const gananciaPostComision = (precioFinal.valor ?? 0) - costoTotal - comision

  return (
    <div className="space-y-6">
      {/* Gráfico de distribución */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-blue-50/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5 text-blue-600" />
            Distribución de Costos y Ganancias
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Costos */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  Costos
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-2 bg-red-50 rounded">
                    <span className="text-sm text-red-700">Costo de Venta</span>
                    <span className="font-medium text-red-800">{formatearPrecioDOP(costoTotalVenta)}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-orange-50 rounded">
                    <span className="text-sm text-orange-700">Costos Adicionales</span>
                    <span className="font-medium text-orange-800">{formatearPrecioDOP(costoTotalCostos)}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-yellow-50 rounded">
                    <span className="text-sm text-yellow-700">Comisión ({porcentajeComision}%)</span>
                    <span className="font-medium text-yellow-800">{formatearPrecioDOP(comision)}</span>
                  </div>
                </div>
              </div>

              {/* Ingresos */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  Ingresos
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                    <span className="text-sm text-green-700">Precio de Venta</span>
                    <span className="font-medium text-green-800">{formatearPrecioDOP(precioVentaTotal)}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                    <span className="text-sm text-blue-700">Precio Final</span>
                    <span className="font-medium text-blue-800">{formatearPrecioDOP(precioFinal.valor ?? 0)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gradient-to-r from-green-100 to-blue-100 rounded-lg border">
                    <span className="font-medium text-gray-900">Ganancia Final</span>
                    <span className="font-bold text-lg text-green-700">{formatearPrecioDOP(gananciaPostComision)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Barra de progreso del margen */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Margen de Ganancia</span>
                <Badge
                  variant={
                    margenGananciaFinal > 30 ? "default" : margenGananciaFinal > 15 ? "secondary" : "destructive"
                  }
                  className={
                    margenGananciaFinal > 30
                      ? "bg-green-100 text-green-800 border-green-200"
                      : margenGananciaFinal > 15
                        ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                        : "bg-red-100 text-red-800 border-red-200"
                  }
                >
                  {margenGananciaFinal.toFixed(1)}%
                </Badge>
              </div>
              <Progress value={Math.min(margenGananciaFinal, 100)} className="h-3" />
              <div className="flex justify-between text-xs text-gray-500">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alertas y recomendaciones */}
      {itemsCosto.length > 0 && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <div className="space-y-1">
              <div className="font-medium">Costos Adicionales Detectados</div>
              <div className="text-sm">
                Hay {itemsCosto.length} ítem(s) de costo que reducen la ganancia en{" "}
                <span className="font-medium">{formatearPrecioDOP(costoTotalCostos)}</span>. Estos costos no generan
                ingresos directos pero son necesarios para el proyecto.
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {margenGananciaFinal < 15 && (
        <Alert className="border-red-200 bg-red-50">
          <XCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <div className="space-y-1">
              <div className="font-medium">Margen de Ganancia Bajo</div>
              <div className="text-sm">
                El margen actual ({margenGananciaFinal.toFixed(1)}%) está por debajo del recomendado (15%). Considere
                ajustar los precios o reducir los costos.
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {margenGananciaFinal > 50 && (
        <Alert className="border-blue-200 bg-blue-50">
          <Lightbulb className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <div className="space-y-1">
              <div className="font-medium">Excelente Margen de Ganancia</div>
              <div className="text-sm">
                Su margen actual ({margenGananciaFinal.toFixed(1)}%) es excelente. Podría considerar ser más competitivo
                en el precio o mantener esta rentabilidad.
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

// Componente principal mejorado
interface CotizadorCombinadoProps {
  cotizacionInicial?: CotizacionGeneral | null
  onCotizacionActualizada?: (cotizacion: CotizacionGeneral) => void
}

export default function CotizadorCombinadoMejorado({
  cotizacionInicial,
  onCotizacionActualizada,
}: CotizadorCombinadoProps) {
  const [items, setItems] = useState<Item[]>([])
  const [margenGanancia, setMargenGanancia] = useState(40)
  const [precioFinal, setPrecioFinal] = useState<PrecioConFormula>({ valor: null })
  const [porcentajeComision, setPorcentajeComision] = useState(10)
  const [nombreProyecto, setNombreProyecto] = useState("")
  const [nota, setNota] = useState("")
  const [clienteNombre, setClienteNombre] = useState("")
  const [itemEditando, setItemEditando] = useState<Item | null>(null)
  const [activeTab, setActiveTab] = useState("items")

  // Estados para guardado
  const [guardando, setGuardando] = useState(false)
  const [notificacion, setNotificacion] = useState({
    visible: false,
    exito: false,
    mensaje: "",
  })
  const [cotizacionId, setCotizacionId] = useState<string | undefined>(cotizacionInicial?.id)
  const [cambiosSinGuardar, setCambiosSinGuardar] = useState(false)

  const isInitialRender = useRef(true)

  // Funciones de cálculo
  const calcularCostoItem = (item: Item): number => {
    if (item.mostrarExtendido && item.extendido) {
      const { ancho, alto, unidadMedida } = item.extendido
      if (ancho !== null && alto !== null && item.precioUnitario.valor !== null) {
        const areaPiesCuadrados = convertirAPiesCuadrados(ancho, alto, unidadMedida)
        return areaPiesCuadrados * item.precioUnitario.valor * item.cantidad
      }
    }
    return (item.precioUnitario.valor ?? 0) * item.cantidad
  }

  const calcularPrecioItem = (item: Item): number => {
    if (item.tipoItem === "costo") return 0
    if (item.mostrarExtendido && item.extendido && item.areaPiesCuadrados) {
      if (item.modoPrecio === "total" && item.extendido.costoPorPie !== null) {
        return item.extendido.costoPorPie * item.cantidad
      } else if (item.extendido.costoPorPie !== null) {
        return item.extendido.costoPorPie * item.areaPiesCuadrados * item.cantidad
      }
    }
    return (item.precioUnitario.valor ?? 0) * item.cantidad
  }

  const calcularCostoTotal = () => {
    return items.reduce((total, item) => total + calcularCostoItem(item), 0)
  }

  const calcularPrecioVentaTotal = () => {
    return items
      .filter((item) => item.tipoItem === "venta")
      .reduce((total, item) => total + calcularPrecioItem(item), 0)
  }

  // Cargar cotización inicial
  useEffect(() => {
    if (cotizacionInicial && isInitialRender.current) {
      const itemsConvertidos = cotizacionInicial.items.map((item) => ({
        ...item,
        tipoItem: "venta" as const,
        modoPrecio: item.mostrarExtendido ? ("porPie" as const) : undefined,
      }))

      setItems(itemsConvertidos)
      setMargenGanancia(cotizacionInicial.margenGanancia)
      setPorcentajeComision(cotizacionInicial.porcentajeComision)
      setNombreProyecto(cotizacionInicial.nombre)
      setNota(cotizacionInicial.nota || "")
      setClienteNombre(cotizacionInicial.cliente || "")
      setPrecioFinal({
        valor: cotizacionInicial.precioFinal,
        manual: true,
      })
      setCotizacionId(cotizacionInicial.id)
      isInitialRender.current = false
    }
  }, [cotizacionInicial])

  // Detectar cambios sin guardar
  useEffect(() => {
    if (isInitialRender.current) return
    setCambiosSinGuardar(true)
  }, [items, margenGanancia, porcentajeComision, nombreProyecto, nota, clienteNombre, precioFinal.valor])

  // Actualizar precio final automáticamente
  useEffect(() => {
    if (!precioFinal.manual) {
      const precioVentaTotal = calcularPrecioVentaTotal()
      const costoTotalNoImpresion = items
        .filter((item) => !item.esImpresion && item.tipoItem === "venta")
        .reduce((total, item) => total + calcularCostoItem(item), 0)

      const precioItemsNoImpresion = costoTotalNoImpresion / (1 - margenGanancia / 100)
      const precioItemsImpresion = items
        .filter((item) => item.esImpresion && item.tipoItem === "venta")
        .reduce((total, item) => total + calcularPrecioItem(item), 0)

      const precioSugerido = precioItemsNoImpresion + precioItemsImpresion
      setPrecioFinal({ valor: precioSugerido, manual: false })
    }
  }, [margenGanancia, items, precioFinal.manual])

  const guardarEnBaseDeDatos = async () => {
    setGuardando(true)
    try {
      const cotizacion: CotizacionCombinada = {
        id: cotizacionId,
        tipo: "combinado", // Cambiar de "general" a "combinado"
        nombre: nombreProyecto || "Cotización sin nombre",
        cliente: clienteNombre || undefined,
        items,
        margenGanancia,
        porcentajeComision,
        precioFinal: precioFinal.valor || 0,
        nota: nota || undefined,
      }

      const resultado = await guardarCotizacion(cotizacion)

      if (resultado.success) {
        setCotizacionId(resultado.id)
        setNotificacion({
          visible: true,
          exito: true,
          mensaje: "Cotización guardada correctamente",
        })
        setCambiosSinGuardar(false)
      } else {
        setNotificacion({
          visible: true,
          exito: false,
          mensaje: `Error al guardar: ${resultado.error || "Error desconocido"}`,
        })
      }
    } catch (error) {
      console.error("Error al guardar cotización:", error)
      setNotificacion({
        visible: true,
        exito: false,
        mensaje: "Error al guardar la cotización",
      })
    } finally {
      setGuardando(false)
    }
  }

  const duplicarCotizacion = () => {
    const nombreDuplicado = `${nombreProyecto} (Copia)`
    setCotizacionId(undefined)
    setNombreProyecto(nombreDuplicado)
    setCambiosSinGuardar(true)
    setNotificacion({
      visible: true,
      exito: true,
      mensaje: "Cotización duplicada. Guarde para crear una nueva cotización.",
    })
  }

  const limpiarTodo = () => {
    setItems([])
    setMargenGanancia(40)
    setPrecioFinal({ valor: null })
    setPorcentajeComision(10)
    setNombreProyecto("")
    setNota("")
    setClienteNombre("")
    setCambiosSinGuardar(false)
  }

  const handleEditItem = (item: Item) => {
    setItemEditando({ ...item })
  }

  const handleSaveItem = (updatedItem: Item) => {
    let itemToSave = { ...updatedItem }

    // Recalcular área si es un ítem de impresión con dimensiones
    if (itemToSave.esImpresion && itemToSave.extendido) {
      const { ancho, alto, unidadMedida } = itemToSave.extendido
      if (ancho !== null && alto !== null) {
        const areaPiesCuadrados = convertirAPiesCuadrados(ancho, alto, unidadMedida)
        itemToSave = {
          ...itemToSave,
          areaPiesCuadrados,
        }

        // Si está en modo precio total, actualizar el costo por pie
        if (itemToSave.modoPrecio === "total" && itemToSave.extendido.costoPorPie !== null) {
          itemToSave.precioUnitario = {
            valor: itemToSave.extendido.costoPorPie / areaPiesCuadrados,
            manual: true
          }
        }
      }
    }

    setItems(items.map((item) => (item.id === itemToSave.id ? itemToSave : item)))
    setItemEditando(null)
  }

  const handlePrecioChange = (valor: string) => {
    if (valor === "") {
      setPrecioFinal({ valor: null, manual: true })
    } else if (valor.startsWith("=")) {
      setPrecioFinal({ valor: null, formula: valor, manual: true })
    } else {
      const numeroValor = Number.parseFloat(valor)
      setPrecioFinal({ valor: isNaN(numeroValor) ? null : numeroValor, manual: true })
    }
  }

  // Añade estos estados
  const [exportandoPDF, setExportandoPDF] = useState(false)
  const [exportandoJSON, setExportandoJSON] = useState(false)

  // Modifica las funciones de exportación
  const exportarPDF = async () => {
  setExportandoPDF(true)
  try {
    const cotizacionData = {
      nombreProyecto,
      clienteNombre,
      items: items.map(item => ({
        ...item,
        precioUnitario: {
          ...item.precioUnitario,
          valor: Number(item.precioUnitario.valor)
        }
      })),
      margenGanancia,
      porcentajeComision,
      precioFinal: precioFinal.valor || 0,
      costoTotal: calcularCostoTotal(),
      precioVentaTotal: calcularPrecioVentaTotal(),
      nota,
    }

    const response = await fetch('/api/generar-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(cotizacionData),
    })

    if (!response.ok) {
      throw new Error('Error al generar PDF')
    }

    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${nombreProyecto || 'cotizacion'}.pdf`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)

    setNotificacion({
      visible: true,
      exito: true,
      mensaje: 'PDF generado correctamente'
    })
  } catch (error) {
    console.error('Error al exportar PDF:', error)
    setNotificacion({
      visible: true,
      exito: false,
      mensaje: 'Error al generar PDF'
    })
  } finally {
    setExportandoPDF(false)
  }
}

  const exportarJSON = () => {
    setExportandoJSON(true)
    try {
      const cotizacionData = {
        tipo: "combinado",
        nombre: nombreProyecto || "Cotización sin nombre",
        cliente: clienteNombre || undefined,
        items,
        margenGanancia,
        porcentajeComision,
        precioFinal: precioFinal.valor || 0,
        nota: nota || undefined,
      }

      const blob = new Blob([JSON.stringify(cotizacionData, null, 2)], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${nombreProyecto || 'cotizacion'}.json`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } finally {
      setExportandoJSON(false)
    }
  }

  // Actualiza los botones para mostrar el estado de carga
  return (
    <MobileOptimizedContainer className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
      <NotificacionGuardado
        visible={notificacion.visible}
        exito={notificacion.exito}
        mensaje={notificacion.mensaje}
        onClose={() => setNotificacion({ ...notificacion, visible: false })}
      />

      {/* Header mejorado */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-200/50 mb-6">
        <div className="container mx-auto p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button asChild variant="outline" size="sm" className="h-10 px-3">
                <Link href="/" className="flex items-center gap-2">
                  <ChevronRight className="h-4 w-4 rotate-180" />
                  <span>Inicio</span>
                </Link>
              </Button>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Cotizador Combinado
                  </h1>
                  <p className="text-sm text-gray-600">La herramienta más completa para cotizaciones</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {cambiosSinGuardar && (
                <Badge variant="outline" className="text-orange-600 border-orange-300 bg-orange-50">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Cambios sin guardar
                </Badge>
              )}

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={guardarEnBaseDeDatos}
                      disabled={guardando}
                      className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                    >
                      {guardando ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Guardar
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Guardar en Base de Datos</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" onClick={duplicarCotizacion}>
                      <Copy className="h-4 w-4 mr-2" />
                      Duplicar
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Duplicar Cotización</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" onClick={limpiarTodo}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Limpiar
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Limpiar Todo</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-4 space-y-6">
        {/* Estadísticas rápidas */}
        <EstadisticasRapidas items={items} precioFinal={precioFinal.valor || 0} costoTotal={calcularCostoTotal()} />

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <div className="xl:col-span-3">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-3 mb-6 bg-gray-100 p-1 rounded-lg">
                <TabsTrigger
                  value="items"
                  className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  <Layers className="h-4 w-4" />
                  <span className="hidden sm:inline">Ítems</span>
                </TabsTrigger>
                <TabsTrigger
                  value="calculos"
                  className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  <Calculator className="h-4 w-4" />
                  <span className="hidden sm:inline">Cálculos</span>
                </TabsTrigger>
                <TabsTrigger
                  value="proyecto"
                  className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  <FileText className="h-4 w-4" />
                  <span className="hidden sm:inline">Proyecto</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="items" className="space-y-6">
                <ItemFormMejorado onAdd={(item) => setItems([...items, item])} />
                <ListaItemsMejorada
                  items={items}
                  onRemove={(id) => setItems(items.filter((item) => item.id !== id))}
                  onEdit={handleEditItem}
                />
              </TabsContent>

              <TabsContent value="calculos" className="space-y-6">
                <Card className="border-0 shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-lg">
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-blue-600" />
                      Análisis Financiero Detallado
                    </CardTitle>
                    <CardDescription>Resumen completo de costos, precios y márgenes de ganancia</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <ResumenMejorado
                      items={items}
                      margenGanancia={margenGanancia}
                      porcentajeComision={porcentajeComision}
                      precioFinal={precioFinal}
                    />
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 rounded-t-lg">
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5 text-green-600" />
                      Configuración de Precios
                    </CardTitle>
                    <CardDescription>Ajuste los parámetros de cálculo de precios y márgenes</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Label htmlFor="margenGanancia" className="text-sm font-medium">
                              Margen de Ganancia General (%)
                            </Label>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="h-4 w-4 text-gray-400 cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="max-w-xs">
                                    Porcentaje de ganancia aplicado a los ítems no relacionados con impresión
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <Input
                            id="margenGanancia"
                            type="number"
                            value={margenGanancia}
                            onChange={(e) => setMargenGanancia(Number(e.target.value))}
                            min={0}
                            max={100}
                            className="border-gray-200 focus:border-green-500 focus:ring-green-500"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="porcentajeComision" className="text-sm font-medium">
                            Porcentaje de Comisión (%)
                          </Label>
                          <Input
                            id="porcentajeComision"
                            type="number"
                            value={porcentajeComision}
                            onChange={(e) => setPorcentajeComision(Number(e.target.value))}
                            min={0}
                            max={100}
                            className="border-gray-200 focus:border-green-500 focus:ring-green-500"
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="precioFinal" className="text-sm font-medium">
                            Precio Final
                          </Label>
                          <Input
                            id="precioFinal"
                            type="text"
                            value={
                              (precioFinal.valor !== null ? precioFinal.valor.toString() : "") || precioFinal.formula
                            }
                            onChange={(e) => handlePrecioChange(e.target.value)}
                            placeholder="Precio final o =expresión"
                            className="border-gray-200 focus:border-green-500 focus:ring-green-500"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="comision" className="text-sm font-medium">
                            Comisión Calculada
                          </Label>
                          <Input
                            id="comision"
                            value={formatearPrecioDOP(((precioFinal.valor ?? 0) * porcentajeComision) / 100)}
                            readOnly
                            className="bg-gray-50 border-gray-200"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="proyecto" className="space-y-6">
                <Card className="border-0 shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-t-lg">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-purple-600" />
                      Información del Proyecto
                    </CardTitle>
                    <CardDescription>Complete los detalles del proyecto y cliente</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="nombreProyecto" className="text-sm font-medium">
                            Nombre del Proyecto
                          </Label>
                          <Input
                            id="nombreProyecto"
                            value={nombreProyecto}
                            onChange={(e) => setNombreProyecto(e.target.value)}
                            placeholder="Ingrese el nombre del proyecto"
                            className="border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="clienteNombre" className="text-sm font-medium">
                            Cliente
                          </Label>
                          <Input
                            id="clienteNombre"
                            value={clienteNombre}
                            onChange={(e) => setClienteNombre(e.target.value)}
                            placeholder="Nombre del cliente"
                            className="border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="nota" className="text-sm font-medium">
                          Notas del Proyecto
                        </Label>
                        <Textarea
                          id="nota"
                          value={nota}
                          onChange={(e) => setNota(e.target.value)}
                          placeholder="Ingrese notas adicionales para el proyecto"
                          rows={6}
                          className="border-gray-200 focus:border-purple-500 focus:ring-purple-500 resize-none"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-t-lg">
                    <CardTitle className="flex items-center gap-2">
                      <Download className="h-5 w-5 text-indigo-600" />
                      Exportación y Compartir
                    </CardTitle>
                    <CardDescription>Exporte su cotización en diferentes formatos</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {/* Reemplaza los botones existentes con estos: */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Button
                        className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white"
                        onClick={exportarPDF}
                        disabled={exportandoPDF}
                      >
                        {exportandoPDF ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="mr-2 h-4 w-4" />
                        )}
                        {exportandoPDF ? 'Exportando...' : 'Exportar PDF'}
                      </Button>
                      <Button
                        variant="outline"
                        className="border-gray-300 hover:bg-gray-50"
                        onClick={exportarJSON}
                        disabled={exportandoJSON}
                      >
                        {exportandoJSON ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="mr-2 h-4 w-4" />
                        )}
                        {exportandoJSON ? 'Exportando...' : 'Exportar JSON'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar de resumen */}
          <div className="space-y-6">
            <Card className="border-0 shadow-lg sticky top-24">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-lg pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="h-5 w-5 text-gray-600" />
                  Resumen Rápido
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="space-y-1">
                      <span className="text-gray-500">Ítems de Venta</span>
                      <div className="font-semibold text-green-600">
                        {items.filter((item) => item.tipoItem === "venta").length}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-gray-500">Ítems de Costo</span>
                      <div className="font-semibold text-orange-600">
                        {items.filter((item) => item.tipoItem === "costo").length}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Costo Total</span>
                      <span className="font-medium">{formatearPrecioDOP(calcularCostoTotal())}</span>
                                       </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Precio de Venta</span>
                      <span className="font-medium">{formatearPrecioDOP(calcularPrecioVentaTotal())}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Precio Final</span>
                      <span className="font-semibold text-blue-600">{formatearPrecioDOP(precioFinal.valor ?? 0)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="text-sm text-gray-600">Margen de Ganancia</span>
                      <span className="font-medium">
                        {margenGanancia.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  <Button
                    onClick={guardarEnBaseDeDatos}
                    disabled={guardando}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    {guardando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Guardar Cotización
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Dialog de edición (mantenemos el existente) */}
      {itemEditando && (
        <Dialog open={!!itemEditando} onOpenChange={(open) => !open && setItemEditando(null)}>
          <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Ítem</DialogTitle>
            </DialogHeader>
              {/* Aquí iría el contenido del diálogo de edición */}
              <div className="space-y-6">
                {/* Descripción */}
                <div className="space-y-2">
                  <Label htmlFor="descripcion" className="text-sm font-medium">
                    Descripción del Ítem
                  </Label>
                  <Input
                    id="descripcion"
                    value={itemEditando.descripcion}
                    onChange={(e) => setItemEditando((prev) => ({ ...prev, descripcion: e.target.value }))}
                    placeholder="Ej: Banner publicitario, Letrero acrílico..."
                    className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Cantidad */}
                <div className="space-y-2">
                  <Label htmlFor="cantidad" className="text-sm font-medium">
                    Cantidad
                  </Label>
                  <Input
                    id="cantidad"
                    type="number"
                    value={itemEditando.cantidad}
                    onChange={(e) => setItemEditando((prev) => ({ ...prev, cantidad: Number(e.target.value) }))}
                    min={1}
                    placeholder="1"
                    className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Precio Unitario */}
                <div className="space-y-2">
                  <Label htmlFor="precioUnitario" className="text-sm font-medium">
                    Precio Unitario
                  </Label>
                  <Input
                    id="precioUnitario"
                    value={itemEditando.precioUnitario.valor || ""}
                    onChange={(e) =>
                      setItemEditando((prev) => ({
                        ...prev,
                        precioUnitario: { ...prev.precioUnitario, valor: Number(e.target.value) }
                      }))
                    }
                    placeholder="Ingrese el precio unitario"
                    className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Categoría */}
                <div className="space-y-2">
                  <Label htmlFor="categoria" className="text-sm font-medium">
                    Categoría
                  </Label>
                  <Select
                    value={itemEditando.categoria}
                    onValueChange={(value) => setItemEditando((prev) => ({ ...prev, categoria: value }))}
                  >
                    <SelectTrigger id="categoria" className="border-gray-200 focus:border-blue-500 focus:ring-blue-500">
                      <SelectValue placeholder="Seleccione una categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="impresion">Impresión</SelectItem>
                      <SelectItem value="materiales">Materiales</SelectItem>
                      <SelectItem value="mano_obra">Mano de Obra</SelectItem>
                      <SelectItem value="transporte">Transporte</SelectItem>
                      <SelectItem value="servicios">Servicios</SelectItem>
                      <SelectItem value="otros">Otros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Costo Real */}
                <div className="space-y-2">
                  <Label htmlFor="costoReal" className="text-sm font-medium">
                    Costo Real
                  </Label>
                  <Input
                    id="costoReal"
                    type="number"
                    value={itemEditando.costoReal || ""}
                    onChange={(e) =>
                      setItemEditando((prev) => ({
                        ...prev,
                        costoReal: e.target.value === "" ? null : Number(e.target.value),
                      }))
                    }
                    placeholder="Ingrese el costo real"
                    className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                {/* Mostrar Campos Extendidos Solo para Impresión */}
                {itemEditando.esImpresion && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="ancho" className="text-sm font-medium">
                        Ancho
                      </Label>
                      <Input
                        id="ancho"
                        type="number"
                        value={itemEditando.extendido?.ancho || ""}
                        onChange={(e) =>
                          setItemEditando((prev) => ({
                            ...prev,
                            extendido: { ...prev.extendido, ancho: e.target.value === "" ? null : Number(e.target.value) },
                          }))
                        }
                        placeholder="Ancho en la unidad seleccionada"
                        className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="alto" className="text-sm font-medium">
                        Alto
                      </Label>
                      <Input
                        id="alto"
                        type="number"
                        value={itemEditando.extendido?.alto || ""}
                        onChange={(e) =>
                          setItemEditando((prev) => ({
                            ...prev,
                            extendido: { ...prev.extendido, alto: e.target.value === "" ? null : Number(e.target.value) },
                          }))
                        }
                        placeholder="Alto en la unidad seleccionada"
                        className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="costoPorPie" className="text-sm font-medium">
                        {itemEditando.modoPrecio === "total" ? "Precio Total de Venta" : "Precio por Pie²"}
                      </Label>
                      <Input
                        id="costoPorPie"
                        type="number"
                        value={itemEditando.extendido?.costoPorPie || ""}
                        onChange={(e) =>
                          setItemEditando((prev) => ({
                            ...prev,
                            extendido: { ...prev.extendido, costoPorPie: e.target.value === "" ? null : Number(e.target.value) },
                          }))
                        }
                        placeholder={
                          itemEditando.modoPrecio === "total" ? "Precio total de venta" : "Costo por pie cuadrado"
                        }
                        className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="unidadMedida" className="text-sm font-medium">
                        Unidad de Medida
                      </Label>
                      <Select
                        value={itemEditando.extendido?.unidadMedida || "pies"}
                        onValueChange={(value) =>
                          setItemEditando((prev) => ({
                            ...prev,
                            extendido: { ...prev.extendido, unidadMedida: value },
                          }))
                        }
                      >
                        <SelectTrigger id="unidadMedida" className="border-gray-200 focus:border-blue-500 focus:ring-blue-500">
                          <SelectValue placeholder="Seleccione una unidad" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pies">Pies</SelectItem>
                          <SelectItem value="pulgadas">Pulgadas</SelectItem>
                          <SelectItem value="metros">Metros</SelectItem>
                          <SelectItem value="centimetros">Centímetros</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" onClick={() => setItemEditando(null)}>
                  Cancelar
                </Button>
              </DialogClose>
              <Button onClick={() => handleSaveItem(itemEditando)}>Guardar Cambios</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </MobileOptimizedContainer>
  )
}
