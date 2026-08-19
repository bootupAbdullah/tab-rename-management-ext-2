export type ThemeName = 'default' | 'dark' | 'charcoal' | 'soft' | 'highcontrast'
export type FontSizeName = 'default' | 'large' | 'larger' | 'huge'

export interface Settings {
  openNewTab: boolean
  closeAfterRename: boolean
  clearOnNavigate: boolean
  clearOnClose: boolean
  autoCapitalize: boolean
  theme: ThemeName
  fontSize: FontSizeName
}

export type Renames = Record<string, string>
export type TabUrls = Record<string, string>

export interface JumpToTabMessage {
  type: 'jump-to-tab'
  tabId: number
  windowId?: number
}

export interface StorageSchema {
  settings: Settings
  renames: Renames
  tabUrls: TabUrls
}

export const DEFAULT_SETTINGS: Settings = {
  openNewTab: false,
  closeAfterRename: true,
  clearOnNavigate: false,
  clearOnClose: false,
  autoCapitalize: false,
  theme: 'default',
  fontSize: 'default',
}
