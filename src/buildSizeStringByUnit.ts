export type UnitType = 'px' | 'rem' | 'remAs10px'

export function buildSizeStringByUnit(pixelValue: number, type: UnitType): string {
  pixelValue = Number(pixelValue.toFixed(0))
  try {
    if (type === 'px') {
      return pixelValue + 'px'
    }
    if (type === 'rem') {
      return pixelValue / 16 + 'rem'
    }
    return pixelValue / 10 + 'rem'
  } catch (e) {
    return '0px'
  }
}
