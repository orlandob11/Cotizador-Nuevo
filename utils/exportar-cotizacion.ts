import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import type { Item, PrecioConFormula } from "@/types/cotizaciones"

// Utility functions
const formatearPrecioDOP = (precio: number) => {
  return new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP" }).format(precio)
}

const convertirAPiesCuadrados = (ancho: number, alto: number, unidad: string): number => {
  \
  const factorConversion: Record<string, number } = {
    pulgadas: 1 / 144,
    pies: 1,
    centimetros: 1 / 929.0304,
    metros: 10.7639,
}
return ancho * alto * factorConversion[unidad]
}

// Función para calcular el costo de un ítem
export const calcularCostoItem = (item: Item, usarCostoReal = false): number => {
  if (usarCostoReal && item.costoReal !== undefined) {
    return item.costoReal
  }

  // Para ítems de impresión, usar costoPorPie * área * cantidad
  if (item.mostrarExtendido && item.extendido) {
    const { ancho, alto, unidadMedida, costoPorPie } = item.extendido
    if (ancho !== null && alto !== null && costoPorPie !== null) {
      const areaPiesCuadrados = convertirAPiesCuadrados(ancho, alto, unidadMedida)
      return areaPiesCuadrados * costoPorPie * item.cantidad
    }
  }

  // Para ítems regulares, usar precio unitario como costo
  return (item.precioUnitario.valor ?? 0) * item.cantidad
}

// Función para calcular el precio de un ítem
export const calcularPrecioItem = (item: Item): number => {
  if (item.mostrarExtendido && item.extendido && item.areaPiesCuadrados) {
    return (item.precioUnitario.valor ?? 0) * item.areaPiesCuadrados * item.cantidad
  }
  return (item.precioUnitario.valor ?? 0) * item.cantidad
}

// Interfaz para los parámetros de exportación
interface ExportarCotizacionParams {
  items: Item[]
  precioFinal: PrecioConFormula
  margenGanancia: number
  porcentajeComision: number
  nombreProyecto: string
  clienteNombre: string
  nota: string
  formato: "pdf" | "json"
}

// Función principal de exportación
export const exportarCotizacion = ({
  items,
  precioFinal,
  margenGanancia,
  porcentajeComision,
  nombreProyecto,
  clienteNombre,
  nota,
  formato,
}: ExportarCotizacionParams) => {
  // Cálculos comunes
  const costoTotal = items.reduce((total, item) => total + calcularCostoItem(item, false), 0)
  const costoTotalReal = items.reduce((total, item) => total + calcularCostoItem(item, true), 0)
  const precioVentaTotal = items.reduce((total, item) => total + calcularPrecioItem(item), 0)
  const comision = ((precioFinal.valor ?? precioVentaTotal) * porcentajeComision) / 100
  const margenGananciaReal = precioFinal.valor ? ((precioFinal.valor - costoTotal) / precioFinal.valor) * 100 : 0
  const gananciaPostComision = (precioFinal.valor ?? 0) - costoTotal - comision

  // Calcular precio venta sugerido
  const costoTotalNoImpresion = items
    .filter((item) => !item.esImpresion)
    .reduce((total, item) => total + calcularCostoItem(item, false), 0)

  const precioItemsImpresion = items
    .filter((item) => item.esImpresion)
    .reduce((total, item) => total + calcularPrecioItem(item), 0)

  const precioItemsNoImpresion = costoTotalNoImpresion / (1 - margenGanancia / 100)
  const precioVentaSugerido = precioItemsNoImpresion + precioItemsImpresion

  // Calcular la ganancia real basada en el costo real
  const gananciaReal = (precioFinal.valor ?? 0) - costoTotalReal - comision
  const margenGananciaRealConCostoReal = precioFinal.valor
    ? ((precioFinal.valor - costoTotalReal) / precioFinal.valor) * 100
    : 0

  // Calcular diferencia entre costo estimado y real
  const diferenciaCosto = costoTotal - costoTotalReal
  const esCostoMenor = diferenciaCosto > 0

  // Datos comunes para ambos formatos
  const cotizacion = {
    tipo: "general",
    items,
    costoTotal,
    costoTotalReal,
    precioVentaSugerido,
    precioFinal,
    margenGanancia: margenGananciaReal,
    porcentajeComision,
    comision,
    gananciaPostComision,
    gananciaReal,
    diferenciaCosto,
    nombreProyecto,
    cliente: clienteNombre,
    nota,
    fechaCreacion: new Date().toISOString().split("T")[0],
  }

  if (formato === "pdf") {
    // Crear PDF
    const doc = new jsPDF()

    // Título
    doc.setFontSize(20)
    doc.text(`Resumen de Calculos Cotización: ${nombreProyecto || "Sin nombre"}`, 14, 22)

    // Información del cliente
    doc.setFontSize(12)
    doc.text(`Cliente: ${clienteNombre || "N/A"}`, 14, 32)
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, 38)

    // Tabla de ítems
    doc.setFontSize(14)
    doc.text("Ítems", 14, 48)

    autoTable(doc, {
      startY: 50,
      head: [["Descripción", "Categoría", "Cantidad", "Precio Unitario", "Subtotal", "Subtotal (Real)"]],
      body: items.map((item) => [
        item.descripcion,
        item.categoria || "Sin categoría",
        item.cantidad.toString(),
        formatearPrecioDOP(item.precioUnitario.valor ?? 0),
        formatearPrecioDOP(calcularPrecioItem(item)),
        formatearPrecioDOP(calcularCostoItem(item, true)),
      ]),
    })

    // Resumen financiero
    const finalY = (doc as any).lastAutoTable.finalY + 10
    doc.setFontSize(14)
    doc.text("Resumen Financiero", 14, finalY)

    autoTable(doc, {
      startY: finalY + 2,
      head: [["Concepto", "Valor"]],
      body: [
        ["Costo Total (Estimado)", formatearPrecioDOP(costoTotal)],
        ["Costo Total (Real)", formatearPrecioDOP(costoTotalReal)],
        ["Precio Sugerido", formatearPrecioDOP(precioVentaSugerido)],
        ["Precio Final", formatearPrecioDOP(precioFinal.valor ?? 0)],
        ["Margen de Ganancia (Estimado)", `${margenGananciaReal.toFixed(2)}%`],
        ["Margen de Ganancia (Real)", `${margenGananciaRealConCostoReal.toFixed(2)}%`],
        ["Comisión", formatearPrecioDOP(comision)],
        ["Ganancia Final (Estimada)", formatearPrecioDOP(gananciaPostComision)],
        ["Ganancia Final (Real)", formatearPrecioDOP(gananciaReal)],
      ],
    })

    // Notas y Resumen del Proyecto
    const notaY = (doc as any).lastAutoTable.finalY + 10
    doc.setFontSize(14)
    doc.text("Notas y Resumen del Proyecto", 14, notaY)

    // Notas del usuario
    let currentY = notaY + 8
    if (nota) {
      doc.setFontSize(12)
      doc.text("Notas del cliente:", 14, currentY)
      currentY += 6

      // Dividir las notas en líneas para evitar que se salgan del margen
      const notaLines = doc.splitTextToSize(nota, 180)
      doc.text(notaLines, 14, currentY)
      currentY += notaLines.length * 6 + 8
    }

    // Resumen automático del proyecto
    doc.setFontSize(10)
    doc.text("Resumen del Proyecto:", 14, currentY)
    currentY += 6

    // Crear el resumen automático
    const resumenProyecto = [
      `El proyecto "${nombreProyecto || "Sin nombre"}" para el cliente "${clienteNombre || "N/A"}" ha sido completado con los siguientes resultados financieros:`,
      "",
      `• Ganancia real obtenida: ${formatearPrecioDOP(gananciaReal)}`,
      `• Margen de ganancia real: ${margenGananciaRealConCostoReal.toFixed(2)}%`,
    ]

    // Agregar información sobre la diferencia entre costo estimado y real
    if (Math.abs(diferenciaCosto) > 0.01) {
      if (esCostoMenor) {
        resumenProyecto.push(
          `• Se logró un ahorro de ${formatearPrecioDOP(Math.abs(diferenciaCosto))} respecto al costo estimado.`,
        )
        resumenProyecto.push(
          `• Esto representa un ${((Math.abs(diferenciaCosto) / costoTotal) * 100).toFixed(2)}% de ahorro en costos.`,
        )
      } else {
        resumenProyecto.push(`• El costo real superó al estimado en ${formatearPrecioDOP(Math.abs(diferenciaCosto))}.`)
        resumenProyecto.push(
          `• Esto representa un ${((Math.abs(diferenciaCosto) / costoTotal) * 100).toFixed(2)}% de incremento en costos.`,
        )
      }
    } else {
      resumenProyecto.push(`• El costo real fue muy similar al estimado, con una diferencia mínima.`)
    }

    // Agregar proyección o recomendación
    resumenProyecto.push("")
    if (gananciaReal > 0) {
      if (margenGananciaRealConCostoReal > 30) {
        resumenProyecto.push(
          `Proyección: Este proyecto ha sido altamente rentable con un margen superior al 30%. Se recomienda mantener esta estructura de costos y precios para futuros proyectos similares.`,
        )
      } else if (margenGananciaRealConCostoReal > 15) {
        resumenProyecto.push(
          `Proyección: El proyecto ha tenido una rentabilidad aceptable. Para futuros proyectos similares, se podría considerar optimizar algunos costos para mejorar el margen.`,
        )
      } else {
        resumenProyecto.push(
          `Proyección: Aunque el proyecto ha generado ganancia, el margen es bajo. Se recomienda revisar la estructura de costos o aumentar los precios en futuros proyectos similares.`,
        )
      }
    } else {
      resumenProyecto.push(
        `Proyección: Este proyecto ha resultado en pérdida. Es crucial revisar la estructura de costos y precios para evitar situaciones similares en el futuro.`,
      )
    }

    // Agregar el resumen al PDF
    const resumenLines = doc.splitTextToSize(resumenProyecto.join("\n"), 180)
    doc.text(resumenLines, 14, currentY)

    // Guardar PDF
    doc.save(`cotizacion_${nombreProyecto || "sin_nombre"}.pdf`)
  } else {
    // Exportar como JSON
    const contenido = JSON.stringify(cotizacion, null, 2)
    const tipo = "application/json"
    const extension = "json"

    const blob = new Blob([contenido], { type: tipo })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `cotizacion_${nombreProyecto || "sin_nombre"}.${extension}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
}
