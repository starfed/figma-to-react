import { CSSData } from './getCssDataForTag'
import { Tag } from './buildTagTree'
import { buildClassName } from './utils/cssUtils'
import { CssToTailwindTranslator } from 'css-to-tailwind-translator'
export type CssStyle = 'css' | 'styled-components'

function buildArray(tag: Tag, arr: CSSData[]): CSSData[] {
  if (tag.isInstance) return arr
  if (!tag.isComponent) {
    arr.push(tag.css)
  }

  tag.children.forEach((child) => {
    arr = buildArray(child, arr)
  })

  return arr
}

export function buildTailwind(tag: Tag): string {
  const cssString = buildCssString(tag, 'css')
  const result = CssToTailwindTranslator(cssString)
  if (result.code === 'OK') {
    return result.data.map((v) => v.resultVal).join(' ')
  } else {
    return ''
  }
}

export function buildCssString(tag: Tag, cssStyle: CssStyle): string {
  const cssArray = buildArray(tag, [])
  let codeStr = ''

  if (!cssArray) {
    return codeStr
  }
  cssArray.forEach((cssData) => {
    if (!cssData || cssData.properties.length === 0) {
      return
    }
    const cssStr =
      cssStyle === 'styled-components'
        ? `const ${cssData?.className.replace(/\s/g, '')} = styled.div\`
${cssData.properties.map((property) => `  ${property.name}: ${property.value};`).join('\n')}
\`\n`
        : `.${buildClassName(cssData?.className)} {
${cssData.properties.map((property) => `  ${property.name}: ${property.value};`).join('\n')}
}\n`

    codeStr += cssStr
  })

  return codeStr
}
