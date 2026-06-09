import { getSettings, getRenames, getTabUrls, setRenames, setTabUrls } from '@shared/storage'
import { logger } from '@shared/logger'

const log = logger.background

chrome.tabs.onRemoved.addListener(async (tabId) => {
  const settings = await getSettings()
  if (!settings.clearOnClose) return

  const [renames, tabUrls] = await Promise.all([getRenames(), getTabUrls()])
  const url = tabUrls[tabId]
  if (!url || !renames[url]) return

  delete renames[url]
  delete tabUrls[tabId]
  await Promise.all([setRenames(renames), setTabUrls(tabUrls)])
  log.info('cleared rename on tab close', { tabId, url })
})

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete') return
  const newUrl = tab.url
  if (!newUrl || !newUrl.startsWith('http')) return

  const [settings, renames, tabUrls] = await Promise.all([
    getSettings(),
    getRenames(),
    getTabUrls(),
  ])

  const previousUrl = tabUrls[tabId]
  tabUrls[tabId] = newUrl
  await setTabUrls(tabUrls)

  if (!settings.clearOnNavigate) return
  if (!previousUrl || previousUrl === newUrl) return
  if (!renames[previousUrl]) return

  delete renames[previousUrl]
  await setRenames(renames)
  log.info('cleared rename on navigation', { tabId, from: previousUrl, to: newUrl })
})

chrome.runtime.onStartup.addListener(async () => {
  const currentTabs = await chrome.tabs.query({})
  const currentIds = new Set(currentTabs.map((t) => t.id))
  const tabUrls = await getTabUrls()

  for (const id of Object.keys(tabUrls)) {
    if (!currentIds.has(Number(id))) delete tabUrls[id]
  }
  await setTabUrls(tabUrls)
  log.debug('cleaned stale tabUrls on startup')
})
