import { toPng } from 'html-to-image'
import { jsPDF } from 'jspdf'

/** Self-declared by the page root element: data-export + data-export-w/h (px) */
export function findExportRoot(): { el: HTMLElement; w: number; h: number } | null {
  const el = document.querySelector<HTMLElement>('[data-export]')
  if (!el) return null
  const w = Number(el.dataset.exportW)
  const h = Number(el.dataset.exportH)
  if (!w || !h) return null
  return { el, w, h }
}

async function renderPng(w: number, h: number, scale: number): Promise<string> {
  const { el } = findExportRoot()!
  return toPng(el, { pixelRatio: scale, width: w, height: h })
}

function triggerDownload(url: string, filename: string) {
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
}

/** Export PNG (scale=2 is ~192 DPI; pass 3-4 for sharper output) */
export async function exportPNG(scale = 2): Promise<void> {
  const meta = findExportRoot()
  if (!meta) return
  const url = await renderPng(meta.w, meta.h, scale)
  triggerDownload(url, `export-${Date.now()}.png`)
}

/** Export PDF: page sized from logical dimensions (px/96dpi -> inches), raster image embedded */
export async function exportPDF(scale = 2): Promise<void> {
  const meta = findExportRoot()
  if (!meta) return
  const url = await renderPng(meta.w, meta.h, scale)
  const wIn = meta.w / 96
  const hIn = meta.h / 96
  const pdf = new jsPDF({
    orientation: wIn > hIn ? 'landscape' : 'portrait',
    unit: 'in',
    format: [wIn, hIn],
  })
  pdf.addImage(url, 'PNG', 0, 0, wIn, hIn)
  pdf.save(`export-${Date.now()}.pdf`)
}

/** Browser print: injects a page-sized @page; base.css hides the workbench UI when printing */
export function printPage(): void {
  const meta = findExportRoot()
  if (!meta) return
  document.getElementById('print-page-size')?.remove()
  const style = document.createElement('style')
  style.id = 'print-page-size'
  style.textContent = `@page { size: ${meta.w}px ${meta.h}px; margin: 0; }`
  document.head.appendChild(style)
  window.print()
}
