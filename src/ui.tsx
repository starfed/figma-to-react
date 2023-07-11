import * as React from 'react'
import * as ReactDom from 'react-dom'
import { CssStyle, CssStyleList } from './buildCssString'
import * as prettier from 'prettier'
import { messageTypes } from './messagesTypes'
import { IdentifyComponentType } from './buildCode'
import styles from './ui.css'
import Spacer from './ui/Spacer'
import Preview, { StyleSupportComponent } from './preview'
import copy from 'copy-to-clipboard'
import Editor from '@monaco-editor/react'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import parserBabel from 'prettier/parser-babel'

import { parse } from '@babel/parser'
import traverse from '@babel/traverse'
import MonacoJSXHighlighter from 'monaco-jsx-highlighter'

const cssStyles: { value: CssStyleList; label: string }[] = [
  { value: CssStyleList.css, label: CssStyleList.css },
  { value: CssStyleList.tailwind, label: CssStyleList.tailwind }
]

const IdentifyComponent = [
  { value: IdentifyComponentType.IdentifyComponent, label: '识别子节点是否为组件' },
  { value: IdentifyComponentType.IgnoreComponent, label: '不识别子节点是否为组件' }
]

const App = () => {
  const [previewCode, setPreviewCode] = React.useState('')
  const [componentCode, setComponentCode] = React.useState('')
  const [cssCode, setCssCode] = React.useState('')
  const [componentName, setComponentName] = React.useState('')
  const [selectedCssStyle, setCssStyle] = React.useState<CssStyle>(CssStyleList.tailwind)
  const [selectedIdentifyComponent, setIdentifyComponent] = React.useState(IdentifyComponentType.IgnoreComponent)

  function handleEditorDidMount(editor: any, monaco: any) {
    // here is another way to get monaco instance
    // you can also store it in `useRef` for further usage
    // Instantiate the highlighter
    const monacoJSXHighlighter = new MonacoJSXHighlighter(monaco, parse, traverse, editor)
    // Activate highlighting (debounceTime default: 100ms)
    monacoJSXHighlighter.highlightOnDidChangeModelContent(100)
    // Activate JSX commenting
    monacoJSXHighlighter.addJSXCommentCommand()
  }
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

  const getFomattedCode = (value: string) => {
    return prettier.format(value || '', { semi: false, parser: 'babel', plugins: [parserBabel] })
  }

  const componentCodeChange = (value?: string) => {
    setComponentCode(value || '')
  }

  const cssCodeChange = (value?: string) => {
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
      const code = '<p className="notSupport"> 识别子组件模式下暂时无法提供预览服务</p>'
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
      pcode = `<StyleSupportComponent styles='${styles}'  >${code}</StyleSupportComponent>`
    }

    setPreviewCode(pcode)
  }
  // set initial values taken from figma storage
  React.useEffect(() => {
    onmessage = (event) => {
      console.log(event.data.pluginMessage)
      if (event.data.pluginMessage) {
        setCssStyle(event.data.pluginMessage.cssStyle)
        setCssCode(event.data.pluginMessage.cssString)
        setComponentName(event.data.pluginMessage.nodeName)
        const fomattedCode: string = getFomattedCode(event.data.pluginMessage.generatedCodeStr)
        setComponentCode(fomattedCode)
      }
    }
  }, [])

  React.useEffect(() => {
    getComponentPreviewCode()
  }, [componentCode, cssCode, selectedIdentifyComponent])

  return (
    <div className={styles.wrapper}>
      <div className={styles.module}>
        <h2 className={styles.heading}>代码</h2>
        <div className={styles.code}>
          <div className={styles.codeContent}>
            <div
              className={styles.codeLeft}
              style={{
                width: selectedCssStyle === 'tailwind' ? '100%' : '50%'
              }}
            >
              <Editor
                defaultLanguage="javascript"
                theme="vs-dark"
                value={componentCode}
                onChange={componentCodeChange}
                height={450}
                onMount={handleEditorDidMount}
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
          {/* <Spacer axis="vertical" size={12} />
          <div className={styles.buttonLayout}>
            <button className={styles.copyButton} onClick={downloadFile}>
              组件下载
            </button>
          </div> */}
        </div>
      </div>

      {/* <div className={styles.module}>
        <h2 className={styles.heading}>设置</h2>

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
      </div> */}

      <div className={styles.module}>
        <h2 className={styles.heading}>预览</h2>
        <Preview code={previewCode} scope={{ StyleSupportComponent }} />
      </div>
    </div>
  )
}

ReactDom.render(<App />, document.getElementById('app'))
