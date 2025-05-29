// Tipos existentes
export type CotizacionTipo = "impresion" | "general" | "combinado"

export interface CotizacionBase {
  id?: string
  tipo: CotizacionTipo
  nombre: string
  cliente?: string
  nota?: string
  fechaCreacion?: string
  fechaModificacion?: string
  costoTotal?: number
}

export interface CotizacionImpresion extends CotizacionBase {
  tipo: "impresion"
  itemsImpresion: ItemImpresion[]
  itemsAdicionales: ItemAdicional[]
  porcentajeComision: number
  precioFinal: number
}

export interface CotizacionGeneral extends CotizacionBase {
  tipo: "general"
  items: Item[]
  margenGanancia: number
  porcentajeComision: number
  precioFinal: number
}

// Nuevos tipos para la exportación
export type UnidadMedida = "pulgadas" | "pies" | "centimetros" | "metros"

export type PrecioConFormula = {
  valor: number | null
  formula?: string
  manual?: boolean
}

export interface ItemExtendido {
  ancho: number | null
  alto: number | null
  unidadMedida: UnidadMedida
  costoPorPie: number | null
}

export interface ItemBase {
  id: string
}

export interface Item {
  descripcion: string
  cantidad: number
  precioUnitario: PrecioConFormula
  extendido?: ItemExtendido
  mostrarExtendido: boolean
  areaPiesCuadrados?: number
  esImpresion: boolean
  costoReal?: number
  categoria?: string
}

export interface CotizadorTemplate {
  nombre: string
  items: Item[]
}

export interface Escenario {
  id: string
  nombre: string
  descripcion: string
  items: Item[]
  margenGanancia: number
  porcentajeComision: number
  precioFinal: PrecioConFormula
  fechaCreacion: string
}

// Specific to Impresion
export interface ItemImpresion extends ItemBase {
  ancho: number
  alto: number
  unidadMedida: UnidadMedida
  cantidad: number
  costoPorPie: number
  precioVentaPorPie: number
  areaPiesCuadrados: number
}

// Specific to Adicional
export interface ItemAdicional extends ItemBase {
  descripcion: string
  costo: number
  tipo?: string
  incluido: boolean // Indica si el ítem está incluido en el precio base
  precioVenta?: number // Precio de venta calculado o ingresado directamente
  margen?: number // Porcentaje de margen si se calcula por porcentaje
  modoPrecio: "directo" | "margen" // Indica cómo se calcula el precio
}

export interface CotizacionCombinada extends CotizacionBase {
  tipo: "combinado"
  items: ItemCombinado[]
  margenGanancia: number
  porcentajeComision: number
  precioFinal: number
}

export interface ItemCombinado extends Item {
  tipoItem: "venta" | "costo"
  modoPrecio?: "porPie" | "total"
  precioTotal?: number
}

export type Cotizacion = CotizacionGeneral | CotizacionImpresion | CotizacionCombinada
