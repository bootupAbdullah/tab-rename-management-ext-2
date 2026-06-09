import type { Settings, Renames, TabUrls } from './types'
import { DEFAULT_SETTINGS } from './types'

export async function getSettings(): Promise<Settings> {
  const { settings } = await chrome.storage.local.get('settings')
  return { ...DEFAULT_SETTINGS, ...(settings ?? {}) }
}

export async function setSettings(settings: Settings): Promise<void> {
  await chrome.storage.local.set({ settings })
}

export async function getRenames(): Promise<Renames> {
  const { renames } = await chrome.storage.local.get('renames')
  return (renames as Renames) ?? {}
}

export async function setRenames(renames: Renames): Promise<void> {
  await chrome.storage.local.set({ renames })
}

export async function getTabUrls(): Promise<TabUrls> {
  const { tabUrls } = await chrome.storage.local.get('tabUrls')
  return (tabUrls as TabUrls) ?? {}
}

export async function setTabUrls(tabUrls: TabUrls): Promise<void> {
  await chrome.storage.local.set({ tabUrls })
}
