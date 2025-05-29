import { getSupabaseBrowserClient } from "@/lib/supabase"
import type { Cotizacion, CotizacionImpresion, CotizacionGeneral, CotizacionCombinada } from "@/types/cotizaciones"

// Obtener una cotización por ID
export async function obtenerCotizacionPorId(id: string): Promise<Cotizacion | null> {
  try {
    const supabase = getSupabaseBrowserClient()
    const { data, error } = await supabase.from("cotizaciones").select("*").eq("id", id).single()

    if (error) {
      console.error("Error al obtener cotización:", error)
      throw error
    }

    console.log("Datos crudos de la cotización:", data)
    console.log("Precio final en la base de datos:", data.precio_final)

    const cotizacion = transformarCotizacionDesdeBD(data)
    console.log("Cotización transformada:", cotizacion)
    console.log("Precio final después de transformar:", cotizacion.precioFinal)

    return cotizacion
  } catch (error) {
    console.error("Error al obtener cotización:", error)
    return null
  }
}

// Función auxiliar para transformar los datos de la BD al formato de la aplicación
function transformarCotizacionDesdeBD(data: any): Cotizacion {
  console.log("Transformando datos de BD:", data)
  console.log("Precio final en datos de BD:", data.precio_final)

  if (data.tipo === "impresion") {
    return {
      id: data.id,
      tipo: "impresion",
      nombre: data.nombre,
      cliente: data.cliente,
      itemsImpresion: data.items_impresion || [],
      itemsAdicionales: data.items_adicionales || [],
      porcentajeComision: data.porcentaje_comision,
      precioFinal: data.precio_final,
      nota: data.nota,
      fechaCreacion: data.fecha_creacion,
      fechaModificacion: data.fecha_modificacion,
      costoTotal: data.costo_total,
    } as CotizacionImpresion
  } else if (data.tipo === "combinado") {
    // Asegurarse de que los items tengan la estructura correcta para cotizaciones combinadas
    const items = Array.isArray(data.items)
      ? data.items.map((item) => ({
          ...item,
          precioUnitario: {
            valor: item.precioUnitario?.valor || item.precio_unitario,
            manual: true,
          },
          tipoItem: item.tipoItem || "venta", // Asegurar que tenga tipoItem
        }))
      : []

    const cotizacion = {
      id: data.id,
      tipo: "combinado",
      nombre: data.nombre,
      cliente: data.cliente,
      items: items,
      margenGanancia: data.margen_ganancia,
      porcentajeComision: data.porcentaje_comision,
      precioFinal: data.precio_final,
      nota: data.nota,
      fechaCreacion: data.fecha_creacion,
      fechaModificacion: data.fecha_modificacion,
      costoTotal: data.costo_total,
    } as CotizacionCombinada

    console.log("Cotización combinada transformada:", cotizacion)
    console.log("Precio final en cotización transformada:", cotizacion.precioFinal)

    return cotizacion
  } else {
    // Cotización general (mantener código existente)
    const items = Array.isArray(data.items)
      ? data.items.map((item) => ({
          ...item,
          precioUnitario: {
            valor: item.precioUnitario?.valor || item.precio_unitario,
            manual: true,
          },
        }))
      : []

    const cotizacion = {
      id: data.id,
      tipo: "general",
      nombre: data.nombre,
      cliente: data.cliente,
      items: items,
      margenGanancia: data.margen_ganancia,
      porcentajeComision: data.porcentaje_comision,
      precioFinal: data.precio_final,
      nota: data.nota,
      fechaCreacion: data.fecha_creacion,
      fechaModificacion: data.fecha_modificacion,
      costoTotal: data.costo_total,
    } as CotizacionGeneral

    console.log("Cotización general transformada:", cotizacion)
    console.log("Precio final en cotización transformada:", cotizacion.precioFinal)

    return cotizacion
  }
}

// Guardar una cotización en la base de datos
export async function guardarCotizacion(
  cotizacion: Cotizacion,
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    // Verificar que tenemos un cliente de Supabase
    const supabase = getSupabaseBrowserClient()
    if (!supabase) {
      console.error("Error: Cliente de Supabase no disponible")
      return { success: false, error: "Cliente de Supabase no disponible" }
    }

    console.log("Guardando cotización en Supabase:", cotizacion)
    console.log("Precio final a guardar:", cotizacion.precioFinal)

    // Preparar los datos según el tipo de cotización
    const datosGuardar: any = {
      tipo: cotizacion.tipo,
      nombre: cotizacion.nombre,
      cliente: cotizacion.cliente || null,
      porcentaje_comision: cotizacion.porcentajeComision,
      precio_final: cotizacion.precioFinal,
      nota: cotizacion.nota || null,
      fecha_modificacion: new Date().toISOString(),
    }

    if (cotizacion.tipo === "impresion") {
      const cotizacionImpresion = cotizacion as CotizacionImpresion

      // Asegúrate de que los arrays se serialicen correctamente
      if (Array.isArray(cotizacionImpresion.itemsImpresion)) {
        datosGuardar.items_impresion = cotizacionImpresion.itemsImpresion
        console.log("items_impresion a guardar:", datosGuardar.items_impresion)
      }

      if (Array.isArray(cotizacionImpresion.itemsAdicionales)) {
        datosGuardar.items_adicionales = cotizacionImpresion.itemsAdicionales
        console.log("items_adicionales a guardar:", datosGuardar.items_adicionales)
      }

      // Calcular el costo total de los ítems de impresión
      const costoTotalImpresion = (cotizacionImpresion.itemsImpresion || []).reduce((total, item) => {
        return total + (item.costoPorPie || 0) * (item.areaPiesCuadrados || 0) * (item.cantidad || 1)
      }, 0)

      // Calcular el costo total de los ítems adicionales
      const costoTotalAdicionales = (cotizacionImpresion.itemsAdicionales || []).reduce((total, item) => {
        return total + (item.costo || 0)
      }, 0)

      // Sumar ambos costos para obtener el costo total
      const costoTotal = costoTotalImpresion + costoTotalAdicionales

      datosGuardar.costo_total = costoTotal
    } else if (cotizacion.tipo === "combinado") {
      const cotizacionCombinada = cotizacion as CotizacionCombinada
      if (Array.isArray(cotizacionCombinada.items)) {
        // Asegurarse de que los items se serialicen correctamente
        datosGuardar.items = cotizacionCombinada.items.map((item) => ({
          ...item,
          // Asegurarse de que precioUnitario sea serializable
          precioUnitario: {
            valor: item.precioUnitario?.valor || 0,
            formula: item.precioUnitario?.formula,
          },
        }))
      }
      datosGuardar.margen_ganancia = cotizacionCombinada.margenGanancia

      // Calcular el costo total para cotizaciones combinadas
      const costoTotal = cotizacionCombinada.items.reduce((total, item) => {
        if (item.costoReal !== undefined) {
          return total + item.costoReal
        }
        if (item.mostrarExtendido && item.extendido) {
          const { ancho, alto, unidadMedida, costoPorPie } = item.extendido
          if (ancho !== null && alto !== null && costoPorPie !== null) {
            const factorConversion = {
              pulgadas: 1 / 144,
              pies: 1,
              centimetros: 1 / 929.0304,
              metros: 10.7639,
            }
            const areaPiesCuadrados = ancho * alto * factorConversion[unidadMedida]
            return total + areaPiesCuadrados * costoPorPie * item.cantidad
          }
        }
        return total + (item.precioUnitario.valor ?? 0) * item.cantidad
      }, 0)

      datosGuardar.costo_total = costoTotal
    } else {
      const cotizacionGeneral = cotizacion as CotizacionGeneral
      if (Array.isArray(cotizacionGeneral.items)) {
        // Asegurarse de que los items se serialicen correctamente
        datosGuardar.items = cotizacionGeneral.items.map((item) => ({
          ...item,
          // Asegurarse de que precioUnitario sea serializable
          precioUnitario: {
            valor: item.precioUnitario?.valor || 0,
            formula: item.precioUnitario?.formula,
          },
        }))
      }
      datosGuardar.margen_ganancia = cotizacionGeneral.margenGanancia

      // Calcular el costo total
      const costoTotal = cotizacionGeneral.items.reduce((total, item) => {
        if (item.costoReal !== undefined) {
          return total + item.costoReal
        }
        if (item.mostrarExtendido && item.extendido) {
          const { ancho, alto, unidadMedida, costoPorPie } = item.extendido
          if (ancho !== null && alto !== null && costoPorPie !== null) {
            // Función para convertir a pies cuadrados
            const factorConversion = {
              pulgadas: 1 / 144,
              pies: 1,
              centimetros: 1 / 929.0304,
              metros: 10.7639,
            }
            const areaPiesCuadrados = ancho * alto * factorConversion[unidadMedida]
            return total + areaPiesCuadrados * costoPorPie * item.cantidad
          }
        }
        return total + (item.precioUnitario.valor ?? 0) * item.cantidad
      }, 0)

      datosGuardar.costo_total = costoTotal
    }

    // Si tiene ID, actualizar, si no, insertar
    if (cotizacion.id) {
      console.log("Actualizando cotización existente con ID:", cotizacion.id)
      try {
        const { data, error } = await supabase
          .from("cotizaciones")
          .update(datosGuardar)
          .eq("id", cotizacion.id)
          .select()

        if (error) {
          console.error("Error de Supabase al actualizar cotización:", error)
          return { success: false, error: `Error al actualizar: ${error.message}` }
        }

        if (!data || data.length === 0) {
          console.error("No se recibieron datos después de actualizar")
          return { success: false, error: "No se recibieron datos después de actualizar" }
        }

        console.log("Cotización actualizada correctamente:", data)
        return { success: true, id: data[0]?.id }
      } catch (updateError) {
        console.error("Error al actualizar cotización:", updateError)
        return { success: false, error: `Error al actualizar: ${(updateError as Error).message}` }
      }
    } else {
      // Añadir fecha de creación para nuevas cotizaciones
      datosGuardar.fecha_creacion = new Date().toISOString()
      console.log("Insertando nueva cotización con datos:", datosGuardar)

      try {
        const { data, error } = await supabase.from("cotizaciones").insert(datosGuardar).select()

        if (error) {
          console.error("Error de Supabase al insertar cotización:", error)
          return { success: false, error: `Error al insertar: ${error.message}` }
        }

        if (!data || data.length === 0) {
          console.error("No se recibieron datos después de insertar")
          return { success: false, error: "No se recibieron datos después de insertar" }
        }

        console.log("Cotización insertada correctamente:", data)
        return { success: true, id: data[0]?.id }
      } catch (insertError) {
        console.error("Error al insertar cotización:", insertError)
        return { success: false, error: `Error al insertar: ${(insertError as Error).message}` }
      }
    }
  } catch (error) {
    console.error("Error general al guardar cotización:", error)
    return { success: false, error: `Error general: ${(error as Error).message}` }
  }
}

// El resto de las funciones se mantienen igual
export const obtenerCotizaciones = async (): Promise<Cotizacion[]> => {
  try {
    const supabase = getSupabaseBrowserClient()
    const { data, error } = await supabase
      .from("cotizaciones")
      .select("*")
      .order("fecha_creacion", { ascending: false })

    if (error) {
      console.error("Error al obtener cotizaciones:", error)
      throw error
    }

    // Transformar los datos de la base de datos al formato de la aplicación
    return data.map((cotizacion) => ({
      id: cotizacion.id,
      tipo: cotizacion.tipo,
      nombre: cotizacion.nombre,
      cliente: cotizacion.cliente,
      items: cotizacion.items || [],
      itemsImpresion: cotizacion.items_impresion || [],
      itemsAdicionales: cotizacion.items_adicionales || [],
      margenGanancia: cotizacion.margen_ganancia,
      porcentajeComision: cotizacion.porcentaje_comision,
      precioFinal: cotizacion.precio_final,
      costoTotal: cotizacion.costo_total,
      nota: cotizacion.nota,
      fechaCreacion: cotizacion.fecha_creacion,
    }))
  } catch (error) {
    console.error("Error al obtener cotizaciones:", error)
    return []
  }
}

// Eliminar una cotización
export async function eliminarCotizacion(id: string): Promise<boolean> {
  try {
    const supabase = getSupabaseBrowserClient()
    const { error } = await supabase.from("cotizaciones").delete().eq("id", id)

    if (error) throw error
    return true
  } catch (error) {
    console.error("Error al eliminar cotización:", error)
    return false
  }
}
