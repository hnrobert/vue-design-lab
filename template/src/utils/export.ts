import { toJpeg, toPng } from 'html-to-image'
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

/**
 * Swap every <img> inside the export root to a data URI before rasterizing.
 * html-to-image's own image embedder drops some images deterministically
 * (observed with a plain RGB PNG in this project), while a manual
 * fetch -> blob -> dataURL round-trip works for all of them. The returned
 * restore fn puts the original src attributes back afterwards.
 */
async function inlineImages(root: HTMLElement): Promise<() => void> {
  const imgs = Array.from(root.querySelectorAll('img'))
  const originals: (string | null)[] = []
  await Promise.all(
    imgs.map(async (img, i) => {
      originals[i] = img.getAttribute('src')
      if (!img.src || img.src.startsWith('data:')) return
      try {
        const blob = await (await fetch(img.src)).blob()
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const fr = new FileReader()
          fr.onload = () => resolve(String(fr.result))
          fr.onerror = () => reject(fr.error)
          fr.readAsDataURL(blob)
        })
        img.src = dataUrl
      } catch {
        /* keep the original src when the fetch fails */
      }
    }),
  )
  return () => {
    imgs.forEach((img, i) => {
      const original = originals[i]
      if (original !== null) img.setAttribute('src', original)
    })
  }
}

async function renderPng(w: number, h: number, scale: number): Promise<string> {
  const { el } = findExportRoot()!
  const restore = await inlineImages(el)
  try {
    return await toPng(el, { pixelRatio: scale, width: w, height: h })
  } finally {
    restore()
  }
}

/** JPEG render for the PDF path: jsPDF decodes embedded PNGs to raw RGBA
 *  (a 2x rollup exploded to 208MB), while JPEG embeds stay compressed. */
async function renderJpeg(w: number, h: number, scale: number, quality = 0.92): Promise<string> {
  const { el } = findExportRoot()!
  const restore = await inlineImages(el)
  try {
    return await toJpeg(el, { pixelRatio: scale, width: w, height: h, quality })
  } finally {
    restore()
  }
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

/** Export PDF: page sized from logical dimensions (px/96dpi -> inches);
 *  embeds a JPEG (quality 0.92, visually lossless at 2x = 192dpi) - a PNG
 *  embed would decode to raw RGBA inside jsPDF and explode the file size */
export async function exportPDF(scale = 2): Promise<void> {
  const meta = findExportRoot()
  if (!meta) return
  const url = await renderJpeg(meta.w, meta.h, scale)
  const wIn = meta.w / 96
  const hIn = meta.h / 96
  const pdf = new jsPDF({
    orientation: wIn > hIn ? 'landscape' : 'portrait',
    unit: 'in',
    format: [wIn, hIn],
  })
  pdf.addImage(url, 'JPEG', 0, 0, wIn, hIn)
  pdf.save(`export-${Date.now()}.pdf`)
}

/** Browser print (vector PDF): injects a page-sized @page sized in inches
 *  (universally reliable), plus print-color-adjust: exact to force backgrounds.
 *  base.css hides the workbench UI and resets the pan/zoom transforms. */
export function printPage(): void {
  const meta = findExportRoot()
  if (!meta) return
  document.getElementById('print-page-size')?.remove()
  const style = document.createElement('style')
  style.id = 'print-page-size'
  const wIn = (meta.w / 96).toFixed(4)
  const hIn = (meta.h / 96).toFixed(4)
  style.textContent = `
    @page { size: ${wIn}in ${hIn}in; margin: 0; }
    /* belt-and-suspenders with base.css: Chrome strips backgrounds without this */
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    html, body { margin: 0 !important; padding: 0 !important; }
  `
  document.head.appendChild(style)
  window.print()
  // cleanup after the dialog closes so the @page does not affect screen styles
  const cleanup = () => {
    style.remove()
    window.removeEventListener('afterprint', cleanup)
  }
  window.addEventListener('afterprint', cleanup)
  // Safari does not fire afterprint — also remove on a timer
  setTimeout(() => style.remove(), 60_000)
}
