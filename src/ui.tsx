import * as React from 'react'
import * as ReactDom from 'react-dom'
import { CssStyle, CssStyleList } from './buildCssString'

import { messageTypes } from './messagesTypes'
import { IdentifyComponentType } from './buildCode'
import styles from './ui.css'
import Spacer from './ui/Spacer'
import Preview, { StyleSupportComponent } from './preview'
import copy from 'copy-to-clipboard'
import Editor from '@monaco-editor/react'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
const cssStyles: { value: CssStyleList; label: string }[] = [
  { value: CssStyleList.css, label: CssStyleList.css },
  { value: CssStyleList.tailwind, label: CssStyleList.tailwind }
]

const IdentifyComponent = [
  { value: IdentifyComponentType.IdentifyComponent, label: '识别子节点是否为组件' },
  { value: IdentifyComponentType.IgnoreComponent, label: '不识别子节点是否为组件' }
]

const App: React.FC = () => {
  const [previewCode, setPreviewCode] = React.useState('')
  const [componentCode, setComponentCode] = React.useState('')
  const [cssCode, setCssCode] = React.useState('')
  const [componentName, setComponentName] = React.useState('')
  const [selectedCssStyle, setCssStyle] = React.useState<CssStyle>('css')
  const [selectedIdentifyComponent, setIdentifyComponent] = React.useState(IdentifyComponentType.IdentifyComponent)

  const copyComponentToClipboard = () => {
    const msg: messageTypes = { type: 'notify-copy-success' }
    parent.postMessage({ pluginMessage: msg }, '*')
    copy(componentCode)
  }

  const downloadFile = () => {
    const zip = new JSZip()

    zip.file('index.tsx', componentCode)
    if (selectedCssStyle === 'css') zip.file('index.css', cssCode)

    zip.generateAsync({ type: 'blob' }).then(function (content) {
      const name = componentName || 'Component'
      // see FileSaver.js
      saveAs(content, name + '.zip')
    })
  }

  const copyCssToClipboard = () => {
    const msg: messageTypes = { type: 'notify-copy-success' }
    parent.postMessage({ pluginMessage: msg }, '*')
    copy(cssCode)
  }

  const componentCodeChange = (value?: string) => {
    console.log(value)
    setComponentCode(value || '')
  }

  const cssCodeChange = (value?: string) => {
    console.log(value)
    setCssCode(value || '')
  }

  const notifyChangeCssStyle = (event: React.ChangeEvent<HTMLInputElement>) => {
    const msg: messageTypes = { type: 'new-css-style-set', cssStyle: event.target.value as CssStyle }
    parent.postMessage({ pluginMessage: msg }, '*')
    setCssStyle(event.target.value as CssStyle)
  }

  const notifyChangeIdentifyComponent = (event: React.ChangeEvent<HTMLInputElement>) => {
    const msg: messageTypes = { type: 'new-identify-component-set', identify: event.target.value }
    parent.postMessage({ pluginMessage: msg }, '*')
    setIdentifyComponent(String(event.target.value) as IdentifyComponentType)
  }

  const getComponentPreviewCode = () => {
    let pcode = ''
    if (selectedIdentifyComponent === IdentifyComponentType.IdentifyComponent) {
      const styles = '.notSupport{color:red}'
      const code = '<p className="notSupport"> 嵌套子组件暂时无法提供预览服务</p>'
      pcode = ` <StyleSupportComponent styles='${styles}'  >${code}</StyleSupportComponent>`
    } else if (selectedIdentifyComponent === IdentifyComponentType.IgnoreComponent) {
      //const styles = cssCode.replaceAll(/background-image.*\(.*\)/g, '')
      const styles = cssCode
      const matchs = componentCode.match(/return\s*\(([\s\S]*)\)/)
      let innerString = matchs?.[1] ? matchs[1] : ''
      const classMatchReg = /className=\{styles\.(.*)\}/
      while (classMatchReg.test(innerString)) {
        const classMatch = innerString.match(classMatchReg)
        if (classMatch?.[1]) {
          innerString = innerString.replace(classMatch[0], `className='${classMatch[1]}'`)
        }
      }
      const code = innerString
      pcode = ` <StyleSupportComponent styles='${styles}'  >${code}</StyleSupportComponent>`
    }

    setPreviewCode(pcode)
  }
  // set initial values taken from figma storage
  React.useEffect(() => {
    onmessage = (event) => {
      console.log(event.data.pluginMessage)
      if (event.data.pluginMessage) {
        setCssStyle(event.data.pluginMessage.cssStyle)
        setComponentCode(event.data.pluginMessage.generatedCodeStr)
        setCssCode(event.data.pluginMessage.cssString)
        setComponentName(event.data.pluginMessage.nodeName)
      }
    }
  }, [])

  React.useEffect(() => {
    getComponentPreviewCode()
  }, [componentCode, cssCode, selectedIdentifyComponent])

  return (
    <div className={styles.wrapper}>
      <div className={styles.code}>
        <div className={styles.codeContent}>
          <div className={styles.codeLeft}>
            <Editor
              defaultLanguage="javascript"
              theme="vs-dark"
              value={componentCode}
              onChange={componentCodeChange}
              width={selectedCssStyle === 'tailwind' ? 900 : 450}
              height={450}
              options={{
                minimap: {
                  // 关闭代码缩略图
                  enabled: false // 是否启用预览图
                }
              }}
            />

            <Spacer axis="vertical" size={12} />
            <div className={styles.buttonLayout}>
              <button className={styles.copyButton} onClick={copyComponentToClipboard}>
                Copy Component to clipboard
              </button>
            </div>
          </div>
          {selectedCssStyle === CssStyleList.css && (
            <div className={styles.codeRight}>
              <Editor
                defaultLanguage="css"
                theme="vs-dark"
                value={cssCode}
                onChange={cssCodeChange}
                width={450}
                height={450}
                options={{
                  minimap: {
                    // 关闭代码缩略图
                    enabled: false // 是否启用预览图
                  }
                }}
              />
              <Spacer axis="vertical" size={12} />
              <div className={styles.buttonLayout}>
                <button className={styles.copyButton} onClick={copyCssToClipboard}>
                  Copy Css to clipboard
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={styles.module}>
        <h2 className={styles.heading}>Settings</h2>

        <Spacer axis="vertical" size={12} />

        <div className={styles.optionList}>
          {cssStyles.map((style) => (
            <div key={style.value} className={styles.option}>
              <input type="radio" name="css-style" id={style.value} value={style.value} checked={selectedCssStyle === style.value} onChange={notifyChangeCssStyle} />
              <label htmlFor={style.value}>{style.label}</label>
            </div>
          ))}
        </div>

        <div className={styles.optionList}>
          {IdentifyComponent.map((v) => (
            <div key={v.value} className={styles.option}>
              <input
                type="radio"
                name="identify-component"
                id={IdentifyComponentType.IdentifyComponent}
                value={v.value}
                checked={selectedIdentifyComponent === v.value}
                onChange={notifyChangeIdentifyComponent}
              />
              <label htmlFor={v.value}>{v.label}</label>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.module}>
        <h2 className={styles.heading}>Preview</h2>
        <Preview code={previewCode} scope={{ StyleSupportComponent }} />
      </div>

      <div className={styles.module}>
        <h2 className={styles.heading}>Component Download</h2>
        <div className={styles.buttonLayout}>
          <button className={styles.copyButton} onClick={downloadFile}>
            Download
          </button>
        </div>
      </div>
      {/* <div onClick={() => downloadFile()}>test download</div> */}
    </div>
  )
}

ReactDom.render(<App />, document.getElementById('app'))
