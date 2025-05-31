import { NextResponse } from 'next/server'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

export async function POST(request: Request) {
  try {
    const data = await request.json()

    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([595.276, 841.890]) // Tamaño A4
    const { width, height } = page.getSize()

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    // Función helper para formato de moneda
    const formatCurrency = (amount: number) =>
      amount.toLocaleString('es-DO', { style: 'currency', currency: 'DOP' })

    // Colores
    const primary = rgb(0.2, 0.4, 0.8)
    const secondary = rgb(0.5, 0.5, 0.5)

    // Encabezado
    page.drawRectangle({
      x: 0,
      y: height - 100,
      width: width,
      height: 100,
      color: primary,
    })

    page.drawText('COTIZACIÓN', {
      x: 50,
      y: height - 60,
      size: 30,
      font: boldFont,
      color: rgb(1, 1, 1),
    })

    // Información del proyecto
    let yPos = height - 140
    const drawInfo = (label: string, value: string, y: number) => {
      page.drawText(label, {
        x: 50,
        y,
        size: 10,
        font: boldFont,
        color: secondary,
      })
      page.drawText(value, {
        x: 150,
        y,
        size: 10,
        font,
        color: rgb(0, 0, 0),
      })
    }

    drawInfo('PROYECTO:', data.nombreProyecto, yPos)
    drawInfo('CLIENTE:', data.clienteNombre || 'N/A', yPos - 20)
    drawInfo('FECHA:', new Date().toLocaleDateString(), yPos - 40)

    // Tabla de items
    yPos -= 80

    // Encabezados de tabla
    const headers = [
      { text: 'DESCRIPCIÓN', x: 50, width: 200 },
      { text: 'CANTIDAD', x: 270, width: 80 },
      { text: 'PRECIO UNIT.', x: 370, width: 100 },
      { text: 'TOTAL', x: 480, width: 100 }
    ]

    // Dibujar encabezados
    page.drawRectangle({
      x: 40,
      y: yPos - 15,
      width: width - 80,
      height: 25,
      color: rgb(0.95, 0.95, 0.95),
    })

    headers.forEach(header => {
      page.drawText(header.text, {
        x: header.x,
        y: yPos,
        size: 8,
        font: boldFont,
        color: primary,
      })
    })

    // Items
    yPos -= 40
    data.items.forEach((item: any) => {
      const total = item.precioUnitario.valor * item.cantidad

      page.drawText(item.descripcion, {
        x: 50,
        y: yPos,
        size: 9,
        font,
        maxWidth: 200,
      })

      page.drawText(item.cantidad.toString(), {
        x: 270,
        y: yPos,
        size: 9,
        font,
      })

      page.drawText(formatCurrency(item.precioUnitario.valor), {
        x: 370,
        y: yPos,
        size: 9,
        font,
      })

      page.drawText(formatCurrency(total), {
        x: 480,
        y: yPos,
        size: 9,
        font,
      })

      yPos -= 20
    })

    // Resumen financiero
    const boxY = 200
    page.drawRectangle({
      x: 40,
      y: boxY,
      width: width - 80,
      height: 160,
      color: rgb(0.97, 0.97, 1),
      borderColor: primary,
      borderWidth: 1,
    })

    let summaryY = boxY + 130
    const financialSummary = [
      { label: 'Costo Total:', value: formatCurrency(data.costoTotal) },
      { label: 'Precio de Venta:', value: formatCurrency(data.precioFinal) },
      { label: 'Margen de Ganancia:', value: `${data.margenGanancia}%` },
      { label: 'Comisión:', value: `${data.porcentajeComision}% (${formatCurrency(data.precioFinal * data.porcentajeComision / 100)})` },
      { label: 'Costo Real:', value: formatCurrency(data.costoTotal) },
      { label: 'Ganancia Real:', value: formatCurrency(data.precioFinal - data.costoTotal) },
      //{ label: 'PRECIO FINAL:', value: formatCurrency(data.precioFinal) },
    ]

    financialSummary.forEach((item, index) => {
      const isLast = index === financialSummary.length - 1

      page.drawText(item.label, {
        x: 60,
        y: summaryY,
        size: isLast ? 12 : 10,
        font: isLast ? boldFont : font,
        color: isLast ? primary : secondary,
      })

      page.drawText(item.value, {
        x: 450,
        y: summaryY,
        size: isLast ? 12 : 10,
        font: isLast ? boldFont : font,
        color: isLast ? primary : rgb(0, 0, 0),
      })

      summaryY -= 20
    })

    // Nota al pie
    if (data.nota) {
      page.drawText('Nota:', {
        x: 50,
        y: 100,
        size: 10,
        font: boldFont,
        color: secondary,
      })

      page.drawText(data.nota, {
        x: 50,
        y: 80,
        size: 9,
        font,
        color: rgb(0, 0, 0),
        maxWidth: width - 100,
      })
    }

    const pdfBytes = await pdfDoc.save()

    return new NextResponse(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename=cotizacion.pdf',
      },
    })

  } catch (error) {
    console.error('Error generando PDF:', error)
    return NextResponse.json({ error: 'Error generando PDF' }, { status: 500 })
  }
}
