import * as React from 'react'
import { LiveProvider, LiveEditor, LiveError, LivePreview } from 'react-live'

const Preview = (props: { code: string; scope: any }) => {
  const { code, scope = {} } = props
  return (
    <LiveProvider code={code} scope={scope}>
      <LiveError />
      <LivePreview />
    </LiveProvider>
  )
}

export default Preview

export const StyleSupportComponent = (props: { styles: string; children: any }) => {
  const { styles, children } = props
  const [scale, setScale] = React.useState(1)
  const pref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    setTimeout(() => {
      if (pref.current) {
        const e: any = pref.current.childNodes[0]
        if (e) {
          const width = e.offsetWidth
          if (width) setScale(600 / width)
        }
      }
    }, 100)
  }, [children])
  return (
    <div>
      <style>{styles}</style>

      <div ref={pref} style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        {children}
      </div>
    </div>
  )
}
