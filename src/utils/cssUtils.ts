import { kebabize } from './stringUtils'

export const specialLetterReg = /[\s\-+\\=&#,./]/g

export function buildClassName(className: string, textIndex?: number): string {
  const index = textIndex ? textIndex?.toString() : ''
  return className.replace(specialLetterReg, '') + index
}

export function getRightName(tagName: string) {
  return tagName.replace(specialLetterReg, '')
}

export function getPageWidth(width: number) {
  width = Math.round(Number(width))

  if (width < 980) {
    return 980
  } else if (width > 1920) {
    return 1920
  } else {
    return width
  }
}
