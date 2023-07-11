import { STORAGE_KEYS } from './storageKeys'
import { messageTypes } from './messagesTypes'
import { UnitType } from './buildSizeStringByUnit'
import { modifyTreeForComponent } from './modifyTreeForComponent'
import { buildCode, IdentifyComponentType } from './buildCode'
import { buildTagTree } from './buildTagTree'
import { buildCssString, CssStyle, CssStyleList } from './buildCssString'
import { UserComponentSetting } from './userComponentSetting'
import { TextCount } from './getCssDataForTag'
import { getPageWidth, getRightName } from './utils/cssUtils'

const run = (init = false) => {
  const selectedNodes = figma.currentPage.selection
  if (selectedNodes.length > 1) {
    figma.notify('Please select only 1 node')
    figma.closePlugin()
  } else if (selectedNodes.length === 0) {
    figma.notify('Please select a node')
    figma.closePlugin()
  } else {
    const node = selectedNodes[0]
    if (!init) {
      generate(node, {})
    } else {
      figma.showUI(__html__, { width: getPageWidth(node.width), height: 800 })
      generate(node, {})
    }
  }
}

run(true)

figma.on('selectionchange', () => {
  run()
})

figma.ui.onmessage = (msg: messageTypes) => {
  if (msg.type === 'notify-copy-success') {
    figma.notify('copied to clipboard👍')
  }
  if (msg.type === 'new-css-style-set') {
    figma.clientStorage.setAsync(STORAGE_KEYS.CSS_STYLE_KEY, msg.cssStyle)
    generate(selectedNodes[0], { cssStyle: msg.cssStyle })
  }

  if (msg.type === 'new-identify-component-set') {
    figma.clientStorage.setAsync(STORAGE_KEYS.IDENTIFY_COMPONENT, msg.identify)

    generate(selectedNodes[0], { identifyComponent: msg.identify as IdentifyComponentType })
  }
  if (msg.type === 'new-unit-type-set') {
    figma.clientStorage.setAsync(STORAGE_KEYS.UNIT_TYPE_KEY, msg.unitType)
    generate(selectedNodes[0], { unitType: msg.unitType })
  }
  if (msg.type === 'update-user-component-settings') {
    figma.clientStorage.setAsync(STORAGE_KEYS.USER_COMPONENT_SETTINGS_KEY, msg.userComponentSettings)
    generate(selectedNodes[0], {})
  }
}

async function generate(node: SceneNode, config: { cssStyle?: CssStyle; unitType?: UnitType; identifyComponent?: IdentifyComponentType }) {
  console.log(node)
  let cssStyle = config.cssStyle

  if (!cssStyle) {
    cssStyle = CssStyleList.tailwind
  }

  if (!config.identifyComponent) {
    config.identifyComponent = IdentifyComponentType.IgnoreComponent
  }

  let unitType = config.unitType
  if (!unitType) {
    unitType = await figma.clientStorage.getAsync(STORAGE_KEYS.UNIT_TYPE_KEY)

    if (!unitType) {
      unitType = 'px'
    }
  }

  const userComponentSettings: UserComponentSetting[] = (await figma.clientStorage.getAsync(STORAGE_KEYS.USER_COMPONENT_SETTINGS_KEY)) || []

  const textCount = new TextCount()

  const originalTagTree = buildTagTree(node, unitType, textCount, config.identifyComponent, 0)
  if (originalTagTree === null) {
    figma.notify('Please select a visible node')
    return
  }

  const tag = await modifyTreeForComponent(originalTagTree, figma)
  const generatedCodeStr = buildCode(tag, cssStyle)
  const cssString = buildCssString(tag, cssStyle)

  figma.ui.postMessage({ generatedCodeStr, cssString, cssStyle, unitType, userComponentSettings, nodeName: getRightName(node.name) })
}
