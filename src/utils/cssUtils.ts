import { kebabize } from './stringUtils'

export const specialLetterReg = /[^a-zA-Z0-9]/g
const startWithNumber = (s: string) => {
  return ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(s[0])
}
export function buildClassName(className: string, textIndex?: number): string {
  const index = textIndex ? textIndex?.toString() : ''
  if (startWithNumber(className)) className = 's' + className
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
