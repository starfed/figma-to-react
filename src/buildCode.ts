import { capitalizeFirstLetter } from './utils/stringUtils'
import { Tag } from './buildTagTree'
import { buildClassName, specialLetterReg } from './utils/cssUtils'

type CssStyle = 'css' | 'styled-components'

export enum IdentifyComponentType {
  'IdentifyComponent' = '1',
  'IgnoreComponent' = '0'
}

export enum CssStyleList {
  'css' = 'css',
  'tailwind' = 'tailwind'
}
function buildSpaces(baseSpaces: number, level: number) {
  let spacesStr = ''

  for (let i = 0; i < baseSpaces; i++) {
    spacesStr += ' '
  }

  for (let i = 0; i < level; i++) {
    spacesStr += '  '
  }
  return spacesStr
}

function guessTagName(name: string) {
  const _name = name.toLowerCase()
  // if (_name.includes('button')) {
  //   return 'button'
  // }
  if (_name.includes('section')) {
    return 'section'
  }
  if (_name.includes('article')) {
    return 'article'
  }
  return 'div'
}

function getTagName(tag: Tag, cssStyle: CssStyle) {
  if (cssStyle === 'css' && !tag.isComponent) {
    // if (tag.isImg) {
    //   return 'img'
    // }
    if (tag.isText) {
      return 'p'
    }
    return guessTagName(tag.name)
  }
  return tag.isText ? 'Text' : tag.name.replace(/\s/g, '')
}

function getClassName(tag: Tag, cssStyle: CssStyle) {
  if (cssStyle === 'css' && !tag.isComponent) {
    // if (tag.isImg) {
    //   return ''
    // }
    if (/[.\-_]/.test(tag.css.className)) return ` className={styles[${buildClassName(tag.css.className)}]}`
    return ` className={styles.${buildClassName(tag.css.className)}}`
  }
  return ''
}

function buildPropertyString(prop: Tag['properties'][number]) {
  return ` ${prop.name}${prop.value !== null ? `=${prop.notStringValue ? '{' : '"'}${prop.value}${prop.notStringValue ? '}' : '"'}` : ''}`
}

function buildChildTagsString(tag: Tag, cssStyle: CssStyle, level: number): string {
  if (tag.children.length > 0) {
    return '\n' + tag.children.map((child) => buildJsxString(child, cssStyle, level + 1)).join('\n')
  }
  if (tag.isText) {
    return `${tag.textCharacters}`
  }
  return ''
}

function buildJsxString(tag: Tag, cssStyle: CssStyle, level: number) {
  if (!tag) {
    return ''
  }
  const spaceString = buildSpaces(4, level)
  const hasChildren = tag.children.length > 0

  const tagName = getTagName(tag, cssStyle).replace(specialLetterReg, '')
  const className = getClassName(tag, cssStyle)
  const properties = tag.properties.map(buildPropertyString).join('')

  if (tag.isInstance) {
    return `${spaceString}<${capitalizeFirstLetter(tag.name)} />`
  } else {
    const openingTag = `${spaceString}<${tagName}${className}${properties}${hasChildren || tag.isText ? `` : ' /'}>`
    const childTags = buildChildTagsString(tag, cssStyle, level)
    const closingTag = hasChildren || tag.isText ? `${!tag.isText ? '\n' + spaceString : ''}</${tagName}>` : ''

    return openingTag + childTags + closingTag
  }
}

function buildImportString(tag: Tag): string {
  if (!tag) {
    return ''
  }

  const getImportStringByName = (name: string) => `import ${capitalizeFirstLetter(name)} from '@/components/${name}'\n`
  const name = tag.name
  let p = tag.isInstance ? getImportStringByName(name) : ''

  if (tag.children) {
    tag.children.forEach((v) => {
      if (!v.isInstance) {
        const s = buildImportString(v)
        if (!p.includes(s)) p += s
      } else {
        const newImport = getImportStringByName(v.name)
        if (!p.includes(newImport)) {
          p += newImport
        }
      }
    })
  }
  return p
}

export function buildCode(tag: Tag, css: CssStyle): string {
  const componentName = capitalizeFirstLetter(tag.name)
  return `import styles from './index.css';
  ${buildImportString(tag)}
  const ${componentName}: React.FC = () => {
  return (
    ${buildJsxString(tag, css, 0)}
  )
  
}
export default ${componentName}`
}
