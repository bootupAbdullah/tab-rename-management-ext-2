export type ThemeName = 'default' | 'dark' | 'charcoal' | 'soft' | 'highcontrast'
export type FontSizeName = 'default' | 'large' | 'larger' | 'huge'

export interface Settings {
  openNewTab: boolean
  closeAfterRename: boolean
  clearOnNavigate: boolean
  clearOnClose: boolean
  theme: ThemeName
  fontSize: FontSizeName
}

export type Renames = Record<string, string>
export type TabUrls = Record<string, string>

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
  theme: 'default',
  fontSize: 'default',
}
