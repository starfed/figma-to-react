import { IdentifyComponentType } from './buildCode'
import { UnitType } from './buildSizeStringByUnit'
import { CSSData, getCssDataForTag, TextCount } from './getCssDataForTag'
import { getRightName, specialLetterReg } from './utils/cssUtils'
import { isImageNode } from './utils/isImageNode'

type Property = {
  name: string
  value: string
  notStringValue?: boolean
}

export type Tag = {
  name: string
  isInstance?: boolean
  isText: boolean
  textCharacters: string | null
  isImg: boolean
  properties: Property[]
  css: CSSData
  children: Tag[]
  node: SceneNode
  isComponent?: boolean
}

export function buildTagTree(node: SceneNode, unitType: UnitType, textCount: TextCount, identifyComponent: IdentifyComponentType, root = false): Tag | null {
  if (!node.visible) {
    return null
  }

  const isImg = isImageNode(node)
  const properties: Property[] = []

  // if (isImg) {
  //   properties.push({ name: 'src', value: '' })
  // }

  const childTags: Tag[] = []
  if ('children' in node && !isImg) {
    node.children.forEach((child) => {
      const childTag = buildTagTree(child, unitType, textCount, identifyComponent)
      if (childTag) {
        childTags.push(childTag)
      }
    })
  }

  const tag: Tag = {
    name: isImg ? 'img' : getRightName(node.name),
    isText: node.type === 'TEXT',
    isInstance: identifyComponent === IdentifyComponentType.IdentifyComponent ? node.type === 'INSTANCE' : false,
    textCharacters: node.type === 'TEXT' ? node.characters : null,
    isImg,
    css: getCssDataForTag(node, unitType, textCount, root),
    properties,
    children: childTags,
    node
  }

  return tag
}
