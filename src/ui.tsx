import * as React from 'react'
import * as ReactDom from 'react-dom'
import { CssStyle } from './buildCssString'
import { UnitType } from './buildSizeStringByUnit'
import { messageTypes } from './messagesTypes'
import { IdentifyComponentType } from './buildCode'
import styles from './ui.css'
import Spacer from './ui/Spacer'
import { UserComponentSetting } from './userComponentSetting'
import { LiveProvider, LiveEditor, LiveError, LivePreview } from 'react-live'
//import { saveAs } from 'file-saver'
function escapeHtml(str: string) {
  str = str.replace(/&/g, '&amp;')
  str = str.replace(/</g, '&lt;')
  str = str.replace(/>/g, '&gt;')
  str = str.replace(/"/g, '&quot;')
  str = str.replace(/'/g, '&#39;')
  return str
}

// I tried to use highlight.js https://highlightjs.readthedocs.io/en/latest/index.html
// but didn't like the color. so I give it a go for this dirty style💪
function insertSyntaxHighlightText(text: string) {
  return text
    .replaceAll('const', `const <span class="${styles.variableName}">`)
    .replaceAll(': React.FC', `</span>: React.FC`)
    .replaceAll('= styled.', `</span>= styled.`)
    .replaceAll('React.FC', `<span class="${styles.typeText}">React.FC</span>`)
    .replaceAll('return', `<span class="${styles.returnText}">return</span>`)
    .replaceAll(': ', `<span class="${styles.expressionText}">: </span>`)
    .replaceAll('= ()', `<span class="${styles.expressionText}">= ()</span>`)
    .replaceAll('{', `<span class="${styles.expressionText}">{</span>`)
    .replaceAll('}', `<span class="${styles.expressionText}">}</span>`)
    .replaceAll('(', `<span class="${styles.expressionText}">(</span>`)
    .replaceAll(')', `<span class="${styles.expressionText}">)</span>`)
    .replaceAll('&lt;', `<span class="${styles.tagText}">&lt;</span><span class="${styles.tagNameText}">`)
    .replaceAll('&gt;', `</span><span class="${styles.tagText}">&gt;</span>`)
    .replaceAll('=</span><span class="tag-text">&gt;</span>', `<span class="${styles.defaultText}">=&gt;</span>`)
    .replaceAll('.div', `<span class="${styles.functionText}">.div</span>`)
    .replaceAll('`', `<span class="${styles.stringText}">${'`'}</span>`)
}

const cssStyles: { value: CssStyle; label: string }[] = [
  { value: 'css', label: 'CSS' },
  { value: 'styled-components', label: 'styled-components' }
]

const IdentifyComponent = [
  { value: IdentifyComponentType.IdentifyComponent, label: '识别子节点是否为组件' },
  { value: IdentifyComponentType.IgnoreComponent, label: '不识别子节点是否为组件' }
]

const unitTypes: { value: UnitType; label: string }[] = [
  { value: 'px', label: 'px' },
  { value: 'rem', label: 'rem' },
  { value: 'remAs10px', label: 'rem(as 10px)' }
]

const App: React.FC = () => {
  const [code, setCode] = React.useState('')

  const [componentCode, setComponentCode] = React.useState('')
  const [cssCode, setCssCode] = React.useState('')
  const [selectedCssStyle, setCssStyle] = React.useState<CssStyle>('css')
  const [selectedIdentifyComponent, setIdentifyComponent] = React.useState(IdentifyComponentType.IdentifyComponent)
  const [selectedUnitType, setUnitType] = React.useState<UnitType>('px')
  const [userComponentSettings, setUserComponentSettings] = React.useState<UserComponentSetting[]>([])
  const textComponentRef = React.useRef<HTMLTextAreaElement>(null)
  const textCssRef = React.useRef<HTMLTextAreaElement>(null)

  const copyComponentToClipboard = () => {
    if (textComponentRef.current) {
      textComponentRef.current.select()
      document.execCommand('copy')

      const msg: messageTypes = { type: 'notify-copy-success' }
      parent.postMessage(msg, '*')
    }
  }

  const downloadFile = () => {
    const blob = new Blob(['Hello, world!'], { type: 'text/plain;charset=utf-8' })
    //saveAs(blob, 'hello world.txt')
  }

  const copyCssToClipboard = () => {
    if (textCssRef.current) {
      textCssRef.current.select()
      document.execCommand('copy')

      const msg: messageTypes = { type: 'notify-copy-success' }
      parent.postMessage(msg, '*')
    }
  }

  const notifyChangeIdentifyComponent = (event: React.ChangeEvent<HTMLInputElement>) => {
    const msg: messageTypes = { type: 'new-identify-component-set', identify: event.target.value }
    parent.postMessage({ pluginMessage: msg }, '*')
    setIdentifyComponent(String(event.target.value) as IdentifyComponentType)
  }

  const extractReturnContent = (codeString: any) => {
    const match = codeString.match(/return\s*\(([\s\S]*?)\)/)
    if (match && match[1]) {
      return match[1]
    }
    return ''
  }

  type CssObject = {
    [selector: string]: {
      [property: string]: string
    }
  }

  function cssStringToObject(cssString: string): CssObject {
    console.log("cssString: ", cssString); // Add this line
    const cssObj: CssObject = {};
    const rules = cssString.split("}").filter((rule) => rule && rule.trim().length > 0);
  
    rules.forEach((rule) => {
      const [selector, properties] = rule.split("{");
      const cleanedSelector = selector.trim();
      const propertyList = properties
        .trim()
        .split(";")
        .filter((property) => property && property.trim().length > 0);
  
      cssObj[cleanedSelector] = {};
  
      propertyList.forEach((property) => {
        const [key, value] = property.split(":");
        const cleanedKey = key.trim().replace(/-([a-z])/g, (match, letter) => letter.toUpperCase());
        const cleanedValue = value.trim();
        cssObj[cleanedSelector][cleanedKey] = cleanedValue;
      });
    });
    return cssObj;
  }

  function extractStylesObject(jsxString: string): Record<string, string> {
    const importStylesRegex = /import styles from ['"]\.\/index.css['"];/
    const stylesObjectRegex = /className={styles\.([\w-]+)}/g

    if (!importStylesRegex.test(jsxString)) {
      throw new Error('Unable to find "import styles from \'./index.css\';" in the provided JSX string.')
    }

    const stylesObject: Record<string, string> = {}

    let match: RegExpExecArray | null
    while ((match = stylesObjectRegex.exec(jsxString)) !== null) {
      const className = `.${match[1]}`
      const styleKey = match[1]
      stylesObject[className] = styleKey
    }

    if (Object.keys(stylesObject).length === 0) {
      throw new Error('Unable to find "className={styles.*}" in the provided JSX string.')
    }

    return stylesObject
  }

  function applyInlineStyles(cssString: string, jsxString: string): string {
    console.log("cssString before calling cssStringToObject: ", cssString); // Add this line
    const cssObject = cssStringToObject(cssString)
    const stylesObject = extractStylesObject(jsxString)

    const modifiedJsxString = Object.entries(stylesObject).reduce((acc, [className, styleKey]) => {
      const style = cssObject[`${className}`]

      if (style) {
        if (style.backgroundImage) {
          style.backgroundColor = '#eee'
          delete style.backgroundImage
        }

        const styleObjStr = JSON.stringify(style).replace(/"/g, "'")
        const styleReplacement = `style={${styleObjStr}}`
        const styleKeyPattern = new RegExp(`{styles.${styleKey}}`, 'g')

        return acc.replace(styleKeyPattern, styleReplacement)
      }

      return acc
    }, jsxString)
    console.log('convertSelfClosingToPair(modifiedJsxString): ', convertSelfClosingToPair(modifiedJsxString));

    return convertSelfClosingToPair(modifiedJsxString)
  }

  function convertSelfClosingToPair(jsxString: string): string {
    const selfClosingDivPattern = /<div([^>]*)\/>/g
    return jsxString.replace(selfClosingDivPattern, '<div$1></div>')
  }

  function prepareCodeForReactLive(code: string): string {
    // 删除import styles语句
    const importStylesRegex = /import styles from ['"]\.\/index.css['"];\s*/
    const cleanedCode = code.replace(importStylesRegex, '')

    // 将“className=style”替换为“style”
    const classNameStyleRegex = /className=style=/g
    const codeWithStyle = cleanedCode.replace(classNameStyleRegex, 'style=')

    // 提取return()里面的内容
    const returnContentRegex = /return\s*\(([\s\S]*?)\)/
    const returnContentMatch = codeWithStyle.match(returnContentRegex)

    if (returnContentMatch && returnContentMatch[1]) {
      const jsxContent = returnContentMatch[1]
      return jsxContent
    }

    console.log('codeWithStyle212: ', codeWithStyle)
    return codeWithStyle
  }

  const syntaxHighlightedComponentCode = React.useMemo(() => insertSyntaxHighlightText(escapeHtml(componentCode)), [componentCode])

  const syntaxHighlightedCssCode = React.useMemo(() => insertSyntaxHighlightText(escapeHtml(cssCode)), [cssCode])
  // set initial values taken from figma storage
  React.useEffect(() => {
    onmessage = (event) => {
      setCssStyle(event.data.pluginMessage.cssStyle)
      setUnitType(event.data.pluginMessage.unitType)
      const codeStr = event.data.pluginMessage.generatedCodeStr + '\n\n' + event.data.pluginMessage.cssString
      setCode(codeStr)
      setComponentCode(event.data.pluginMessage.generatedCodeStr)
      setCssCode(event.data.pluginMessage.cssString)
      console.log('event.data.pluginMessage.cssString: ', event.data.pluginMessage.cssString);
      setUserComponentSettings(event.data.pluginMessage.userComponentSettings)
    }
  }, [])

  return (
    <div>
      <div className={styles.code}>
        <div className={styles.codeContent}>
          {/* <div className={styles.codeLeft}>
            <textarea className={styles.textareaForClipboard} ref={textComponentRef} value={componentCode} readOnly />
            <p className={styles.generatedCode} dangerouslySetInnerHTML={{ __html: syntaxHighlightedComponentCode }} />
          </div> */}
          {cssCode && componentCode && (
            <div className={styles.codeLeft}>
              <LiveProvider code={prepareCodeForReactLive(applyInlineStyles(cssCode, componentCode))}>
                {/* <LiveProvider code={`const Livematch = () => {{/* <LiveEditor /> */}
                <LiveEditor /> 
                <LiveError />
                <LivePreview />
              </LiveProvider>
              {/* <div dangerouslySetInnerHTML={{ __html: extractReturnContent(syntaxHighlightedComponentCode) }} >

            </div> */}
            </div>
          )}
        </div>
        <Spacer axis="vertical" size={12} />

        <div className={styles.buttonLayout}>
          <button className={styles.copyButton} onClick={copyComponentToClipboard}>
            Copy Component to clipboard
          </button>
        </div>
      </div>

      <div className={styles.code}>
        <textarea className={styles.textareaForClipboard} ref={textCssRef} value={cssCode} readOnly />

        <p className={styles.generatedCode} dangerouslySetInnerHTML={{ __html: syntaxHighlightedCssCode }} />

        <Spacer axis="vertical" size={12} />

        <div className={styles.buttonLayout}>
          <button className={styles.copyButton} onClick={copyCssToClipboard}>
            Copy Css to clipboard
          </button>
        </div>
      </div>

      <div className={styles.settings}>
        <h2 className={styles.heading}>Settings</h2>

        <Spacer axis="vertical" size={12} />

        <div className={styles.optionList}>
          {IdentifyComponent.map((v) => (
            <div key={v.value} className={styles.option}>
              <input
                type="radio"
                name="css-style"
                id={IdentifyComponentType.IdentifyComponent}
                value={v.value}
                checked={selectedIdentifyComponent === v.value}
                onChange={notifyChangeIdentifyComponent}
              />
              <label htmlFor={v.value}>{v.label}</label>
            </div>
          ))}
        </div>

        <Spacer axis="vertical" size={12} />
        <Spacer axis="vertical" size={12} />
      </div>
    </div>
  )
}

ReactDom.render(<App />, document.getElementById('app'))
