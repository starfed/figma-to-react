export function isImageNode(node: SceneNode): boolean {
  // 下部に Vector しか存在しないものは画像と判定する
  if ('children' in node && node.children.length > 0) {
    let hasOnlyVector = true
    let hasVector = false
    node.children.forEach((child) => {
      if (child.type !== 'VECTOR' && child.type !== 'GROUP') {
        hasOnlyVector = false
      }
      if (child.type === 'VECTOR') {
        hasVector = true
      }
    })
    if (hasOnlyVector) {
      return true
    }
    //if (node.type === 'GROUP' && hasVector) return true
  } else if (node.type === 'VECTOR') {
    return true
  }
  if (node.type === 'FRAME' || node.type === 'RECTANGLE') {
    if ((node.fills as Paint[]).find((paint) => paint.type === 'IMAGE') !== undefined) {
      return true
    }
  }

  return false
}
