import { buildSizeStringByUnit, UnitType } from './buildSizeStringByUnit'
import { isImageNode } from './utils/isImageNode'

import { decomposeTSR } from 'transformation-matrix'
export type CSSData = {
  className: string
  properties: {
    name: string
    value: string | number
  }[]
}

export class TextCount {
  count = 1
  constructor() {
    return
  }

  increment() {
    this.count++
  }
}

const justifyContentCssValues = {
  MIN: 'flex-start',
  MAX: 'flex-end',
  CENTER: 'center',
  SPACE_BETWEEN: 'space-between'
}

const alignItemsCssValues = {
  MIN: 'flex-start',
  MAX: 'flex-end',
  CENTER: 'center',
  BASELINE: 'flex-base'
}

const textAlignCssValues = {
  LEFT: 'left',
  RIGHT: 'right',
  CENTER: 'center',
  JUSTIFIED: 'justify'
}

const textVerticalAlignCssValues = {
  TOP: 'top',
  CENTER: 'middle',
  BOTTOM: 'bottom'
}

const textDecorationCssValues = {
  UNDERLINE: 'underline',
  STRIKETHROUGH: 'line-through'
}

const isFrameNoAutoLayout = (node: SceneNode) => {
  return node.type === 'FRAME' && node.layoutMode === 'NONE'
}

const isAbsoluteNode = (node: SceneNode) => {
  let result = false
  if (node.visible) {
    if ('layoutPositioning' in node && node.layoutPositioning === 'ABSOLUTE') {
      result = true
    } else if (node.parent && isFrameNoAutoLayout(node.parent as SceneNode)) {
      result = true
    }
  }
  return result
}

function childrenHasAbsolute(p: SceneNode) {
  if ('children' in p) {
    const children = p.children
    if (Array.isArray(children) && children.length > 0) {
      return children.filter((v) => isAbsoluteNode(v)).length > 0
    }
  }
  return false
}

export function getCssDataForTag(node: SceneNode, unitType: UnitType, textCount: TextCount, level: number, childrenIndex: number): CSSData {
  const properties: CSSData['properties'] = []
  const root = level === 0
  // absolute positon
  if (!root && isAbsoluteNode(node)) {
    properties.push({ name: 'position', value: 'absolute' })
    properties.push({ name: 'left', value: node.x + 'px' })
    properties.push({ name: 'top', value: node.y + 'px' })
  } else if (childrenHasAbsolute(node)) {
    properties.push({ name: 'position', value: 'relative' })
  }
  // skip vector since it's often displayed as an img tag
  if (node.visible && node.type !== 'VECTOR') {
    if ('opacity' in node && (node?.opacity || 1) < 1) {
      properties.push({ name: 'opacity', value: node.opacity || 1 })
    }
    if ('rotation' in node && node.rotation !== 0) {
      properties.push({ name: 'transform', value: `rotate(${Math.floor(node.rotation)}deg)` })
    }

    if (node.type === 'FRAME' || node.type === 'INSTANCE' || node.type === 'COMPONENT') {
      const borderRadiusValue = getBorderRadiusString(node, unitType)
      if (borderRadiusValue) {
        properties.push({ name: 'border-radius', value: borderRadiusValue })
      }

      if (node.layoutMode !== 'NONE') {
        properties.push({ name: 'display', value: 'flex' })
        properties.push({ name: 'flex-direction', value: node.layoutMode === 'HORIZONTAL' ? 'row' : 'column' })
        properties.push({ name: 'justify-content', value: justifyContentCssValues[node.primaryAxisAlignItems] })
        properties.push({ name: 'align-items', value: alignItemsCssValues[node.counterAxisAlignItems] })
        if (node.layoutGrow) {
          properties.push({ name: 'flex-grow', value: node.layoutGrow })
        }
        const mainKey = node.layoutMode === 'HORIZONTAL' ? 'width' : 'height'
        const subKey = mainKey === 'width' ? 'height' : 'width'
        if (node.primaryAxisSizingMode === 'FIXED') {
          properties.push({ name: mainKey, value: Math.floor(node[mainKey]) + 'px' })
        }

        if (node.counterAxisSizingMode === 'FIXED') {
          properties.push({ name: subKey, value: Math.floor(node[subKey]) + 'px' })
        }
        if (node.paddingTop === node.paddingBottom && node.paddingTop === node.paddingLeft && node.paddingTop === node.paddingRight) {
          if (node.paddingTop > 0) {
            properties.push({ name: 'padding', value: `${buildSizeStringByUnit(node.paddingTop, unitType)}` })
          }
        } else if (node.paddingTop === node.paddingBottom && node.paddingLeft === node.paddingRight) {
          properties.push({ name: 'padding', value: `${buildSizeStringByUnit(node.paddingTop, unitType)} ${buildSizeStringByUnit(node.paddingLeft, unitType)}` })
        } else {
          properties.push({
            name: 'padding',
            value: `${buildSizeStringByUnit(node.paddingTop, unitType)} ${buildSizeStringByUnit(node.paddingRight, unitType)} ${buildSizeStringByUnit(
              node.paddingBottom,
              unitType
            )} ${buildSizeStringByUnit(node.paddingLeft, unitType)}`
          })
        }

        if (node.primaryAxisAlignItems !== 'SPACE_BETWEEN' && node.itemSpacing > 0) {
          properties.push({ name: 'gap', value: buildSizeStringByUnit(node.itemSpacing, unitType) })
        }
      } else {
        properties.push({ name: 'height', value: Math.floor(node.height) + 'px' })
        properties.push({ name: 'width', value: Math.floor(node.width) + 'px' })
      }

      if ((node.fills as Paint[]).length > 0 && (node.fills as Paint[])[0].type !== 'IMAGE') {
        const paint = (node.fills as Paint[])[0]
        const value = buildColorString(paint)
        const name = value.includes('linear-gradient') ? 'background' : 'background-color'
        if (paint.visible) properties.push({ name, value })
      }

      if ((node.strokes as Paint[]).length > 0) {
        const paint = (node.strokes as Paint[])[0]
        properties.push({
          name: 'border',
          value: `${buildSizeStringByUnit(typeof node.strokeWeight === 'number' ? node.strokeWeight : 0, unitType)} solid ${buildColorString(paint)}`
        })
      }
    }

    if (node.type === 'RECTANGLE') {
      const borderRadiusValue = getBorderRadiusString(node, unitType)
      if (borderRadiusValue) {
        properties.push({ name: 'border-radius', value: borderRadiusValue })
      }

      properties.push({ name: 'height', value: Math.floor(node.height) + 'px' })
      properties.push({ name: 'width', value: Math.floor(node.width) + 'px' })

      if ((node.fills as Paint[]).length > 0 && (node.fills as Paint[])[0].type !== 'IMAGE') {
        const paint = (node.fills as Paint[])[0]
        properties.push({ name: 'background-color', value: buildColorString(paint) })
      }

      if ((node.strokes as Paint[]).length > 0) {
        const paint = (node.strokes as Paint[])[0]
        properties.push({
          name: 'border',
          value: `${buildSizeStringByUnit(typeof node.strokeWeight === 'number' ? node.strokeWeight : 0, unitType)} solid ${buildColorString(paint)}`
        })
      }
    }

    if (node.type === 'TEXT') {
      properties.push({ name: 'text-align', value: textAlignCssValues[node.textAlignHorizontal] })
      properties.push({ name: 'vertical-align', value: textVerticalAlignCssValues[node.textAlignVertical] })
      properties.push({ name: 'font-size', value: `${node.fontSize as number}px` })
      properties.push({ name: 'font-family', value: (node.fontName as FontName).family })

      const letterSpacing = node.letterSpacing as LetterSpacing
      if (letterSpacing.value !== 0) {
        properties.push({ name: 'letter-spacing', value: letterSpacing.unit === 'PIXELS' ? buildSizeStringByUnit(letterSpacing.value, unitType) : letterSpacing.value + '%' })
      }

      type LineHeightWithValue = {
        readonly value: number
        readonly unit: 'PIXELS' | 'PERCENT'
      }

      properties.push({
        name: 'line-height',
        value:
          (node.lineHeight as LineHeight).unit === 'AUTO'
            ? 'auto'
            : (node.lineHeight as LetterSpacing).unit === 'PIXELS'
            ? buildSizeStringByUnit((node.lineHeight as LineHeightWithValue).value, unitType)
            : (node.lineHeight as LineHeightWithValue).value.toFixed(0) + '%'
      })

      if (node.textDecoration === 'STRIKETHROUGH' || node.textDecoration === 'UNDERLINE') {
        properties.push({ name: 'text-decoration', value: textDecorationCssValues[node.textDecoration] })
      }
      if ((node.fills as Paint[]).length > 0) {
        const paint = (node.fills as Paint[])[0]
        properties.push({ name: 'color', value: buildColorString(paint) })
      }
    }

    if (node.type === 'LINE') {
      properties.push({ name: 'height', value: Math.floor(node.height) + 'px' })
      properties.push({ name: 'width', value: Math.floor(node.width) + 'px' })

      if ((node.strokes as Paint[]).length > 0) {
        const paint = (node.strokes as Paint[])[0]
        properties.push({
          name: 'border',
          value: `${buildSizeStringByUnit(typeof node.strokeWeight === 'number' ? node.strokeWeight : 0, unitType)} solid ${buildColorString(paint)}`
        })
      }
    }

    if (node.type === 'GROUP' || node.type === 'ELLIPSE' || node.type === 'POLYGON' || node.type === 'STAR') {
      properties.push({ name: 'height', value: Math.floor(node.height) + 'px' })
      properties.push({ name: 'width', value: Math.floor(node.width) + 'px' })
    }
  }

  if (properties.length > 0) {
    let className = node.name + level + childrenIndex

    if (isImageNode(node)) {
      properties.push({ name: 'background-image', value: `url(https://via.placeholder.com/${node.width.toFixed(0)}x${node.height.toFixed(0)})` })
      properties.push({ name: 'background-size', value: 'cover' })
      className = node.parent?.name + 'img' + textCount.count
      textCount.increment()
    }

    if (node.type === 'TEXT') {
      className = 'text' + textCount.count
      textCount.increment()
    }
    return {
      // name Text node as "Text" since name of text node is often the content of the node and is not appropriate as a name
      className,
      properties
    }
  }

  return { className: '', properties: [] }
}

function getBorderRadiusString(node: FrameNode | RectangleNode | ComponentNode | InstanceNode, unitType: UnitType) {
  if (node.cornerRadius !== 0) {
    if (typeof node.cornerRadius !== 'number') {
      return `${buildSizeStringByUnit(node.topLeftRadius, unitType)} ${buildSizeStringByUnit(node.topRightRadius, unitType)} ${buildSizeStringByUnit(
        node.bottomRightRadius,
        unitType
      )} ${buildSizeStringByUnit(node.bottomLeftRadius, unitType)}`
    }
    return `${buildSizeStringByUnit(node.cornerRadius, unitType)}`
  }
  return null
}

function rgbValueToHex(value: number) {
  return Math.floor(value * 255)
    .toString(16)
    .padStart(2, '0')
}

const getMatrix = (a: any) => {
  return {
    a: a[0],
    b: a[1],
    c: a[2],
    d: a[3],
    e: a[4],
    f: a[5]
  }
}

function figmaGradientToCSS(gradient: any) {
  const stops = gradient.gradientStops.map((stop: any) => {
    const { r, g, b, a } = stop.color
    const position = stop.position * 100
    return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a}) ${position}%`
  })

  const txf0 = gradient.gradientTransform[0]
  const txf1 = gradient.gradientTransform[1]

  const origin = decomposeTSR(getMatrix([...txf0, ...txf1]), true, true)
  console.log(origin)
  const angle = (origin.rotation.angle / Math.PI) * 180 - 90

  return `linear-gradient(${angle}deg, ${stops.join(', ')})`
}

function buildColorString(paint: Paint) {
  if (paint.type === 'SOLID') {
    if (paint.opacity !== undefined && paint.opacity < 1) {
      return `rgba(${Math.floor(paint.color.r * 255)}, ${Math.floor(paint.color.g * 255)}, ${Math.floor(paint.color.b * 255)}, ${paint.opacity})`
    }
    return `#${rgbValueToHex(paint.color.r)}${rgbValueToHex(paint.color.g)}${rgbValueToHex(paint.color.b)}`
  } else if (paint.type === 'GRADIENT_LINEAR') {
    const linearGradient = figmaGradientToCSS(paint)

    return linearGradient
  }

  return ''
}
