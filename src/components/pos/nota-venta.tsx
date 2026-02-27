"use client"

import { Printer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

export type VentaConDetalles = {
  id: number
  fecha: string
  cliente: {
    nombre: string
    apPaterno: string
    apMaterno?: string | null
  }
  usuario: { usuario: string }
  tipoPago: { tipoMetodo: string }
  subtotal: number | string
  total: number | string
  detalles: Array<{
    id: number
    cantidad: number
    precio: number | string
    subtotal: number | string
    producto: {
      nombreProducto: string
      talla: string
      color: string
    }
  }>
}

const METODO_LABEL: Record<string, string> = {
  EFECTIVO: "Efectivo",
  TARJETA: "Tarjeta",
  QR: "QR",
}

function buildPrintHTML(venta: VentaConDetalles): string {
  const fecha = new Date(venta.fecha)
  const fechaStr = fecha.toLocaleDateString("es-BO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
  const horaStr = fecha.toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit" })
  const clienteNombre = [venta.cliente.nombre, venta.cliente.apPaterno, venta.cliente.apMaterno]
    .filter(Boolean)
    .join(" ")

  const itemsHTML = venta.detalles
    .map(
      (d) => `
      <tr>
        <td style="padding:2px 4px">${d.producto.nombreProducto} T:${d.producto.talla} ${d.producto.color}</td>
        <td style="text-align:center;padding:2px 4px">${d.cantidad}</td>
        <td style="text-align:right;padding:2px 4px">Bs.${Number(d.precio).toFixed(2)}</td>
        <td style="text-align:right;padding:2px 4px">Bs.${Number(d.subtotal).toFixed(2)}</td>
      </tr>`
    )
    .join("")

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Nota de Venta #${venta.id}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Courier New', monospace; font-size: 11px; padding: 16px; max-width: 300px; margin: 0 auto; }
    .center { text-align: center; }
    .bold { font-weight: bold; }
    .separator { border-top: 1px dashed #000; margin: 6px 0; }
    .row { display: flex; justify-content: space-between; margin: 2px 0; }
    table { width: 100%; border-collapse: collapse; }
    thead tr { border-bottom: 1px dashed #000; }
    th { text-align: left; padding: 2px 4px; font-size: 10px; }
    th:not(:first-child) { text-align: right; }
    td { font-size: 10px; vertical-align: top; }
    .total-row { font-size: 13px; font-weight: bold; }
  </style>
</head>
<body>
  <div class="center bold" style="font-size:15px;margin-bottom:2px">CambaClothes</div>
  <div class="center" style="font-size:11px;margin-bottom:8px">Nota de Venta</div>
  <div class="separator"></div>
  <div class="row"><span>Nro. Venta:</span><span class="bold">#${venta.id}</span></div>
  <div class="row"><span>Fecha:</span><span>${fechaStr} ${horaStr}</span></div>
  <div class="row"><span>Vendedor:</span><span>${venta.usuario.usuario}</span></div>
  <div class="row"><span>Cliente:</span><span>${clienteNombre}</span></div>
  <div class="separator"></div>
  <table>
    <thead>
      <tr>
        <th>Producto</th>
        <th style="text-align:center">Cant</th>
        <th style="text-align:right">P.Unit</th>
        <th style="text-align:right">Subtotal</th>
      </tr>
    </thead>
    <tbody>
      ${itemsHTML}
    </tbody>
  </table>
  <div class="separator"></div>
  <div class="row"><span>Subtotal:</span><span>Bs. ${Number(venta.subtotal).toFixed(2)}</span></div>
  <div class="row total-row"><span>TOTAL:</span><span>Bs. ${Number(venta.total).toFixed(2)}</span></div>
  <div class="row"><span>Método de pago:</span><span>${METODO_LABEL[venta.tipoPago.tipoMetodo] ?? venta.tipoPago.tipoMetodo}</span></div>
  <div class="separator"></div>
  <div class="center" style="margin-top:10px;font-size:11px">¡Gracias por su compra!</div>
  <script>window.onload = function(){ window.print(); window.close(); }</script>
</body>
</html>`
}

type Props = {
  venta: VentaConDetalles
  onClose: () => void
}

export default function NotaVenta({ venta, onClose }: Props) {
  const fecha = new Date(venta.fecha)
  const fechaStr = fecha.toLocaleDateString("es-BO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
  const horaStr = fecha.toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit" })

  const clienteNombre = [venta.cliente.nombre, venta.cliente.apPaterno, venta.cliente.apMaterno]
    .filter(Boolean)
    .join(" ")

  function handlePrint() {
    const w = window.open("", "_blank", "width=420,height=680")
    if (!w) return
    w.document.write(buildPrintHTML(venta))
    w.document.close()
  }

  return (
    <div>
      {/* Receipt preview */}
      <div className="font-mono text-xs border rounded-lg p-4 bg-muted/40 space-y-2 max-h-[55vh] overflow-y-auto">
        <div className="text-center">
          <p className="font-bold text-sm">CambaClothes</p>
          <p className="text-muted-foreground">Nota de Venta</p>
        </div>

        <Separator />

        <div className="space-y-0.5">
          <div className="flex justify-between">
            <span>Nro. Venta:</span>
            <span className="font-bold">#{venta.id}</span>
          </div>
          <div className="flex justify-between">
            <span>Fecha:</span>
            <span>
              {fechaStr} {horaStr}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Vendedor:</span>
            <span>{venta.usuario.usuario}</span>
          </div>
          <div className="flex justify-between">
            <span>Cliente:</span>
            <span className="text-right ml-2">{clienteNombre}</span>
          </div>
        </div>

        <Separator />

        {/* Items table */}
        <div>
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-2 font-bold border-b pb-0.5 mb-1">
            <span>Producto</span>
            <span className="text-center">Cant</span>
            <span className="text-right">P.Unit</span>
            <span className="text-right">Subtotal</span>
          </div>
          {venta.detalles.map((d) => (
            <div
              key={d.id}
              className="grid grid-cols-[1fr_auto_auto_auto] gap-x-2 py-0.5"
            >
              <span className="truncate">
                {d.producto.nombreProducto} T:{d.producto.talla}
              </span>
              <span className="text-center">{d.cantidad}</span>
              <span className="text-right">Bs.{Number(d.precio).toFixed(2)}</span>
              <span className="text-right">Bs.{Number(d.subtotal).toFixed(2)}</span>
            </div>
          ))}
        </div>

        <Separator />

        <div className="space-y-0.5">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>Bs. {Number(venta.subtotal).toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-sm">
            <span>TOTAL:</span>
            <span>Bs. {Number(venta.total).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Método de pago:</span>
            <span>{METODO_LABEL[venta.tipoPago.tipoMetodo] ?? venta.tipoPago.tipoMetodo}</span>
          </div>
        </div>

        <Separator />
        <p className="text-center text-muted-foreground">¡Gracias por su compra!</p>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 mt-4">
        <Button variant="outline" className="flex-1" onClick={onClose}>
          Cerrar
        </Button>
        <Button className="flex-1" onClick={handlePrint}>
          <Printer className="h-4 w-4 mr-2" />
          Imprimir
        </Button>
      </div>
    </div>
  )
}
