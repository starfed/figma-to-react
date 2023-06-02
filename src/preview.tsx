import * as React from 'react'
import { LiveProvider, LiveEditor, LiveError, LivePreview } from 'react-live'

const Preview = (props: { code: string; scope: any }) => {
  const { code, scope } = props
  return (
    <LiveProvider code={code}>
      <LiveEditor />
      <LiveError />
      <LivePreview />
    </LiveProvider>
  )
}

export default Preview

export const PreviewInnerComponent = (styles) => {
  return (
    <div>
      <style>{styles}</style>
    </div>
  )
}
