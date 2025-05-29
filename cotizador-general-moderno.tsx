"use client"

import React, { useState, useRef, useEffect } from "react"
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd"
import Link from "next/link"
import {
  Calculator,
  FileText,
  Grid,
  Plus,
  Save,
  Trash2,
  GripVertical,
  Download,
  RefreshCw,
  Upload,
  Edit,
  ChevronDown,
  ChevronRight,
  Layers,
  DollarSign,
  Settings,
  Info,
  ChevronUp,
  BarChart4,
  ArrowUpDown,
  Coins,
  Target,
  AlertTriangle,
  Check,
  X,
  Loader2,
  Copy,
  Zap,
  Lightbulb,
  LayoutTemplateIcon as Template,
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
import {
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Bar,
  Cell,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  PieChart,
  Pie,
} from "recharts"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"

// Modificar el componente CotizadorGeneralModerno para añadir la funcionalidad de guardar en la base de datos

// Al inicio del archivo, después de los imports
import { guardarCotizacion } from "@/services/cotizaciones-service"
import { NotificacionGuardado } from "@/components/notificacion-guardado"
import type { CotizacionGeneral } from "@/types/cotizaciones"

// Importar y usar el contenedor optimizado para móviles
import { MobileOptimizedContainer } from "@/components/mobile-optimized-container"

// Importar la función de exportación
import { exportarCotizacion } from "@/utils/exportar-cotizacion"

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
  costo?: number // Añadido para compatibilidad con el servicio
}

type CotizadorTemplate = {
  nombre: string
  items: Item[]
}

type Escenario = {
  id: string
  nombre: string
  descripcion: string
  items: Item[]
  margenGanancia: number
  porcentajeComision: number
  precioFinal: PrecioConFormula
  fechaCreacion: string
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

// Sub-components
const ItemForm = ({
  onAdd,
}: {
  onAdd: (item: Item) => void
}) => {
  const [descripcion, setDescripcion] = useState("")
  const [cantidad, setCantidad] = useState<number | null>(null)
  const [precioUnitario, setPrecioUnitario] = useState<PrecioConFormula>({ valor: null })
  const [mostrarExtendido, setMostrarExtendido] = useState(false)
  const [categoria, setCategoria] = useState<string>("")
  const [itemExtendido, setItemExtendido] = useState<ItemExtendido>({
    ancho: null,
    alto: null,
    unidadMedida: "pulgadas",
    costoPorPie: null,
  })

  const handleDescripcionChange = (value: string) => {
    setDescripcion(value)
    const esImpresion = value.toLowerCase().includes("impresion")
    setMostrarExtendido(esImpresion)
  }

  const handleCategoriaChange = (value: string) => {
    setCategoria(value)
    if (value === "impresion") {
      setMostrarExtendido(true)
    } else if (mostrarExtendido && !descripcion.toLowerCase().includes("impresion")) {
      setMostrarExtendido(false)
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
    if (descripcion && cantidad !== null && cantidad > 0) {
      const esImpresion = categoria === "impresion" || descripcion.toLowerCase().includes("impresion")
      let newItem: Item = {
        id: Date.now().toString(),
        descripcion,
        cantidad,
        precioUnitario,
        mostrarExtendido: esImpresion,
        esImpresion,
        categoria,
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

      onAdd(newItem)
      setDescripcion("")
      setCantidad(null)
      setPrecioUnitario({ valor: null, formula: undefined })
      setMostrarExtendido(false)
      setCategoria("")
      setItemExtendido({
        ancho: null,
        alto: null,
        unidadMedida: "pulgadas",
        costoPorPie: null,
      })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-1 space-y-2">
          <Label htmlFor="descripcion">Descripción</Label>
          <Input
            id="descripcion"
            value={descripcion}
            onChange={(e) => handleDescripcionChange(e.target.value)}
            placeholder="Escriba una descripción"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="categoria">Categoría</Label>
          <Select value={categoria} onValueChange={handleCategoriaChange}>
            <SelectTrigger id="categoria">
              <SelectValue placeholder="Seleccione categoría" />
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
        <div className="space-y-2">
          <Label htmlFor="cantidad">Cantidad</Label>
          <Input
            id="cantidad"
            type="number"
            value={cantidad === null ? "" : cantidad}
            onChange={(e) => setCantidad(e.target.value === "" ? null : Number(e.target.value))}
            min={1}
            placeholder="Cantidad"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="precioUnitario">Precio Unitario</Label>
          <Input
            id="precioUnitario"
            type="text"
            value={precioUnitario.formula || (precioUnitario.valor !== null ? precioUnitario.valor.toString() : "")}
            onChange={(e) => handlePrecioChange(e.target.value)}
            onBlur={() => calcularYActualizarPrecio(precioUnitario, setPrecioUnitario)}
            placeholder="Precio o =expresión"
            required
          />
        </div>
      </div>

      <Collapsible open={mostrarExtendido} onOpenChange={setMostrarExtendido} className="w-full">
        <CollapsibleTrigger asChild>
          <Button
            variant="outline"
            type="button"
            className="flex items-center justify-between w-full mb-2"
            onClick={() => setMostrarExtendido(!mostrarExtendido)}
          >
            <span className="flex items-center gap-2">
              {mostrarExtendido ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              {mostrarExtendido ? "Ocultar campos extendidos" : "Mostrar campos extendidos"}
            </span>
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="ancho">Ancho</Label>
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
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="alto">Alto</Label>
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
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unidadMedida">Unidad de Medida</Label>
              <Select
                value={itemExtendido.unidadMedida}
                onValueChange={(value) => handleItemExtendidoChange("unidadMedida", value as UnidadMedida)}
              >
                <SelectTrigger id="unidadMedida">
                  <SelectValue placeholder="Seleccione unidad" />
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
              <Label htmlFor="costoPorPie">Costo por pie²</Label>
              <Input
                id="costoPorPie"
                type="number"
                value={itemExtendido.costoPorPie === null ? "" : itemExtendido.costoPorPie}
                onChange={(e) =>
                  handleItemExtendidoChange("costoPorPie", e.target.value === "" ? null : Number(e.target.value))
                }
                min={0}
                step={0.01}
                placeholder="Costo por pie²"
              />
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
      <Button type="submit" className="w-full">
        <Plus className="mr-2 h-4 w-4" /> Agregar Ítem
      </Button>
    </form>
  )
}

const DraggableItemList = <T extends ItemBase>({
  items,
  onRemove,
  onEdit,
  renderItem,
  headers,
}: {
  items: T[]
  onRemove: (id: string) => void
  onEdit?: (item: T) => void
  renderItem: (item: T) => React.ReactNode
  headers: string[]
}) => {
  return (
    <DragDropContext onDragEnd={() => {}}>
      <Droppable droppableId="items" type="ITEM">
        {(provided) => (
          <div className="border rounded-md">
            <Table {...provided.droppableProps} ref={provided.innerRef}>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]"></TableHead>
                  {headers.map((header, index) => (
                    <TableHead key={index}>{header}</TableHead>
                  ))}
                  <TableHead className="w-[80px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={headers.length + 2} className="text-center text-muted-foreground py-6">
                      No hay ítems agregados
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item, index) => (
                    <Draggable key={item.id} draggableId={item.id} index={index}>
                      {(provided) => (
                        <TableRow
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={onEdit ? "cursor-pointer hover:bg-muted/50" : ""}
                          onDoubleClick={() => onEdit && onEdit(item)}
                        >
                          <TableCell>
                            <div {...provided.dragHandleProps} className="flex items-center justify-center">
                              <GripVertical className="h-5 w-5 text-muted-foreground" />
                            </div>
                          </TableCell>
                          {renderItem(item)}
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {onEdit && (
                                <Button variant="ghost" size="icon" onClick={() => onEdit(item)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onRemove(item.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </Draggable>
                  ))
                )}
                {provided.placeholder}
              </TableBody>
            </Table>
          </div>
        )}
      </Droppable>
    </DragDropContext>
  )
}

// Componente de diálogo de edición separado
const EditarItemDialog = React.memo(
  ({
    item,
    isOpen,
    onClose,
    onSave,
  }: {
    item: Item | null
    isOpen: boolean
    onClose: () => void
    onSave: (item: Item) => void
  }) => {
    const [formValues, setFormValues] = useState<{
      descripcion: string
      cantidad: number
      precioUnitario: PrecioConFormula
      mostrarExtendido: boolean
      extendido?: ItemExtendido
      costoReal?: number
      categoria?: string
    }>({
      descripcion: "",
      cantidad: 0,
      precioUnitario: { valor: null },
      mostrarExtendido: false,
      extendido: {
        ancho: null,
        alto: null,
        unidadMedida: "pulgadas",
        costoPorPie: null,
      },
      categoria: "",
    })

    // Inicializar el formulario cuando se abre el diálogo
    useEffect(() => {
      if (item && isOpen) {
        setFormValues({
          descripcion: item.descripcion,
          cantidad: item.cantidad,
          precioUnitario: item.precioUnitario,
          mostrarExtendido: item.mostrarExtendido,
          extendido: item.extendido,
          costoReal: item.costoReal,
          categoria: item.categoria,
        })
      }
    }, [item, isOpen])

    const handleInputChange = (field: keyof typeof formValues, value: any) => {
      setFormValues((prev) => ({
        ...prev,
        [field]: value,
      }))
    }

    const handleCategoriaChange = (value: string) => {
      handleInputChange("categoria", value)
      if (value === "impresion") {
        handleInputChange("mostrarExtendido", true)
      } else if (formValues.mostrarExtendido && !formValues.descripcion.toLowerCase().includes("impresion")) {
        handleInputChange("mostrarExtendido", false)
      }
    }

    const handleExtendidoChange = (field: keyof ItemExtendido, value: any) => {
      setFormValues((prev) => ({
        ...prev,
        extendido: {
          ...prev.extendido!,
          [field]: value,
        },
      }))
    }

    const handlePrecioChange = (valor: string) => {
      if (valor === "") {
        handleInputChange("precioUnitario", { valor: null })
      } else if (valor.startsWith("=")) {
        handleInputChange("precioUnitario", { valor: null, formula: valor })
      } else {
        const numeroValor = Number.parseFloat(valor)
        handleInputChange("precioUnitario", { valor: isNaN(numeroValor) ? null : numeroValor })
      }
    }

    const calcularYActualizarPrecio = (precio: PrecioConFormula) => {
      if (precio.formula) {
        const resultado = calcularExpresion(precio.formula.slice(1))
        handleInputChange("precioUnitario", { valor: resultado, formula: undefined })
      }
    }

    const handleGuardarCambios = () => {
      if (!item) return

      let updatedItem: Item = {
        ...item,
        descripcion: formValues.descripcion,
        cantidad: formValues.cantidad,
        precioUnitario: formValues.precioUnitario,
        mostrarExtendido: formValues.mostrarExtendido,
        costoReal: formValues.costoReal,
        categoria: formValues.categoria,
      }

      if (formValues.mostrarExtendido && formValues.extendido) {
        const { ancho, alto, unidadMedida, costoPorPie } = formValues.extendido
        if (ancho !== null && alto !== null && costoPorPie !== null) {
          const areaPiesCuadrados = convertirAPiesCuadrados(ancho, alto, unidadMedida)
          updatedItem = {
            ...updatedItem,
            extendido: formValues.extendido,
            areaPiesCuadrados,
          }
        }
      }

      onSave(updatedItem)
    }

    if (!item) return null

    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Ítem</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-descripcion">Descripción</Label>
              <Input
                id="edit-descripcion"
                value={formValues.descripcion}
                onChange={(e) => handleInputChange("descripcion", e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-categoria">Categoría</Label>
              <Select value={formValues.categoria} onValueChange={handleCategoriaChange}>
                <SelectTrigger id="edit-categoria">
                  <SelectValue placeholder="Seleccione categoría" />
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
            <div className="space-y-2">
              <Label htmlFor="edit-cantidad">Cantidad</Label>
              <Input
                id="edit-cantidad"
                type="number"
                value={formValues.cantidad}
                onChange={(e) => handleInputChange("cantidad", Number(e.target.value))}
                min={1}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-precio">Precio Unitario</Label>
              <Input
                id="edit-precio"
                type="text"
                value={
                  formValues.precioUnitario.formula ||
                  (formValues.precioUnitario.valor !== null ? formValues.precioUnitario.valor.toString() : "")
                }
                onChange={(e) => handlePrecioChange(e.target.value)}
                onBlur={() => calcularYActualizarPrecio(formValues.precioUnitario)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-costoReal">Costo Real</Label>
              <Input
                id="edit-costoReal"
                type="number"
                value={formValues.costoReal === undefined ? "" : formValues.costoReal}
                onChange={(e) =>
                  handleInputChange("costoReal", e.target.value === "" ? undefined : Number(e.target.value))
                }
                min={0}
                step={0.01}
                placeholder="Costo real"
              />
            </div>

            {formValues.mostrarExtendido && (
              <>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-ancho">Ancho</Label>
                    <Input
                      id="edit-ancho"
                      type="number"
                      value={formValues.extendido?.ancho === null ? "" : formValues.extendido?.ancho}
                      onChange={(e) =>
                        handleExtendidoChange("ancho", e.target.value === "" ? null : Number(e.target.value))
                      }
                      min={0}
                      step={0.01}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-alto">Alto</Label>
                    <Input
                      id="edit-alto"
                      type="number"
                      value={formValues.extendido?.alto === null ? "" : formValues.extendido?.alto}
                      onChange={(e) =>
                        handleExtendidoChange("alto", e.target.value === "" ? null : Number(e.target.value))
                      }
                      min={0}
                      step={0.01}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-unidad">Unidad de Medida</Label>
                  <Select
                    value={formValues.extendido?.unidadMedida}
                    onValueChange={(value) => handleExtendidoChange("unidadMedida", value as UnidadMedida)}
                  >
                    <SelectTrigger id="edit-unidad">
                      <SelectValue placeholder="Unidad de Medida" />
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
                  <Label htmlFor="edit-costoPorPie">Costo por pie²</Label>
                  <Input
                    id="edit-costoPorPie"
                    type="number"
                    value={formValues.extendido?.costoPorPie === null ? "" : formValues.extendido?.costoPorPie}
                    onChange={(e) =>
                      handleExtendidoChange("costoPorPie", e.target.value === "" ? null : Number(e.target.value))
                    }
                    min={0}
                    step={0.01}
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
            </DialogClose>
            <Button onClick={handleGuardarCambios}>Guardar Cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  },
)

// Componente de resumen
const ResumenCotizacion = ({
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
      const { ancho, alto, unidadMedida, costoPorPie } = item.extendido
      if (ancho !== null && alto !== null && costoPorPie !== null) {
        const areaPiesCuadrados = convertirAPiesCuadrados(ancho, alto, unidadMedida)
        return areaPiesCuadrados * costoPorPie * item.cantidad
      }
    }
    // Para ítems no extendidos, asumimos que el precio unitario es el costo
    return (item.precioUnitario.valor ?? 0) * item.cantidad
  }

  const calcularPrecioItem = (item: Item): number => {
    if (item.mostrarExtendido && item.extendido && item.areaPiesCuadrados) {
      return (item.precioUnitario.valor ?? 0) * item.areaPiesCuadrados * item.cantidad
    }
    return (item.precioUnitario.valor ?? 0) * item.cantidad
  }

  const costoTotal = items.reduce((total, item) => total + calcularCostoItem(item), 0)
  const precioVentaTotal = items.reduce((total, item) => total + calcularPrecioItem(item), 0)
  const comision = ((precioFinal.valor ?? precioVentaTotal) * porcentajeComision) / 100

  const margenGananciaPromedio = precioVentaTotal > 0 ? ((precioVentaTotal - costoTotal) / precioVentaTotal) * 100 : 0

  const margenGananciaFinal =
    (precioFinal.valor ?? 0) > 0 ? (((precioFinal.valor ?? 0) - costoTotal) / (precioFinal.valor ?? 0)) * 100 : 0

  const gananciaPostComision = (precioFinal.valor ?? 0) - costoTotal - comision

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <Calculator className="mr-2 h-5 w-5" />
            Costos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground flex items-center gap-1">
                Costo Total
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">Suma de todos los costos de los ítems</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </span>
              <span className="font-medium">{formatearPrecioDOP(costoTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Precio de Venta Calculado:</span>
              <span className="font-medium">{formatearPrecioDOP(precioVentaTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Precio Final:</span>
              <span className="font-medium">{formatearPrecioDOP(precioFinal.valor ?? 0)}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="font-medium">Ganancia Bruta:</span>
              <span className="font-bold">{formatearPrecioDOP((precioFinal.valor ?? 0) - costoTotal)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <DollarSign className="mr-2 h-5 w-5" />
            Ventas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Ítems de Impresión</h4>
              <div className="space-y-1 pl-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Precio de Venta ({(() => {
                      const costoImpresion = items
                        .filter((item) => item.esImpresion)
                        .reduce((total, item) => total + calcularCostoItem(item), 0)
                      const precioVentaImpresion = items
                        .filter((item) => item.esImpresion)
                        .reduce((total, item) => total + calcularPrecioItem(item), 0)
                      const margenImpresion =
                        precioVentaImpresion > 0
                          ? ((precioVentaImpresion - costoImpresion) / precioVentaImpresion) * 100
                          : 0
                      return margenImpresion.toFixed(1) + "%"
                    })()}):
                  </span>
                  <span className="font-medium">
                    {formatearPrecioDOP(
                      items
                        .filter((item) => item.esImpresion)
                        .reduce((total, item) => total + calcularPrecioItem(item), 0),
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Costo:</span>
                  <span className="font-medium">
                    {formatearPrecioDOP(
                      items
                        .filter((item) => item.esImpresion)
                        .reduce((total, item) => total + calcularCostoItem(item), 0),
                    )}
                  </span>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="text-sm font-medium mb-2">Ítems Generales</h4>
              <div className="space-y-1 pl-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Costo:</span>
                  <span className="font-medium">
                    {formatearPrecioDOP(
                      items
                        .filter((item) => !item.esImpresion)
                        .reduce((total, item) => total + calcularCostoItem(item), 0),
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Margen General ({margenGanancia}%):</span>
                  <span className="font-medium">
                    {formatearPrecioDOP(
                      (items
                        .filter((item) => !item.esImpresion)
                        .reduce((total, item) => total + calcularCostoItem(item), 0) *
                        margenGanancia) /
                        (100 - margenGanancia),
                    )}
                  </span>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Comisión ({porcentajeComision}%):</span>
                <span className="font-medium">{formatearPrecioDOP(comision)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Ganancia Final:</span>
                <span className="font-bold">{formatearPrecioDOP(gananciaPostComision)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <Info className="mr-2 h-5 w-5" />
            Márgenes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Margen Calculado</span>
              <div className="flex items-center justify-between">
                <span className="font-medium">{margenGananciaPromedio.toFixed(2)}%</span>
                <Badge
                  variant={
                    margenGananciaPromedio > 30 ? "success" : margenGananciaPromedio > 15 ? "warning" : "destructive"
                  }
                >
                  {margenGananciaPromedio > 30 ? "Bueno" : margenGananciaPromedio > 15 ? "Regular" : "Bajo"}
                </Badge>
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Margen Final</span>
              <div className="flex items-center justify-between">
                <span className="font-medium">{margenGananciaFinal.toFixed(2)}%</span>
                <Badge
                  variant={margenGananciaFinal > 30 ? "success" : margenGananciaFinal > 15 ? "warning" : "destructive"}
                >
                  {margenGananciaFinal > 30 ? "Bueno" : margenGananciaFinal > 15 ? "Regular" : "Bajo"}
                </Badge>
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Ganancia Post-Comisión</span>
              <div className="flex items-center justify-between">
                <span className="font-bold">{formatearPrecioDOP(gananciaPostComision)}</span>
                <Badge variant={gananciaPostComision > 0 ? "success" : "destructive"}>
                  {gananciaPostComision > 0 ? "Rentable" : "Pérdida"}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Componente para visualizar escenarios
const VisualizadorEscenarios = ({
  escenarios,
  onAplicarEscenario,
  onEliminarEscenario,
}: {
  escenarios: Escenario[]
  onAplicarEscenario: (escenario: Escenario) => void
  onEliminarEscenario: (id: string) => void
}) => {
  const [escenariosSeleccionados, setEscenariosSeleccionados] = useState<string[]>([])
  const [tipoGrafico, setTipoGrafico] = useState<"barras" | "lineas" | "pastel">("barras")

  // Calcular métricas para cada escenario
  const calcularMetricas = (escenario: Escenario) => {
    const costoTotal = escenario.items.reduce((total, item) => {
      if (item.costoReal !== undefined) {
        return total + item.costoReal
      }
      if (item.mostrarExtendido && item.extendido) {
        const { ancho, alto, unidadMedida, costoPorPie } = item.extendido
        if (ancho !== null && alto !== null && costoPorPie !== null) {
          const areaPiesCuadrados = convertirAPiesCuadrados(ancho, alto, unidadMedida)
          return total + areaPiesCuadrados * costoPorPie * item.cantidad
        }
      }
      return total + (item.precioUnitario.valor ?? 0) * item.cantidad
    }, 0)

    const comision = ((escenario.precioFinal.valor ?? 0) * escenario.porcentajeComision) / 100
    const ganancia = (escenario.precioFinal.valor ?? 0) - costoTotal - comision
    const margen =
      (escenario.precioFinal.valor ?? 0) > 0
        ? (((escenario.precioFinal.valor ?? 0) - costoTotal) / (escenario.precioFinal.valor ?? 0)) * 100
        : 0

    return {
      costoTotal,
      precioFinal: escenario.precioFinal.valor ?? 0,
      comision,
      ganancia,
      margen,
    }
  }

  // Preparar datos para gráficos
  const datosGraficos = escenarios
    .filter((escenario) => escenariosSeleccionados.includes(escenario.id))
    .map((escenario) => {
      const metricas = calcularMetricas(escenario)
      return {
        nombre: escenario.nombre,
        costoTotal: metricas.costoTotal,
        precioFinal: metricas.precioFinal,
        comision: metricas.comision,
        ganancia: metricas.ganancia,
        margen: metricas.margen,
      }
    })

  // Datos para gráfico de pastel
  const datosPastel =
    escenariosSeleccionados.length === 1 && escenariosSeleccionados[0]
      ? (() => {
          const escenario = escenarios.find((e) => e.id === escenariosSeleccionados[0])
          if (!escenario) return []

          const metricas = calcularMetricas(escenario)
          return [
            { name: "Costo", value: metricas.costoTotal, fill: "#3b82f6" },
            { name: "Comisión", value: metricas.comision, fill: "#ef4444" },
            { name: "Ganancia", value: metricas.ganancia, fill: "#22c55e" },
          ]
        })()
      : []

  // Colores para los gráficos
  const colores = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#6366f1"]

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between">
        <div className="space-y-2">
          <Label>Seleccione escenarios para comparar</Label>
          <div className="flex flex-wrap gap-2">
            {escenarios.map((escenario) => (
              <Button
                key={escenario.id}
                variant={escenariosSeleccionados.includes(escenario.id) ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  if (escenariosSeleccionados.includes(escenario.id)) {
                    setEscenariosSeleccionados(escenariosSeleccionados.filter((id) => id !== escenario.id))
                  } else {
                    setEscenariosSeleccionados([...escenariosSeleccionados, escenario.id])
                  }
                }}
              >
                {escenario.nombre}
              </Button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <Label>Tipo de gráfico</Label>
          <div className="flex gap-2">
            <Button
              variant={tipoGrafico === "barras" ? "default" : "outline"}
              size="sm"
              onClick={() => setTipoGrafico("barras")}
            >
              <BarChart4 className="h-4 w-4 mr-1" /> Barras
            </Button>
            <Button
              variant={tipoGrafico === "lineas" ? "default" : "outline"}
              size="sm"
              onClick={() => setTipoGrafico("lineas")}
            >
              <ArrowUpDown className="h-4 w-4 mr-1" /> Líneas
            </Button>
            <Button
              variant={tipoGrafico === "pastel" ? "default" : "outline"}
              size="sm"
              onClick={() => setTipoGrafico("pastel")}
              disabled={escenariosSeleccionados.length !== 1}
            >
              <DollarSign className="h-4 w-4 mr-1" /> Pastel
            </Button>
          </div>
        </div>
      </div>

      {escenariosSeleccionados.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>Seleccione al menos un escenario para visualizar</p>
        </div>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Comparación de Escenarios</CardTitle>
              <CardDescription>
                {escenariosSeleccionados.length === 1
                  ? "Visualización detallada del escenario seleccionado"
                  : `Comparando ${escenariosSeleccionados.length} escenarios`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {tipoGrafico === "barras" && (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={datosGraficos}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="nombre" />
                      <YAxis tickFormatter={(value) => `${formatearPrecioDOP(value)}`} />
                      <RechartsTooltip formatter={(value: number) => formatearPrecioDOP(value)} />
                      <Legend />
                      <Bar dataKey="costoTotal" name="Costo Total" fill="#3b82f6" />
                      <Bar dataKey="precioFinal" name="Precio Final" fill="#8b5cf6" />
                      <Bar dataKey="ganancia" name="Ganancia" fill="#22c55e" />
                    </BarChart>
                  </ResponsiveContainer>
                )}

                {tipoGrafico === "lineas" && (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={datosGraficos}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="nombre" />
                      <YAxis tickFormatter={(value) => `${formatearPrecioDOP(value)}`} />
                      <RechartsTooltip formatter={(value: number) => formatearPrecioDOP(value)} />
                      <Legend />
                      <Line type="monotone" dataKey="costoTotal" name="Costo Total" stroke="#3b82f6" strokeWidth={2} />
                      <Line
                        type="monotone"
                        dataKey="precioFinal"
                        name="Precio Final"
                        stroke="#8b5cf6"
                        strokeWidth={2}
                      />
                      <Line type="monotone" dataKey="ganancia" name="Ganancia" stroke="#22c55e" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                )}

                {tipoGrafico === "pastel" && escenariosSeleccionados.length === 1 && (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={datosPastel}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {datosPastel.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <RechartsTooltip formatter={(value: number) => formatearPrecioDOP(value)} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tabla Comparativa</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Escenario</TableHead>
                      <TableHead>Costo Total</TableHead>
                      <TableHead>Precio Final</TableHead>
                      <TableHead>Margen</TableHead>
                      <TableHead>Comisión</TableHead>
                      <TableHead>Ganancia</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {escenarios
                      .filter((escenario) => escenariosSeleccionados.includes(escenario.id))
                      .map((escenario) => {
                        const metricas = calcularMetricas(escenario)
                        return (
                          <TableRow key={escenario.id}>
                            <TableCell className="font-medium">{escenario.nombre}</TableCell>
                            <TableCell>{formatearPrecioDOP(metricas.costoTotal)}</TableCell>
                            <TableCell>{formatearPrecioDOP(metricas.precioFinal)}</TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  metricas.margen > 30 ? "success" : metricas.margen > 15 ? "warning" : "destructive"
                                }
                              >
                                {metricas.margen.toFixed(2)}%
                              </Badge>
                            </TableCell>
                            <TableCell>{formatearPrecioDOP(metricas.comision)}</TableCell>
                            <TableCell>{formatearPrecioDOP(metricas.ganancia)}</TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => onAplicarEscenario(escenario)}>
                                  <Check className="h-4 w-4 mr-1" /> Aplicar
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-destructive"
                                  onClick={() => {
                                    onEliminarEscenario(escenario.id)
                                    setEscenariosSeleccionados(
                                      escenariosSeleccionados.filter((id) => id !== escenario.id),
                                    )
                                  }}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

// Añadir estas props al componente
interface CotizadorGeneralModernoProps {
  cotizacionInicial?: CotizacionGeneral | null
  onCotizacionActualizada?: (cotizacion: CotizacionGeneral) => void
}

// Main component
export default function CotizadorGeneralModerno({
  cotizacionInicial,
  onCotizacionActualizada,
}: CotizadorGeneralModernoProps) {
  // Todos los estados se mantienen igual...
  const [items, setItems] = useState<Item[]>([])
  const [margenGanancia, setMargenGanancia] = useState(40) // 40% por defecto
  const [precioFinal, setPrecioFinal] = useState<PrecioConFormula>({ valor: null })
  const [porcentajeComision, setPorcentajeComision] = useState(10) // 10% por defecto
  const [nombreProyecto, setNombreProyecto] = useState("")
  const [nota, setNota] = useState("")
  const [templates, setTemplates] = useState<CotizadorTemplate[]>([])
  const [templateNombre, setTemplateNombre] = useState("")
  const [formatoExportacion, setFormatoExportacion] = useState<"pdf" | "json">("json")
  const [itemEditando, setItemEditando] = useState<Item | null>(null)
  const [activeTab, setActiveTab] = useState("items")
  const [showRealCostSummary, setShowRealCostSummary] = useState(false)
  const [historialCotizaciones, setHistorialCotizaciones] = useState<any[]>([])
  const [clienteNombre, setClienteNombre] = useState("")
  const [margenObjetivo, setMargenObjetivo] = useState(40)
  const [filtroTemplates, setFiltroTemplates] = useState("")
  const [mostrarAnalisisAvanzado, setMostrarAnalisisAvanzado] = useState(false)
  const [escenarios, setEscenarios] = useState<Escenario[]>([])
  const [nombreEscenario, setNombreEscenario] = useState("")
  const [descripcionEscenario, setDescripcionEscripcionEscenario] = useState("")
  const [escenarioSeleccionado, setEscenarioSeleccionado] = useState<string | null>(null)
  const [mostrarComparacion, setMostrarComparacion] = useState(false)
  const [showAnalisisDetallado, setShowAnalisisDetallado] = useState(false)
  const [dialogoComparacionAbierto, setDialogoComparacionAbierto] = useState(false)
  const [escenariosAComparar, setEscenariosAComparar] = useState<string[]>([])

  // Primero, agregar un nuevo estado para el margen final después de la declaración de otros estados (cerca de la línea donde se declara margenObjetivo):
  const [margenFinal, setMargenFinal] = useState<number>(40) // 40% por defecto

  // Añadir un nuevo estado para rastrear cambios sin guardar
  // Añadir after the declaration of other states, near the line 1950
  const [cambiosSinGuardar, setCambiosSinGuardar] = useState(false)

  // Añadir these states to handle the guardado
  const [guardando, setGuardando] = useState(false)
  const [notificacion, setNotificacion] = useState({
    visible: false,
    exito: false,
    mensaje: "",
  })
  const [cotizacionId, setCotizacionId] = useState<string | undefined>(cotizacionInicial?.id)
  // Bandera para controlar si debemos actualizar el componente padre
  const [cotizacionCargada, setCotizacionCargada] = useState(false)

  const importFileRef = useRef<HTMLInputElement>(null)

  // Añadimos un ref para controlar las actualizaciones
  const isInitialRender = useRef(true)
  const prevPrecioFinalRef = useRef<number | null>(null)
  const notificacionTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const calcularCostoItem = (item: Item, usarCostoReal = false): number => {
    if (usarCostoReal && item.costoReal !== undefined) {
      return item.costoReal
    }

    if (item.mostrarExtendido && item.extendido) {
      const { ancho, alto, unidadMedida, costoPorPie } = item.extendido
      if (ancho !== null && alto !== null && costoPorPie !== null) {
        const areaPiesCuadrados = convertirAPiesCuadrados(ancho, alto, unidadMedida)
        return areaPiesCuadrados * costoPorPie * item.cantidad
      }
    }
    // Para ítems no extendidos, asumimos que el precio unitario es el costo
    return (item.precioUnitario.valor ?? 0) * item.cantidad
  }

  const calcularPrecioItem = (item: Item): number => {
    if (item.mostrarExtendido && item.extendido && item.areaPiesCuadrados) {
      return (item.precioUnitario.valor ?? 0) * item.areaPiesCuadrados * item.cantidad
    }
    return (item.precioUnitario.valor ?? 0) * item.cantidad
  }

  const calcularCostoTotal = () => {
    return items.reduce((total, item) => total + calcularCostoItem(item, false), 0)
  }

  const calcularCostoTotalNoImpresion = () => {
    return items.filter((item) => !item.esImpresion).reduce((total, item) => total + calcularCostoItem(item, false), 0)
  }

  const calcularPrecioVentaImpresion = () => {
    return items.filter((item) => item.esImpresion).reduce((total, item) => total + calcularPrecioItem(item), 0)
  }

  const calcularPrecioVentaSugerido = (costoTotalNoImpresion: number) => {
    const precioItemsNoImpresion = costoTotalNoImpresion / (1 - margenGanancia / 100)
    const precioItemsImpresion = calcularPrecioVentaImpresion()
    return precioItemsNoImpresion + precioItemsImpresion
  }

  const calcularMargenGanancia = (precioVenta: number, costoTotal: number) => {
    return precioVenta > 0 ? ((precioVenta - costoTotal) / precioVenta) * 100 : 0
  }

  const calcularComision = (precioVenta: number) => {
    return (precioVenta * porcentajeComision) / 100
  }

  const calcularGananciaPostComision = (precioVenta: number, costoTotal: number, comision: number) => {
    return precioVenta - costoTotal - comision
  }

  const calcularCostoTotalReal = () => {
    return items.reduce((total, item) => total + calcularCostoItem(item, true), 0)
  }

  const calcularDiferenciaPresupuesto = () => {
    const costoEstimado = calcularCostoTotal()
    const costoReal = calcularCostoTotalReal()
    return costoReal - costoEstimado
  }

  const calcularGananciaReal = () => {
    const costoReal = calcularCostoTotalReal()
    const precioVentaReal = precioFinal.valor ?? 0
    return precioVentaReal - costoReal
  }

  const calcularMargenGananciaReal = () => {
    const gananciaReal = calcularGananciaReal()
    const precioVentaReal = precioFinal.valor ?? 0
    return precioVentaReal > 0 ? (gananciaReal / precioVentaReal) * 100 : 0
  }

  // Cargar la cotización inicial si existe
  useEffect(() => {
    if (cotizacionInicial && isInitialRender.current) {
      console.log("Cargando cotización inicial en CotizadorGeneralModerno:", cotizacionInicial)
      console.log("Precio final en cotización inicial:", cotizacionInicial.precioFinal)

      // Establecer todos los estados necesarios
      setItems(cotizacionInicial.items)
      setMargenGanancia(cotizacionInicial.margenGanancia)
      setPorcentajeComision(cotizacionInicial.porcentajeComision)
      setNombreProyecto(cotizacionInicial.nombre)
      setNota(cotizacionInicial.nota || "")

      if (cotizacionInicial.cliente) {
        setClienteNombre(cotizacionInicial.cliente)
      }

      // IMPORTANTE: Establecer el precio final CON la propiedad manual=true
      // para evitar que se recalcule automáticamente
      setPrecioFinal({
        valor: cotizacionInicial.precioFinal,
        manual: true,
      })

      // Guardar el valor inicial para comparaciones
      prevPrecioFinalRef.current = cotizacionInicial.precioFinal

      setCotizacionId(cotizacionInicial.id)

      // También actualizamos el margen objetivo para que coincida con el margen real
      if (cotizacionInicial.precioFinal > 0) {
        const costoTotal = cotizacionInicial.items.reduce((total, item) => {
          // Calcular el costo del ítem
          if (item.costoReal !== undefined) {
            return total + item.costoReal
          }
          if (item.mostrarExtendido && item.extendido) {
            const { ancho, alto, unidadMedida, costoPorPie } = item.extendido
            if (ancho !== null && alto !== null && costoPorPie !== null) {
              const areaPiesCuadrados = convertirAPiesCuadrados(ancho, alto, unidadMedida)
              return total + areaPiesCuadrados * costoPorPie * item.cantidad
            }
          }
          return total + (item.precioUnitario.valor ?? 0) * item.cantidad
        }, 0)

        const margenActual = ((cotizacionInicial.precioFinal - costoTotal) / cotizacionInicial.precioFinal) * 100
        setMargenObjetivo(Math.round(margenActual))
        setMargenFinal(Math.round(margenActual)) // Inicializar también el margen final
      }

      // Marcar que ya no es el renderizado inicial
      isInitialRender.current = false
    }
  }, [cotizacionInicial])

  // Modificar el efecto que actualiza el precio final para respetar completamente el flag manual:
  useEffect(() => {
    // Calcular el precio basado en el margen actual
    const costoTotalNoImpresion = calcularCostoTotalNoImpresion()
    const precioVentaSugerido = calcularPrecioVentaSugerido(costoTotalNoImpresion)

    // Si es la primera renderización o si el precio no ha sido modificado manualmente
    if (isInitialRender.current || !precioFinal.manual) {
      // Solo actualizar si el precio ha cambiado significativamente
      if (Math.abs((precioVentaSugerido || 0) - (prevPrecioFinalRef.current || 0)) > 0.01) {
        console.log("Actualizando precio basado en margen:", precioVentaSugerido)
        setPrecioFinal({ valor: precioVentaSugerido, manual: isInitialRender.current ? false : precioFinal.manual })
        prevPrecioFinalRef.current = precioVentaSugerido
      }
    }
  }, [margenGanancia, items, precioFinal.manual]) // Añadir precioFinal.manual como dependencia

  // Agregar una función para manejar cambios en el margen final:
  const handleMargenFinalChange = (nuevoMargen: number) => {
    setMargenFinal(nuevoMargen)

    // Calcular el nuevo precio final basado en el margen
    const costoTotal = calcularCostoTotal()
    if (costoTotal > 0) {
      const nuevoPrecioFinal = costoTotal / (1 - nuevoMargen / 100)
      setPrecioFinal({
        valor: nuevoPrecioFinal,
        manual: true, // Marcamos como manual para que no se recalcule automáticamente
      })
    }
  }

  const handlePrecioChange = (valor: string, setter: (value: PrecioConFormula) => void) => {
    if (valor === "") {
      setter({ valor: null, manual: setter === setPrecioFinal ? true : false })
    } else if (valor.startsWith("=")) {
      setter({ valor: null, formula: valor, manual: setter === setPrecioFinal ? true : false })
    } else {
      const numeroValor = Number.parseFloat(valor)
      setter({ valor: isNaN(numeroValor) ? null : numeroValor, manual: setter === setPrecioFinal ? true : false })

      // Si estamos modificando el precio final, actualizar el margen de ganancia
      // Esto ya no es necesario aquí, se maneja en el useEffect
    }
  }

  const calcularYActualizarPrecio = (precio: PrecioConFormula, setter: (value: PrecioConFormula) => void) => {
    if (precio.formula) {
      const resultado = calcularExpresion(precio.formula.slice(1))
      setter({ valor: resultado, formula: undefined, manual: true })
    }
  }

  const guardarTemplate = () => {
    if (templateNombre && items.length > 0) {
      const newTemplate: CotizadorTemplate = {
        nombre: templateNombre,
        items: items,
      }
      setTemplates([...templates, newTemplate])
      setTemplateNombre("")
    }
  }

  const cargarTemplate = (templateNombre: string) => {
    const template = templates.find((t) => t.nombre === templateNombre)
    if (template) {
      setItems(template.items)
    }
  }

  // Añadir esta función para guardar en la base de datos
  const guardarEnBaseDeDatos = async () => {
    setGuardando(true)
    try {
      console.log("Guardando cotización con precio final:", precioFinal.valor)

      const cotizacion: CotizacionGeneral = {
        id: cotizacionId,
        tipo: "general",
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
        // Modificar la función guardarEnBaseDeDatos para resetear el estado de cambios sin guardar
        // Buscar la función guardarEnBaseDeDatos y modificar la parte final (dentro del bloque try)
        // Añadir después de setNotificacion({...}) y antes del bloque finally
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

  // Función para duplicar la cotización actual
  const duplicarCotizacion = () => {
    // Crear una copia de los datos actuales
    const nombreDuplicado = `${nombreProyecto} (Copia)`

    // Resetear el ID para que se guarde como una nueva cotización
    setCotizacionId(undefined)
    setNombreProyecto(nombreDuplicado)

    // Marcar como cambios sin guardar
    setCambiosSinGuardar(true)

    // Mostrar notificación
    setNotificacion({
      visible: true,
      exito: true,
      mensaje: "Cotización duplicada. Guarde para crear una nueva cotización.",
    })
  }

  const handleExportarCotizacion = () => {
    exportarCotizacion({
      items,
      precioFinal,
      margenGanancia,
      porcentajeComision,
      nombreProyecto,
      clienteNombre,
      nota,
      formato: formatoExportacion,
    })
  }

  const importarCotizacion = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const contenido = e.target?.result as string
          const cotizacion = JSON.parse(contenido)
          setItems(cotizacion.items)
          setMargenGanancia(cotizacion.margenGanancia)
          setPorcentajeComision(cotizacion.porcentajeComision)
          setNombreProyecto(cotizacion.nombreProyecto)
          setNota(cotizacion.nota)
          setPrecioFinal(cotizacion.precioFinal)
        } catch (error) {
          console.error("Error al importar la cotización:", error)
          alert("El archivo seleccionado no es una cotización válida.")
        }
      }
      reader.readAsText(file)
    }
  }

  const limpiarTodo = () => {
    setItems([])
    setMargenGanancia(40)
    setPrecioFinal({ valor: null })
    setPorcentajeComision(10)
    setNombreProyecto("")
    setNota("")
  }

  const handleEditItem = (item: Item) => {
    setItemEditando({ ...item })
  }

  const handleSaveItem = (updatedItem: Item) => {
    setItems(items.map((item) => (item.id === updatedItem.id ? updatedItem : item)))
    setItemEditando(null)
  }

  const handleCloseDialog = () => {
    setItemEditando(null)
  }

  const aplicarEscenario = (escenario: Escenario) => {
    setItems(escenario.items)
    setMargenGanancia(escenario.margenGanancia)
    setPorcentajeComision(escenario.porcentajeComision)
    setPrecioFinal(escenario.precioFinal)
  }

  // Modificar el efecto que actualiza el margen cuando cambia el precio final para actualizar también el margen final:
  useEffect(() => {
    if (!isInitialRender.current && precioFinal.valor !== null && precioFinal.manual) {
      const costoTotal = calcularCostoTotal()
      if (costoTotal > 0 && precioFinal.valor > costoTotal) {
        const nuevoMargen = ((precioFinal.valor - costoTotal) / precioFinal.valor) * 100
        // Actualizar el margen solo si hay un cambio significativo
        if (Math.abs(nuevoMargen - margenGanancia) > 0.1) {
          setMargenGanancia(Number.parseFloat(nuevoMargen.toFixed(2)))
        }
        // Actualizar también el margen final
        setMargenFinal(Number.parseFloat(nuevoMargen.toFixed(2)))
      }
    }
  }, [precioFinal.valor, precioFinal.manual]) // Dependencias necesarias

  // Añadir un efecto para detectar cambios sin guardar
  // Añadir after other useEffect
  useEffect(() => {
    // Si es la carga inicial, no marcar como cambios sin guardar
    if (isInitialRender.current) {
      return
    }

    // Marcar que hay cambios sin guardar
    setCambiosSinGuardar(true)
  }, [items, margenGanancia, porcentajeComision, nombreProyecto, nota, clienteNombre, precioFinal.valor])

  // Añadir un efecto para la advertencia al salir
  // Añadir after the efecto anterior
  useEffect(() => {
    // Función para manejar el evento beforeunload
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (cambiosSinGuardar) {
        // Mensaje estándar de confirmación (el texto exacto lo controla el navegador)
        const mensaje = "Hay cambios sin guardar. ¿Seguro que deseas salir?"
        e.preventDefault()
        e.returnValue = mensaje
        return mensaje
      }
    }

    // Añadir el evento cuando el componente se monta
    window.addEventListener("beforeunload", handleBeforeUnload)

    // Eliminar el evento cuando el componente se desmonta
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [cambiosSinGuardar])

  // Modificar el JSX para añadir el botón de guardar y la notificación
  return (
    <MobileOptimizedContainer className="container mx-auto p-4 space-y-6">
      {/* Notificación de guardado */}
      <NotificacionGuardado
        visible={notificacion.visible}
        exito={notificacion.exito}
        mensaje={notificacion.mensaje}
        onClose={() => setNotificacion({ ...notificacion, visible: false })}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="h-9">
            <Link href="/">
              <ChevronRight className="mr-1 h-4 w-4 rotate-180" />
              <span className="sm:inline">Volver</span>
            </Link>
          </Button>
          <h1 className="text-xl sm:text-2xl font-bold truncate">Cotizador General</h1>
        </div>
        <div className="flex items-center gap-1 self-end">
          {/* Botón para guardar en la */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="default"
                  size="icon"
                  className="h-9 w-9"
                  onClick={guardarEnBaseDeDatos}
                  disabled={guardando}
                >
                  {guardando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
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
                <Button variant="outline" size="icon" className="h-9 w-9" onClick={duplicarCotizacion}>
                  <Copy className="h-4 w-4" />
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
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => importFileRef.current?.click()}
                >
                  <Upload className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Importar Cotización</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <input type="file" ref={importFileRef} onChange={importarCotizacion} accept=".json" className="hidden" />

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9" onClick={handleExportarCotizacion}>
                  <Download className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Exportar Cotización</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9" onClick={limpiarTodo}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Limpiar Todo</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-5 mb-4">
              <TabsTrigger value="items" className="flex items-center gap-2">
                <Layers className="h-4 w-4" />
                <span>Ítems</span>
              </TabsTrigger>
              <TabsTrigger value="calculos" className="flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                <span>Cálculos</span>
              </TabsTrigger>
              <TabsTrigger value="analisis" className="flex items-center gap-2">
                <BarChart4 className="h-4 w-4" />
                <span>Análisis</span>
              </TabsTrigger>
              <TabsTrigger value="escenarios" className="flex items-center gap-2">
                <Coins className="h-4 w-4" />
                <span>Escenarios</span>
              </TabsTrigger>
              <TabsTrigger value="proyecto" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span>Proyecto</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="items" className="space-y-6">
              <Collapsible defaultOpen className="space-y-4">
                <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-muted/50 rounded-lg hover:bg-muted">
                  <div className="flex items-center gap-2">
                    <Grid className="h-5 w-5" />
                    <h3 className="text-lg font-medium">Agregar Ítems</h3>
                  </div>
                  <ChevronDown className="h-5 w-5" />
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4">
                  <Card>
                    <CardContent className="pt-6">
                      <ItemForm onAdd={(item) => setItems([...items, item])} />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Lista de Ítems</CardTitle>
                      <CardDescription>Haga clic en el ícono de edición para modificar un ítem</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <DraggableItemList
                        items={items}
                        onRemove={(id) => setItems(items.filter((item) => item.id !== id))}
                        onEdit={handleEditItem}
                        headers={["Descripción", "Categoría", "Detalles", "Cantidad", "Precio Unitario", "Subtotal"]}
                        renderItem={(item) => (
                          <>
                            <TableCell>{item.descripcion}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize">
                                {item.categoria || "Sin categoría"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {item.mostrarExtendido && item.extendido ? (
                                <div className="text-sm">
                                  <p>
                                    Ancho: {item.extendido.ancho} {item.extendido.unidadMedida}
                                  </p>
                                  <p>
                                    Alto: {item.extendido.alto} {item.extendido.unidadMedida}
                                  </p>
                                  <p>Área: {item.areaPiesCuadrados?.toFixed(2)} pies²</p>
                                </div>
                              ) : (
                                <span className="text-sm text-muted-foreground">N/A</span>
                              )}
                            </TableCell>
                            <TableCell>{item.cantidad}</TableCell>
                            <TableCell>{formatearPrecioDOP(item.precioUnitario.valor ?? 0)}</TableCell>
                            <TableCell>{formatearPrecioDOP(calcularPrecioItem(item))}</TableCell>
                          </>
                        )}
                      />
                    </CardContent>
                  </Card>
                </CollapsibleContent>
              </Collapsible>
            </TabsContent>

            <TabsContent value="calculos" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Resumen de Cotización
                  </CardTitle>
                  <CardDescription>Resumen de costos, precios y márgenes de ganancia</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResumenCotizacion
                    items={items}
                    margenGanancia={margenGanancia}
                    porcentajeComision={porcentajeComision}
                    precioFinal={precioFinal}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Configuración de Precios
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-1">
                        <Label htmlFor="margenGanancia">Margen de Ganancia General (%)</Label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">
                                Porcentaje de ganancia aplicado a los ítems no relacionados con impresión. Se calcula
                                como: (Precio - Costo) / Precio × 100
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
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="porcentajeComision">Porcentaje de Comisión (%)</Label>
                      <Input
                        id="porcentajeComision"
                        type="number"
                        value={porcentajeComision}
                        onChange={(e) => setPorcentajeComision(Number(e.target.value))}
                        min={0}
                        max={100}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="precioFinal">Precio Final</Label>
                      <Input
                        id="precioFinal"
                        type="text"
                        value={(precioFinal.valor !== null ? precioFinal.valor.toString() : "") || precioFinal.formula}
                        onChange={(e) => handlePrecioChange(e.target.value, setPrecioFinal)}
                        onBlur={() => calcularYActualizarPrecio(precioFinal, setPrecioFinal)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="comision">Comisión Calculada</Label>
                      <Input
                        id="comision"
                        value={formatearPrecioDOP(calcularComision(precioFinal.valor ?? 0))}
                        readOnly
                      />
                    </div>
                    {/* Agregar el input para el margen final en la sección de Configuración de Precios: */}
                    <div className="space-y-2">
                      <Label htmlFor="margenFinal">Margen Final (%)</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="margenFinal"
                          type="number"
                          value={margenFinal}
                          onChange={(e) => handleMargenFinalChange(Number(e.target.value))}
                          min={0}
                          max={100}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="whitespace-nowrap"
                          onClick={() => handleMargenFinalChange(margenObjetivo)}
                        >
                          Usar objetivo
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Ajustar este margen modificará automáticamente el precio final
                      </p>
                    </div>
                  </div>
                  <div className="col-span-2 text-sm text-muted-foreground mt-1">
                    <p>
                      Nota: Los ítems de impresión utilizan directamente el precio de venta ingresado y no se ven
                      afectados por el margen general.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="h-5 w-5" />
                    Análisis de Costos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-1">
                        <Label htmlFor="costoTotal">Costo Total Estimado</Label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">
                                Suma de los costos calculados para todos los ítems según sus características
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <Input id="costoTotal" value={formatearPrecioDOP(calcularCostoTotal())} readOnly />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="costoTotalReal">Costo Total Real</Label>
                      <Input id="costoTotalReal" value={formatearPrecioDOP(calcularCostoTotalReal())} readOnly />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gananciaReal">Ganancia Real</Label>
                      <Input id="gananciaReal" value={formatearPrecioDOP(calcularGananciaReal())} readOnly />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="margenGananciaReal">Margen de Ganancia Real (%)</Label>
                      <Input id="margenGananciaReal" value={calcularMargenGananciaReal().toFixed(2)} readOnly />
                    </div>
                  </div>
                  <div className="mt-4">
                    <Button onClick={() => setShowAnalisisDetallado(true)}>Ver Análisis Detallado</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analisis" className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Análisis Avanzado</h3>
                <Switch checked={mostrarAnalisisAvanzado} onCheckedChange={setMostrarAnalisisAvanzado} />
              </div>

              {mostrarAnalisisAvanzado ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Análisis de Rentabilidad
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground cursor-help ml-1" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">
                              Este gráfico muestra el desglose de costos por categoría, la comisión y la ganancia final
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </CardTitle>
                    <CardDescription>Desglose detallado de costos y ganancias</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={[
                            // Agrupar costos por categoría
                            ...Object.entries(
                              items.reduce(
                                (acc, item) => {
                                  const categoria = item.categoria || "sin_categoria"
                                  if (!acc[categoria]) acc[categoria] = 0
                                  acc[categoria] += calcularCostoItem(item)
                                  return acc
                                },
                                {} as Record<string, number>,
                              ),
                            ).map(([categoria, valor]) => ({
                              name:
                                categoria === "sin_categoria"
                                  ? "Otros"
                                  : categoria === "impresion"
                                    ? "Impresión"
                                    : categoria === "materiales"
                                      ? "Materiales"
                                      : categoria === "mano_obra"
                                        ? "Mano de Obra"
                                        : categoria === "transporte"
                                          ? "Transporte"
                                          : categoria === "servicios"
                                            ? "Servicios"
                                            : categoria.charAt(0).toUpperCase() + categoria.slice(1).replace("_", " "),
                              value: valor,
                            })),
                            // Agregar comisión
                            {
                              name: "Comisión",
                              value: calcularComision(precioFinal.valor ?? 0),
                            },
                            // Agregar ganancia
                            {
                              name: "Ganancia",
                              value: calcularGananciaPostComision(
                                precioFinal.valor ?? 0,
                                calcularCostoTotal(),
                                calcularComision(precioFinal.valor ?? 0),
                              ),
                            },
                          ]}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis tickFormatter={(value) => `${formatearPrecioDOP(value)}`} />
                          <RechartsTooltip formatter={(value: number) => formatearPrecioDOP(value)} />
                          <Bar dataKey="value" fill="#8884d8">
                            {({ payload }) =>
                              payload.map((entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={
                                    entry.name === "Ganancia"
                                      ? "#22c55e" // Verde más brillante para la ganancia
                                      : entry.name === "Comisión"
                                        ? "#ef4444" // Rojo para la comisión
                                        : entry.name === "Impresión"
                                          ? "#3b82f6"
                                          : entry.name === "Materiales"
                                            ? "#8b5cf6"
                                            : entry.name === "Mano de Obra"
                                              ? "#ec4899"
                                              : entry.name === "Transporte"
                                                ? "#14b8a6"
                                                : entry.name === "Servicios"
                                                  ? "#f59e0b"
                                                  : "#93c5fd"
                                  }
                                />
                              ))
                            }
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="py-10 text-center">
                    <div className="space-y-4">
                      <BarChart4 className="h-16 w-16 mx-auto text-muted-foreground" />
                      <h3 className="text-lg font-medium">Análisis Avanzado</h3>
                      <p className="text-muted-foreground max-w-md mx-auto">
                        Active el análisis avanzado para ver punto de equilibrio, análisis de rentabilidad y
                        recomendaciones personalizadas.
                      </p>
                      <Button onClick={() => setMostrarAnalisisAvanzado(true)}>Activar Análisis Avanzado</Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="escenarios" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5" />
                    Crear Escenario
                  </CardTitle>
                  <CardDescription>
                    Guarde la configuración actual como un escenario para comparar alternativas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nombreEscenario">Nombre del Escenario</Label>
                      <Input
                        id="nombreEscenario"
                        placeholder="Ej: Escenario Base"
                        value={nombreEscenario}
                        onChange={(e) => setNombreEscenario(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="descripcionEscenario">Descripción</Label>
                      <Input
                        id="descripcionEscenario"
                        placeholder="Descripción breve"
                        value={descripcionEscenario}
                        onChange={(e) => setDescripcionEscripcionEscenario(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex justify-between mt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        // Generar escenarios automáticos
                        const nuevosEscenarios: Escenario[] = [
                          {
                            id: Date.now().toString() + "-1",
                            nombre: "Escenario Optimista",
                            descripcion: "Margen de ganancia aumentado en 10%",
                            items: items,
                            margenGanancia: Math.min(margenGanancia + 10, 80),
                            porcentajeComision: porcentajeComision,
                            precioFinal: { valor: (precioFinal.valor ?? 0) * 1.1 },
                            fechaCreacion: new Date().toISOString(),
                          },
                          {
                            id: Date.now().toString() + "-2",
                            nombre: "Escenario Pesimista",
                            descripcion: "Costos aumentados en 10%",
                            items: items.map((item) => ({
                              ...item,
                              costoReal: (item.costoReal ?? calcularCostoItem(item)) * 1.1,
                            })),
                            margenGanancia: margenGanancia,
                            porcentajeComision: porcentajeComision,
                            precioFinal: precioFinal,
                            fechaCreacion: new Date().toISOString(),
                          },
                          {
                            id: Date.now().toString() + "-3",
                            nombre: "Sin Comisión",
                            descripcion: "Escenario sin comisión",
                            items: items,
                            margenGanancia: margenGanancia,
                            porcentajeComision: 0,
                            precioFinal: precioFinal,
                            fechaCreacion: new Date().toISOString(),
                          },
                        ]
                        setEscenarios([...escenarios, ...nuevosEscenarios])
                      }}
                    >
                      <Zap className="mr-2 h-4 w-4" /> Generar Escenarios Automáticos
                    </Button>
                    <Button
                      onClick={() => {
                        if (nombreEscenario) {
                          const nuevoEscenario: Escenario = {
                            id: Date.now().toString(),
                            nombre: nombreEscenario,
                            descripcion: descripcionEscenario,
                            items: items,
                            margenGanancia: margenGanancia,
                            porcentajeComision: porcentajeComision,
                            precioFinal: precioFinal,
                            fechaCreacion: new Date().toISOString(),
                          }
                          setEscenarios([...escenarios, nuevoEscenario])
                          setNombreEscenario("")
                          setDescripcionEscripcionEscenario("")
                        }
                      }}
                      disabled={!nombreEscenario}
                    >
                      <Save className="mr-2 h-4 w-4" /> Guardar Escenario Actual
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {escenarios.length > 0 ? (
                <VisualizadorEscenarios
                  escenarios={escenarios}
                  onAplicarEscenario={aplicarEscenario}
                  onEliminarEscenario={(id) => {
                    setEscenarios(escenarios.filter((e) => e.id !== id))
                    if (escenarioSeleccionado === id) {
                      setEscenarioSeleccionado(null)
                    }
                  }}
                />
              ) : (
                <Card>
                  <CardContent className="py-10 text-center">
                    <div className="space-y-4">
                      <Coins className="h-16 w-16 mx-auto text-muted-foreground" />
                      <h3 className="text-lg font-medium">No hay escenarios</h3>
                      <p className="text-muted-foreground max-w-md mx-auto">
                        Cree escenarios para comparar diferentes configuraciones de precios, márgenes y comisiones.
                      </p>
                      <Button onClick={() => setActiveTab("escenarios")}>Crear Primer Escenario</Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="proyecto" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Información del Proyecto
                  </CardTitle>
                  <CardDescription>Detalles generales del proyecto y notas adicionales</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nombreProyecto">Nombre del Proyecto</Label>
                      <Input
                        id="nombreProyecto"
                        placeholder="Nombre del proyecto"
                        value={nombreProyecto}
                        onChange={(e) => setNombreProyecto(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="clienteNombre">Nombre del Cliente</Label>
                      <Input
                        id="clienteNombre"
                        placeholder="Nombre del cliente"
                        value={clienteNombre}
                        onChange={(e) => setClienteNombre(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nota">Notas Adicionales</Label>
                    <Textarea
                      id="nota"
                      placeholder="Notas o comentarios adicionales"
                      value={nota}
                      onChange={(e) => setNota(e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Template className="h-5 w-5" />
                    Gestión de Plantillas
                  </CardTitle>
                  <CardDescription>Guardar y cargar plantillas para reutilizar configuraciones comunes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="templateNombre">Nombre de la Plantilla</Label>
                      <Input
                        id="templateNombre"
                        placeholder="Nombre de la plantilla"
                        value={templateNombre}
                        onChange={(e) => setTemplateNombre(e.target.value)}
                      />
                    </div>
                    <div className="flex items-end">
                      <Button
                        variant="outline"
                        onClick={guardarTemplate}
                        disabled={!templateNombre || items.length === 0}
                        className="w-full"
                      >
                        <Save className="mr-2 h-4 w-4" /> Guardar Plantilla
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="filtroTemplates">Cargar Plantilla Existente</Label>
                    <Input
                      id="filtroTemplates"
                      placeholder="Buscar plantilla..."
                      value={filtroTemplates}
                      onChange={(e) => setFiltroTemplates(e.target.value)}
                    />
                    <Select onValueChange={cargarTemplate}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione una plantilla" />
                      </SelectTrigger>
                      <SelectContent>
                        {templates
                          .filter((template) => template.nombre.toLowerCase().includes(filtroTemplates.toLowerCase()))
                          .map((template) => (
                            <SelectItem key={template.nombre} value={template.nombre}>
                              {template.nombre}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="h-5 w-5" />
                    Opciones de Exportación
                  </CardTitle>
                  <CardDescription>Seleccione el formato para guardar la cotización</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroup value={formatoExportacion} onValueChange={setFormatoExportacion}>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="json" id="formato-json" />
                          <Label htmlFor="formato-json">JSON</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="pdf" id="formato-pdf" />
                          <Label htmlFor="formato-pdf">PDF</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Seleccione el formato en el que desea guardar la cotización.
                    </p>
                    <Button className="w-full" onClick={handleExportarCotizacion}>
                      <Download className="mr-2 h-4 w-4" /> Exportar Cotización
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="md:col-span-1 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Info className="h-5 w-5" />
                Resumen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total de Items:</span>
                  <span>{items.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Costo Total:</span>
                  <span>{formatearPrecioDOP(calcularCostoTotal())}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Precio Sugerido:</span>
                  <span>{formatearPrecioDOP(calcularPrecioVentaSugerido(calcularCostoTotalNoImpresion()))}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Precio Final:</span>
                  <span>{formatearPrecioDOP(precioFinal.valor ?? 0)}</span>
                </div>
                <div className="flex justify-between text-sm font-medium">
                  <span>Ganancia:</span>
                  <span>{formatearPrecioDOP((precioFinal.valor ?? 0) - calcularCostoTotal())}</span>
                </div>
              </div>
              <Button className="w-full" onClick={guardarEnBaseDeDatos} disabled={guardando}>
                {guardando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Guardar Cotización
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart4 className="h-5 w-5" />
                Margen de Ganancia
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm flex items-center gap-1">
                  Margen Actual
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">
                          Porcentaje de ganancia actual basado en el precio final y costo total
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </span>
                <Badge
                  variant={
                    calcularMargenGanancia(precioFinal.valor ?? 0, calcularCostoTotal()) >= margenObjetivo
                      ? "success"
                      : "destructive"
                  }
                >
                  {calcularMargenGanancia(precioFinal.valor ?? 0, calcularCostoTotal()).toFixed(2)}%
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="margenObjetivo" className="text-sm">
                    Margen Objetivo (%)
                  </Label>
                  <span className="text-sm font-medium">{margenObjetivo}%</span>
                </div>
                <div className="relative">
                  <input
                    id="margenObjetivo"
                    type="range"
                    min="0"
                    max="80"
                    step="1"
                    value={margenObjetivo}
                    onChange={(e) => setMargenObjetivo(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>

              {calcularMargenGanancia(precioFinal.valor ?? 0, calcularCostoTotal()) < margenObjetivo && (
                <div className="bg-muted/50 border border-muted rounded-md p-3 text-sm space-y-1">
                  <div className="flex items-center gap-1 font-medium">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    Margen por debajo del objetivo
                  </div>
                  <p className="text-muted-foreground">
                    Para alcanzar el margen objetivo de {margenObjetivo}%, considere{" "}
                    <span className="text-primary font-medium">aumentar los precios</span> o{" "}
                    <span className="text-primary font-medium">reducir costos</span>.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => {
                      // Calcular el precio necesario para alcanzar el margen objetivo
                      const costoTotal = calcularCostoTotal()
                      const precioNecesario = costoTotal / (1 - margenObjetivo / 100)
                      console.log(
                        `Ajustando precio automáticamente: ${precioNecesario} para margen objetivo ${margenObjetivo}%`,
                      )
                      setPrecioFinal({ valor: precioNecesario, manual: true })
                    }}
                  >
                    <Zap className="mr-2 h-3 w-3" /> Ajustar precio automáticamente
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <EditarItemDialog
        item={itemEditando}
        isOpen={itemEditando !== null}
        onClose={handleCloseDialog}
        onSave={handleSaveItem}
      />
      <Dialog open={showAnalisisDetallado} onOpenChange={setShowAnalisisDetallado}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Análisis Detallado de Costos</DialogTitle>
            <CardDescription>Desglose completo de los costos estimados vs. los costos reales</CardDescription>
          </DialogHeader>
          <ScrollArea className="h-[60vh]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead className="text-right">Costo Estimado</TableHead>
                  <TableHead className="text-right">Costo Real</TableHead>
                  <TableHead className="text-right">Diferencia</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.descripcion}</TableCell>
                    <TableCell>{item.categoria || "Sin categoría"}</TableCell>
                    <TableCell className="text-right">{formatearPrecioDOP(calcularCostoItem(item))}</TableCell>
                    <TableCell className="text-right">
                      {formatearPrecioDOP(item.costoReal ?? calcularCostoItem(item))}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatearPrecioDOP(
                        (item.costoReal ?? calcularCostoItem(item, false)) - calcularCostoItem(item, false),
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={2}>
                    <strong>Total</strong>
                  </TableCell>
                  <TableCell className="text-right">
                    <strong>{formatearPrecioDOP(calcularCostoTotal())}</strong>
                  </TableCell>
                  <TableCell className="text-right">
                    <strong>{formatearPrecioDOP(calcularCostoTotalReal())}</strong>
                  </TableCell>
                  <TableCell className="text-right">
                    <strong>{formatearPrecioDOP(calcularDiferenciaPresupuesto())}</strong>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </ScrollArea>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setShowAnalisisDetallado(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MobileOptimizedContainer>
  )
}
