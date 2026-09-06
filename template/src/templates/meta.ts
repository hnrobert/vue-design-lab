/**
 * Canonical size definition per starter format.
 *
 * Physical formats (cards, paper, rollup banners) speak mm at a design DPI;
 * screen formats (social, slides, link cards) speak px and have no DPI.
 * The shipped .vue files are 1:1 with these definitions, so creating a
 * material with the prefilled defaults reproduces the template exactly.
 */
export type TemplateMeta = {
  unit: 'px' | 'mm'
  /** recommended DPI when unit is mm (the file's design DPI) */
  dpi: number
  /** physical size in mm (unit === 'mm' only) */
  mmW?: number
  mmH?: number
}

export const TEMPLATE_META: Record<string, TemplateMeta> = {
  CardBusiness: { unit: 'mm', dpi: 96, mmW: 90, mmH: 54 },
  CardSquare: { unit: 'px', dpi: 96 },
  PosterA4: { unit: 'mm', dpi: 96, mmW: 210, mmH: 297 },
  PosterA5: { unit: 'mm', dpi: 96, mmW: 148, mmH: 210 },
  // large-format inkjet: 72dpi at full size is the trade norm
  PosterRollup: { unit: 'mm', dpi: 72, mmW: 850, mmH: 2000 },
  SlideWide: { unit: 'px', dpi: 96 },
  SocialLandscape: { unit: 'px', dpi: 96 },
  SocialStory: { unit: 'px', dpi: 96 },
}
