import { getSettings, setSettings, getRenames, setRenames } from '@shared/storage'
import { logger } from '@shared/logger'
import { DEFAULT_SETTINGS } from '@shared/types'
import type { Settings, ThemeName, FontSizeName } from '@shared/types'

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
  default: { base: '13px', label: '11px', desc: '11px', status: '11px', width: '280px', headerPad: '10px 16px 8px',  bodyPad: '8px 16px 6px',   inputPad: '7px 10px',  btnPad: '7px 0',  rowGap: '7px', settingsBodyPad: '6px 16px 10px', settingRowPad: '8px 0'  },
  large:   { base: '15px', label: '12px', desc: '12px', status: '12px', width: '280px', headerPad: '11px 16px 9px',  bodyPad: '9px 16px 7px',   inputPad: '8px 10px',  btnPad: '8px 0',  rowGap: '7px', settingsBodyPad: '6px 16px 10px', settingRowPad: '8px 0'  },
  larger:  { base: '17px', label: '13px', desc: '13px', status: '13px', width: '300px', headerPad: '12px 18px 10px', bodyPad: '10px 18px 8px',  inputPad: '9px 12px',  btnPad: '9px 0',  rowGap: '8px', settingsBodyPad: '4px 18px 8px',  settingRowPad: '6px 0'  },
  huge:    { base: '20px', label: '15px', desc: '14px', status: '13px', width: '320px', headerPad: '13px 20px 11px', bodyPad: '12px 20px 10px', inputPad: '11px 14px', btnPad: '11px 0', rowGap: '9px', settingsBodyPad: '2px 20px 6px',  settingRowPad: '5px 0'  },
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
  applyFontSize(settings.fontSize)

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

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (!tab) return
  if (tab.url && renames[tab.url]) input.value = renames[tab.url] ?? ''
}
loadSettings().catch(e => log.error('failed to load settings', e))

// ── Save settings ──
async function saveSettings(): Promise<void> {
  const settings: Settings = {
    openNewTab:       el<HTMLInputElement>('toggle-newtab').checked,
    closeAfterRename: el<HTMLInputElement>('toggle-close').checked,
    clearOnNavigate:  el<HTMLInputElement>('toggle-clear-navigate').checked,
    clearOnClose:     el<HTMLInputElement>('toggle-clear-close').checked,
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
    applyFontSize((btn.dataset['size'] as FontSizeName) ?? 'default')
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
  currentTheme = 'default'
  applyTheme('default')
  applyFontSize('default')
  log.info('settings reset to defaults')
})

// ── Rename ──
el('btn-rename').addEventListener('click', async () => {
  const val = input.value.trim()
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
