import { getRenames, getSettings } from '@shared/storage'
import { logger } from '@shared/logger'

const log = logger.content

let activeObserver: MutationObserver | null = null

function lockTitle(title: string): void {
  document.title = title
  if (activeObserver) activeObserver.disconnect()
  const target = document.querySelector('title') ?? document.head
  activeObserver = new MutationObserver(() => {
    if (document.title !== title) document.title = title
  })
  activeObserver.observe(target, { subtree: true, characterData: true, childList: true })
  log.debug('title lock applied', { title })
}

function unlockTitle(): void {
  if (activeObserver) {
    activeObserver.disconnect()
    activeObserver = null
  }
}

function attachNewTabInterceptor(renames: Record<string, string>): void {
  if (window.__tabRenamerHandler) {
    document.removeEventListener('click', window.__tabRenamerHandler)
    window.__tabRenamerHandler = null
  }

  if (window.__tabRenamerStorageHandler) {
    chrome.storage.onChanged.removeListener(window.__tabRenamerStorageHandler)
    window.__tabRenamerStorageHandler = null
  }

  let cachedRenames = renames
  window.__tabRenamerStorageHandler = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
    if (area === 'local' && changes['renames']) {
      cachedRenames = (changes['renames'].newValue as Record<string, string>) ?? {}
    }
  }
  chrome.storage.onChanged.addListener(window.__tabRenamerStorageHandler)

  window.__tabRenamerHandler = (e: MouseEvent) => {
    if (!cachedRenames[location.href]) return
    const anchor = (e.target as HTMLElement).closest('a')
    if (!anchor) return
    const href = anchor.getAttribute('href')
    if (!href || href.startsWith('#') || href.startsWith('javascript')) return
    if (anchor.target === '_blank') return
    e.preventDefault()
    window.open(anchor.href, '_blank')
  }
  document.addEventListener('click', window.__tabRenamerHandler)
  log.debug('new-tab link interceptor attached')
}

;(async () => {
  const url = location.href
  const [renames, settings] = await Promise.all([getRenames(), getSettings()])
  const customTitle = renames[url]

  if (customTitle) lockTitle(customTitle)
  if (customTitle && settings.openNewTab) attachNewTabInterceptor(renames)

  // Self-initialize when a rename is added or removed for this URL without re-injection
  chrome.storage.onChanged.addListener(async (changes, area) => {
    if (area !== 'local' || !changes['renames']) return
    const newRenames = (changes['renames'].newValue as Record<string, string>) ?? {}
    const updatedTitle = newRenames[url]
    const hadTitle = !!(changes['renames'].oldValue as Record<string, string> | undefined)?.[url]

    if (updatedTitle) {
      lockTitle(updatedTitle)
      const currentSettings = await getSettings()
      if (currentSettings.openNewTab) attachNewTabInterceptor(newRenames)
    } else if (hadTitle) {
      unlockTitle()
      if (window.__tabRenamerHandler) {
        document.removeEventListener('click', window.__tabRenamerHandler)
        window.__tabRenamerHandler = null
      }
    }
  })
})()

declare global {
  interface Window {
    __tabRenamerHandler: ((e: MouseEvent) => void) | null
    __tabRenamerStorageHandler: ((changes: Record<string, chrome.storage.StorageChange>, area: string) => void) | null
  }
}
