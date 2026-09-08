/**
 * Force-reload every @font-face in the document, bypassing the HTTP cache:
 * rewrite each rule with a cache-busting query on its url(...) so the browser
 * has to fetch the font files again, then wait until the fresh fonts are
 * active. No page reload involved - the swap happens in place.
 *
 * Returns how many @font-face rules were refreshed.
 */
export async function refreshFonts(): Promise<number> {
  const bust = Date.now()
  const rewritten: string[] = []

  for (const sheet of [...document.styleSheets]) {
    let rules: CSSRule[]
    try {
      rules = [...sheet.cssRules]
    } catch {
      continue // cross-origin stylesheet, not readable via CSSOM
    }

    const indices: number[] = []
    rules.forEach((rule, i) => {
      if (!(rule instanceof CSSFontFaceRule)) return
      indices.push(i)
      rewritten.push(
        rule.cssText.replace(/url\((['"]?)([^'")]+)\1\)/g, (_m, q: string, url: string) => {
          const base = url.split('?')[0]
          return `url(${q}${base}?_fontReload=${bust}${q})`
        }),
      )
    })
    if (!indices.length) continue
    // delete from the end so earlier indices stay valid
    for (let i = indices.length - 1; i >= 0; i--) sheet.deleteRule(indices[i])
  }

  // drop stylesheets left over from a previous refresh (their rules were
  // collected and deleted in the loop above); then install the fresh ones
  document.querySelectorAll('style[data-font-reload]').forEach((el) => el.remove())
  if (!rewritten.length) return 0

  const style = document.createElement('style')
  style.setAttribute('data-font-reload', String(bust))
  style.textContent = rewritten.join('\n')
  document.head.appendChild(style)

  await document.fonts.ready
  return rewritten.length
}
