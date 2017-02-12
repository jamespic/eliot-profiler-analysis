import {element} from './deku-seamless-immutable'

export default function DataBar ({props: {mainSize, extraSize, totalSize}, children}) {
  return <div class='data-bar-outer'>
    <div class='data-bar-inner'>
      <div style={`width: ${mainSize / totalSize * 100}%;`} class='data-bar-main' />
      <div style={`width: ${extraSize / totalSize * 100}%;`} class='data-bar-extra' />
    </div>
    <div class='data-bar-content'>
      {children}
    </div>
  </div>
}
