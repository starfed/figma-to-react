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
  return (
    <div>
      <style>{styles}</style>
      {children}
    </div>
  )
}
