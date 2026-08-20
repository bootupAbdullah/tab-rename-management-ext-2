import { getSettings, setSettings, getRenames, setRenames } from '@shared/storage'
import { logger } from '@shared/logger'
import { DEFAULT_SETTINGS } from '@shared/types'
import type { Settings, ThemeName, FontSizeName, JumpToTabMessage } from '@shared/types'
import { findRename } from '@shared/urlMatch'

const log = logger.popup

// ── Theme definitions ──
const THEMES: Record<ThemeName, Record<string, string>> = {
  default: {
    bg: '#ffffff', bodyText: '#1a1a1a', headerBg: '#6c5ce7', headerText: '#ffffff',
    inputBg: '#fafafa', inputBorder: '#e0e0e0', inputText: '#1a1a1a',
    labelColor: '#888888', resetBg: '#f4f4f4', resetText: '#555555',
    settingLabel: '#1a1a1a', settingDesc: '#888888', rowBorder: '#f0f0f0',
    gearColor: '#cccccc', statusColor: '#6c5ce7', versionColor: '#cccccc',
  },
  dark: {
    bg: '#1a1a2e', bodyText: '#e0e0e0', headerBg: '#6c5ce7', headerText: '#ffffff',
    inputBg: '#252540', inputBorder: '#3a3a5c', inputText: '#e0e0e0',
    labelColor: '#8888aa', resetBg: '#252540', resetText: '#aaaacc',
    settingLabel: '#e0e0e0', settingDesc: '#8888aa', rowBorder: '#2a2a45',
    gearColor: '#555577', statusColor: '#a89be8', versionColor: '#555577',
  },
  charcoal: {
    bg: '#2d2d2d', bodyText: '#e0e0e0', headerBg: '#5a5a5a', headerText: '#ffffff',
    inputBg: '#3a3a3a', inputBorder: '#4a4a4a', inputText: '#e0e0e0',
    labelColor: '#999999', resetBg: '#3a3a3a', resetText: '#aaaaaa',
    settingLabel: '#e0e0e0', settingDesc: '#999999', rowBorder: '#3a3a3a',
    gearColor: '#666666', statusColor: '#a89be8', versionColor: '#666666',
  },
  highcontrast: {
    bg: '#000000', bodyText: '#ffffff', headerBg: '#ffff00', headerText: '#000000',
    inputBg: '#000000', inputBorder: '#ffff00', inputText: '#ffffff',
    labelColor: '#ffff00', resetBg: '#333333', resetText: '#ffffff',
    settingLabel: '#ffffff', settingDesc: '#ffff00', rowBorder: '#333333',
    gearColor: '#ffff00', statusColor: '#ffff00', versionColor: '#888888',
  },
  soft: {
    bg: '#f0f0f0', bodyText: '#333333', headerBg: '#9b8fe0', headerText: '#ffffff',
    inputBg: '#ffffff', inputBorder: '#d8d8d8', inputText: '#333333',
    labelColor: '#999999', resetBg: '#e0e0e0', resetText: '#555555',
    settingLabel: '#333333', settingDesc: '#999999', rowBorder: '#e0e0e0',
    gearColor: '#bbbbbb', statusColor: '#9b8fe0', versionColor: '#bbbbbb',
  },
}

// ── Font size definitions ──
const FONT_SIZES: Record<FontSizeName, Record<string, string>> = {
  default: { base: '13px', label: '11px', desc: '11px', status: '11px', width: '280px', headerPad: '10px 16px 8px',  bodyPad: '8px 16px 6px',   inputPad: '7px 10px',  btnPad: '7px 0',  rowGap: '7px', settingsBodyPad: '6px 16px 10px', settingRowPad: '8px 0', tabTitle: '12px', tabPad: '7px 8px',   tabFavicon: '14px' },
  large:   { base: '15px', label: '12px', desc: '12px', status: '12px', width: '280px', headerPad: '11px 16px 9px',  bodyPad: '9px 16px 7px',   inputPad: '8px 10px',  btnPad: '8px 0',  rowGap: '7px', settingsBodyPad: '6px 16px 10px', settingRowPad: '8px 0', tabTitle: '13px', tabPad: '8px 9px',   tabFavicon: '15px' },
  larger:  { base: '17px', label: '13px', desc: '13px', status: '13px', width: '280px', headerPad: '12px 18px 10px', bodyPad: '10px 18px 8px',  inputPad: '9px 12px',  btnPad: '9px 0',  rowGap: '8px', settingsBodyPad: '4px 18px 8px',  settingRowPad: '6px 0', tabTitle: '15px', tabPad: '9px 10px',  tabFavicon: '17px' },
  huge:    { base: '20px', label: '15px', desc: '14px', status: '13px', width: '280px', headerPad: '13px 20px 11px', bodyPad: '12px 20px 10px', inputPad: '11px 14px', btnPad: '11px 0', rowGap: '9px', settingsBodyPad: '2px 20px 6px',  settingRowPad: '5px 0', tabTitle: '17px', tabPad: '10px 11px', tabFavicon: '19px' },
}

// ── Auto-capitalize ──
const CASE_EXCEPTIONS: Record<string, string> = {
  iphone: 'iPhone', ipad: 'iPad', ipod: 'iPod', imac: 'iMac',
  ios: 'iOS', ipados: 'iPadOS', macos: 'macOS', watchos: 'watchOS', tvos: 'tvOS',
  youtube: 'YouTube', github: 'GitHub', gitlab: 'GitLab', linkedin: 'LinkedIn',
  paypal: 'PayPal', wifi: 'WiFi', javascript: 'JavaScript', typescript: 'TypeScript',
}

function autoCapitalizeText(text: string): string {
  return text
    .split(/(\s+)/)
    .map(part => {
      if (part === '' || /^\s+$/.test(part)) return part
      const exception = CASE_EXCEPTIONS[part.toLowerCase()]
      if (exception) return exception
      return part.charAt(0).toUpperCase() + part.slice(1)
    })
    .join('')
}

function formatTitleIfEnabled(text: string): string {
  return el<HTMLInputElement>('toggle-autocap').checked ? autoCapitalizeText(text) : text
}

// ── DOM helpers ──
const input = document.getElementById('new-title') as HTMLInputElement

function el<T extends HTMLElement>(id: string): T {
  return document.getElementById(id) as T
}

function setStatus(msg: string, isError = false): void {
  const s = el('status')
  s.style.color = isError ? '#e17055' : (THEMES[currentTheme]?.['statusColor'] ?? '#6c5ce7')
  s.textContent = msg
  setTimeout(() => { s.textContent = '' }, 2000)
}

let currentTheme: ThemeName = 'default'
let currentFontSize: FontSizeName = 'default'

// ── Apply font size ──
function applyFontSize(name: FontSizeName): void {
  const f = FONT_SIZES[name]

  document.body.style.width = f['width'] ?? '280px'
  document.querySelectorAll<HTMLElement>('.header, .settings-header').forEach(e => e.style.padding = f['headerPad'] ?? '')
  document.querySelectorAll<HTMLElement>('.body').forEach(e => e.style.padding = f['bodyPad'] ?? '')
  document.querySelectorAll<HTMLElement>('.settings-body').forEach(e => e.style.padding = f['settingsBodyPad'] ?? '')
  document.querySelectorAll<HTMLElement>('.setting-row, .color-row, .theme-row, .fontsize-row').forEach(e => e.style.padding = f['settingRowPad'] ?? '')

  input.style.padding  = f['inputPad'] ?? ''
  input.style.fontSize = f['base'] ?? ''

  document.querySelectorAll<HTMLElement>('#btn-rename, #btn-reset').forEach(e => {
    e.style.padding  = f['btnPad'] ?? ''
    e.style.fontSize = f['base'] ?? ''
  })

  const row = document.querySelector<HTMLElement>('.row')
  if (row) row.style.gap = f['rowGap'] ?? ''

  const h1 = document.querySelector<HTMLElement>('.header h1')
  if (h1) h1.style.fontSize = f['base'] ?? ''

  document.querySelectorAll<HTMLElement>('label:not(.toggle)').forEach(e => e.style.fontSize = f['label'] ?? '')
  document.querySelectorAll<HTMLElement>('.setting-label').forEach(e => e.style.fontSize = f['base'] ?? '')
  document.querySelectorAll<HTMLElement>('.setting-desc').forEach(e => e.style.fontSize = f['desc'] ?? '')
  document.querySelectorAll<HTMLElement>('.settings-title').forEach(e => e.style.fontSize = f['base'] ?? '')
  document.querySelectorAll<HTMLElement>('#status').forEach(e => e.style.fontSize = f['status'] ?? '')

  const iconSize = name === 'huge' ? '20px' : name === 'larger' ? '17px' : name === 'large' ? '15px' : '14px'
  ;[document.querySelector<SVGElement>('#btn-settings svg'), document.querySelector<SVGElement>('#btn-back svg')].forEach(svg => {
    if (!svg) return
    svg.style.width  = iconSize
    svg.style.height = iconSize
  })

  el('btn-reset-settings').style.fontSize = f['desc'] ?? ''

  document.querySelectorAll<HTMLElement>('.tab-row').forEach(e => e.style.padding = f['tabPad'] ?? '')
  document.querySelectorAll<HTMLElement>('.tab-row-title').forEach(e => e.style.fontSize = f['tabTitle'] ?? '')
  document.querySelectorAll<HTMLElement>('.tab-row-favicon').forEach(e => {
    e.style.width  = f['tabFavicon'] ?? ''
    e.style.height = f['tabFavicon'] ?? ''
  })
  document.querySelectorAll<HTMLElement>('.tabs-panel-empty').forEach(e => e.style.fontSize = f['desc'] ?? '')

  document.querySelectorAll<HTMLButtonElement>('.fontsize-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset['size'] === name)
  })
}

// ── Apply theme ──
function applyTheme(name: ThemeName): void {
  const t = THEMES[name]
  document.body.style.background = t['bg'] ?? ''
  document.body.style.color      = t['bodyText'] ?? ''

  document.querySelectorAll<HTMLElement>('.header, .settings-header').forEach(e => e.style.background = t['headerBg'] ?? '')
  document.querySelectorAll<HTMLElement>('.header h1, .settings-title').forEach(e => e.style.color = t['headerText'] ?? '')
  document.querySelectorAll<SVGElement>('.header svg, .settings-header svg').forEach(e => e.style.stroke = t['headerText'] ?? '')

  input.style.background  = t['inputBg'] ?? ''
  input.style.borderColor = t['inputBorder'] ?? ''
  input.style.color       = t['inputText'] ?? ''

  document.querySelectorAll<HTMLElement>('label:not(.toggle)').forEach(e => e.style.color = t['labelColor'] ?? '')

  const resetBtn = el<HTMLButtonElement>('btn-reset')
  resetBtn.style.background = t['resetBg'] ?? ''
  resetBtn.style.color      = t['resetText'] ?? ''

  document.querySelectorAll<HTMLElement>('.setting-label').forEach(e => e.style.color = t['settingLabel'] ?? '')
  document.querySelectorAll<HTMLElement>('.setting-desc').forEach(e => e.style.color = t['settingDesc'] ?? '')
  document.querySelectorAll<HTMLElement>('.setting-row, .color-row, .theme-row, .fontsize-row').forEach(e => {
    e.style.borderBottomColor = t['rowBorder'] ?? ''
  })
  document.querySelectorAll<HTMLElement>('.static-section-label').forEach(e => e.style.color = t['labelColor'] ?? '')

  el('btn-settings').style.color = t['gearColor'] ?? ''
  el('status').style.color       = t['statusColor'] ?? ''

  document.querySelectorAll<HTMLElement>('.tab-row').forEach(e => {
    e.style.background   = t['inputBg'] ?? ''
    e.style.borderColor  = t['inputBorder'] ?? ''
  })
  document.querySelectorAll<HTMLElement>('.tab-row-title').forEach(e => e.style.color = t['inputText'] ?? '')
  document.querySelectorAll<HTMLElement>('.footer, .tabs-panel').forEach(e => e.style.borderTopColor = t['rowBorder'] ?? '')

  document.querySelectorAll<HTMLElement>('.theme-preview').forEach(p => {
    const theme = p.dataset['theme'] as ThemeName
    p.classList.toggle('active', theme === name)
    const span = p.querySelector<HTMLElement>('span')
    if (span) span.style.color = theme === name ? (t['statusColor'] ?? '') : (t['settingDesc'] ?? '')
  })
}

// ── Collapsible sections ──
function toggleSection(id: string): void {
  const content   = el('section-' + id)
  const indicator = el('indicator-' + id)
  const header    = el('section-header-' + id)
  const isOpen    = content.classList.contains('open')
  content.classList.toggle('open', !isOpen)
  indicator.textContent = isOpen ? '+' : '−'
  header.setAttribute('aria-expanded', String(!isOpen))
}

for (const id of ['lifetime', 'appearance']) {
  const header = el('section-header-' + id)
  header.addEventListener('click', () => toggleSection(id))
  header.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleSection(id) }
  })
}

// ── Renamed tabs panel ──
el('btn-tabs-list').addEventListener('click', () => {
  const panel = el('tabs-panel')
  const btn   = el('btn-tabs-list')
  const isOpen = panel.classList.contains('open')
  panel.classList.toggle('open', !isOpen)
  btn.classList.toggle('active', !isOpen)
  btn.setAttribute('aria-expanded', String(!isOpen))
})

function jumpToTab(row: HTMLElement): void {
  const tabId    = Number(row.dataset['tabId'])
  const windowId = Number(row.dataset['windowId'])
  if (!Number.isFinite(tabId)) return

  const message: JumpToTabMessage = { type: 'jump-to-tab', tabId }
  if (Number.isFinite(windowId)) message.windowId = windowId
  chrome.runtime.sendMessage(message).catch(err => log.error('failed to send jump-to-tab message', err))
  window.close()
}

function closeTabRow(row: HTMLElement): void {
  const tabId = Number(row.dataset['tabId'])
  if (!Number.isFinite(tabId)) return

  chrome.tabs.remove(tabId)
    .then(() => {
      row.remove()
      const panel = el('tabs-panel')
      if (!panel.querySelector('.tab-row')) {
        const empty = document.createElement('div')
        empty.className = 'tabs-panel-empty'
        empty.id = 'tabs-panel-empty'
        empty.textContent = 'No renamed tabs open right now.'
        empty.style.fontSize = FONT_SIZES[currentFontSize]?.['desc'] ?? ''
        panel.appendChild(empty)
      }
    })
    .catch(err => log.error('failed to close tab', err))
}

el('tabs-panel').addEventListener('click', (e: MouseEvent) => {
  const closeBtn = (e.target as HTMLElement).closest('.tab-row-close') as HTMLElement | null
  if (closeBtn) {
    const row = closeBtn.closest('.tab-row') as HTMLElement | null
    if (row) closeTabRow(row)
    return
  }
  const row = (e.target as HTMLElement).closest('.tab-row') as HTMLElement | null
  if (row) jumpToTab(row)
})
el('tabs-panel').addEventListener('keydown', (e: KeyboardEvent) => {
  if (e.key !== 'Enter' && e.key !== ' ') return
  const closeBtn = (e.target as HTMLElement).closest('.tab-row-close') as HTMLElement | null
  if (closeBtn) {
    e.preventDefault()
    const row = closeBtn.closest('.tab-row') as HTMLElement | null
    if (row) closeTabRow(row)
    return
  }
  const row = (e.target as HTMLElement).closest('.tab-row') as HTMLElement | null
  if (!row) return
  e.preventDefault()
  jumpToTab(row)
})

// ── View switching ──
el('btn-settings').addEventListener('click', () => {
  el('view-main').style.display    = 'none'
  el('view-settings').style.display = 'block'
})
el('btn-back').addEventListener('click', () => {
  el('view-settings').style.display = 'none'
  el('view-main').style.display    = 'block'
})

// ── Load settings on open ──
async function loadSettings(): Promise<void> {
  const [settings, renames] = await Promise.all([getSettings(), getRenames()])

  currentTheme = settings.theme
  applyTheme(currentTheme)
  currentFontSize = settings.fontSize
  applyFontSize(currentFontSize)

  const closeEl = el<HTMLInputElement>('toggle-close')
  closeEl.checked = settings.closeAfterRename
  closeEl.setAttribute('aria-checked', String(closeEl.checked))

  const ntEl = el<HTMLInputElement>('toggle-newtab')
  ntEl.checked = settings.openNewTab
  ntEl.setAttribute('aria-checked', String(ntEl.checked))

  const cnEl = el<HTMLInputElement>('toggle-clear-navigate')
  cnEl.checked = settings.clearOnNavigate
  cnEl.setAttribute('aria-checked', String(cnEl.checked))

  const ccEl = el<HTMLInputElement>('toggle-clear-close')
  ccEl.checked = settings.clearOnClose
  ccEl.setAttribute('aria-checked', String(ccEl.checked))

  const acEl = el<HTMLInputElement>('toggle-autocap')
  acEl.checked = settings.autoCapitalize
  acEl.setAttribute('aria-checked', String(acEl.checked))

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (!tab) return
  if (tab.url && renames[tab.url]) input.value = renames[tab.url] ?? ''
}
loadSettings()
  .then(() => loadTabsList())
  .catch(e => log.error('failed to load popup data', e))

const FALLBACK_FAVICON = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23bbb' stroke-width='2'%3E%3Ccircle cx='12' cy='12' r='9'/%3E%3Cpath d='M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18'/%3E%3C/svg%3E"

// ── Load renamed tabs list ──
async function loadTabsList(): Promise<void> {
  const [tabs, renames] = await Promise.all([chrome.tabs.query({}), getRenames()])
  const panel = el('tabs-panel')
  const matches = tabs.filter(t => t.url && findRename(renames, t.url) !== undefined)

  panel.innerHTML = ''

  if (matches.length === 0) {
    const empty = document.createElement('div')
    empty.className = 'tabs-panel-empty'
    empty.id = 'tabs-panel-empty'
    empty.textContent = 'No renamed tabs open right now.'
    empty.style.fontSize = FONT_SIZES[currentFontSize]?.['desc'] ?? ''
    panel.appendChild(empty)
    return
  }

  for (const tab of matches) {
    const title = findRename(renames, tab.url ?? '') ?? ''
    const row = document.createElement('div')
    row.className = 'tab-row'
    if (tab.id != null) row.dataset['tabId'] = String(tab.id)
    if (tab.windowId != null) row.dataset['windowId'] = String(tab.windowId)
    row.setAttribute('role', 'button')
    row.tabIndex = 0
    row.setAttribute('aria-label', `Switch to tab: ${title}`)
    row.style.background  = THEMES[currentTheme]?.['inputBg'] ?? ''
    row.style.borderColor = THEMES[currentTheme]?.['inputBorder'] ?? ''
    row.style.padding = FONT_SIZES[currentFontSize]?.['tabPad'] ?? ''

    const favicon = document.createElement('img')
    favicon.className = 'tab-row-favicon'
    favicon.src = tab.favIconUrl || FALLBACK_FAVICON
    favicon.alt = ''
    favicon.style.width  = FONT_SIZES[currentFontSize]?.['tabFavicon'] ?? ''
    favicon.style.height = FONT_SIZES[currentFontSize]?.['tabFavicon'] ?? ''
    favicon.addEventListener('error', () => { favicon.src = FALLBACK_FAVICON })
    row.appendChild(favicon)

    const titleEl = document.createElement('span')
    titleEl.className = 'tab-row-title'
    titleEl.textContent = title
    titleEl.style.color = THEMES[currentTheme]?.['inputText'] ?? ''
    titleEl.style.fontSize = FONT_SIZES[currentFontSize]?.['tabTitle'] ?? ''
    row.appendChild(titleEl)

    const closeEl = document.createElement('span')
    closeEl.className = 'tab-row-close'
    closeEl.title = 'Close tab'
    closeEl.setAttribute('role', 'button')
    closeEl.setAttribute('aria-label', 'Close tab')
    closeEl.tabIndex = 0
    closeEl.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
    row.appendChild(closeEl)

    panel.appendChild(row)
  }
}

// ── Save settings ──
async function saveSettings(): Promise<void> {
  const settings: Settings = {
    openNewTab:       el<HTMLInputElement>('toggle-newtab').checked,
    closeAfterRename: el<HTMLInputElement>('toggle-close').checked,
    clearOnNavigate:  el<HTMLInputElement>('toggle-clear-navigate').checked,
    clearOnClose:     el<HTMLInputElement>('toggle-clear-close').checked,
    autoCapitalize:   el<HTMLInputElement>('toggle-autocap').checked,
    theme:    currentTheme,
    fontSize: (document.querySelector<HTMLButtonElement>('.fontsize-btn.active')?.dataset['size'] ?? 'default') as FontSizeName,
  }
  await setSettings(settings)
  log.debug('settings saved', settings)
}

el<HTMLInputElement>('toggle-close').addEventListener('change', function () {
  this.setAttribute('aria-checked', String(this.checked))
  saveSettings().catch(e => log.error('save failed', e))
})
el<HTMLInputElement>('toggle-newtab').addEventListener('change', function () {
  this.setAttribute('aria-checked', String(this.checked))
  saveSettings().catch(e => log.error('save failed', e))
})
el<HTMLInputElement>('toggle-clear-navigate').addEventListener('change', function () {
  this.setAttribute('aria-checked', String(this.checked))
  saveSettings().catch(e => log.error('save failed', e))
})
el<HTMLInputElement>('toggle-clear-close').addEventListener('change', function () {
  this.setAttribute('aria-checked', String(this.checked))
  saveSettings().catch(e => log.error('save failed', e))
})
el<HTMLInputElement>('toggle-autocap').addEventListener('change', function () {
  this.setAttribute('aria-checked', String(this.checked))
  saveSettings().catch(e => log.error('save failed', e))
})

// ── Theme selection ──
document.querySelectorAll<HTMLElement>('.theme-preview').forEach(preview => {
  preview.addEventListener('click', async () => {
    currentTheme = (preview.dataset['theme'] as ThemeName) ?? 'default'
    applyTheme(currentTheme)
    await saveSettings()
  })
})

// ── Font size selection ──
document.querySelectorAll<HTMLButtonElement>('.fontsize-btn').forEach(btn => {
  btn.addEventListener('click', async () => {
    currentFontSize = (btn.dataset['size'] as FontSizeName) ?? 'default'
    applyFontSize(currentFontSize)
    await saveSettings()
  })
})

// ── Reset all settings ──
el('btn-reset-settings').addEventListener('click', async () => {
  await setSettings({ ...DEFAULT_SETTINGS })
  el<HTMLInputElement>('toggle-close').checked = true
  el<HTMLInputElement>('toggle-close').setAttribute('aria-checked', 'true')
  el<HTMLInputElement>('toggle-newtab').checked = false
  el<HTMLInputElement>('toggle-newtab').setAttribute('aria-checked', 'false')
  el<HTMLInputElement>('toggle-clear-navigate').checked = false
  el<HTMLInputElement>('toggle-clear-navigate').setAttribute('aria-checked', 'false')
  el<HTMLInputElement>('toggle-clear-close').checked = false
  el<HTMLInputElement>('toggle-clear-close').setAttribute('aria-checked', 'false')
  el<HTMLInputElement>('toggle-autocap').checked = false
  el<HTMLInputElement>('toggle-autocap').setAttribute('aria-checked', 'false')
  currentTheme = 'default'
  applyTheme('default')
  currentFontSize = 'default'
  applyFontSize(currentFontSize)
  log.info('settings reset to defaults')
})

input.addEventListener('blur', () => {
  input.value = formatTitleIfEnabled(input.value)
})

// ── Rename ──
el('btn-rename').addEventListener('click', async () => {
  const val = formatTitleIfEnabled(input.value.trim())
  input.value = val
  if (!val) { setStatus('Enter a title first.', true); return }

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (!tab) { setStatus('Cannot identify tab.', true); return }
    const url = tab.url ?? ''
    if (url.startsWith('edge://') || url.startsWith('chrome://') || url.startsWith('about:')) {
      setStatus('Only works on regular websites.', true)
      return
    }

    const renames = await getRenames()
    renames[url] = val
    await setRenames(renames)
    // Content script self-updates via its storage.onChanged listener — no re-injection needed.
    log.info('renamed tab', { url, title: val })

    const settings = await getSettings()
    if (settings.closeAfterRename) {
      window.close()
    } else {
      setStatus('Tab renamed!')
    }
  } catch (e) {
    log.error('rename failed', e)
    setStatus('Cannot rename this page.', true)
  }
})

// ── Reset ──
el('btn-reset').addEventListener('click', async () => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (!tab) { setStatus('Cannot identify tab.', true); return }
    const url = tab.url ?? ''
    const renames = await getRenames()

    if (!renames[url]) {
      setStatus('No custom name set.', true)
      return
    }

    delete renames[url]
    await setRenames(renames)
    if (tab.id == null) { setStatus('Cannot reload tab.', true); return }
    await chrome.tabs.reload(tab.id)
    input.value = ''
    setStatus('Title restored.')
    log.info('reset tab title', { url })
  } catch (e) {
    log.error('reset failed', e)
    setStatus('Could not restore title.', true)
  }
})

input.addEventListener('keydown', (e: KeyboardEvent) => {
  if (e.key === 'Enter') el<HTMLButtonElement>('btn-rename').click()
})
