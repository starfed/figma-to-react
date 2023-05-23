import { kebabize } from './stringUtils'

export function buildClassName(className: string, textIndex?: number): string {
  const index = textIndex ? textIndex?.toString() : ''
  return className.replace(/\s/g, '') + index
}
