import { kebabize } from './stringUtils'

export const specialLetterReg = /[\s=&#/]/g

export function buildClassName(className: string, textIndex?: number): string {
  const index = textIndex ? textIndex?.toString() : ''
  return className.replace(specialLetterReg, '') + index
}

export function getRightName(tagName: string) {
  return tagName.replace(specialLetterReg, '')
}
