import { CssStyle } from './buildCssString'
import { UnitType } from './buildSizeStringByUnit'
import { UserComponentSetting } from './userComponentSetting'
export type messageTypes =
  | { type: 'notify-copy-success' }
  | { type: 'new-css-style-set'; cssStyle: CssStyle }
  | { type: 'new-unit-type-set'; unitType: UnitType }
  | { type: 'new-identify-component-set'; identify: string }
  | { type: 'download-file'; text: string }
  | { type: 'update-user-component-settings'; userComponentSettings: UserComponentSetting[] }
