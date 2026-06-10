import type { Renames } from './types'

export function canonicalizeUrl(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl)
    const params = [...new URLSearchParams(parsed.search).entries()]
    params.sort(([a], [b]) => a.localeCompare(b))
    const sorted = new URLSearchParams(params).toString()
    return parsed.origin + parsed.pathname + (sorted ? '?' + sorted : '')
  } catch {
    return rawUrl
  }
}

export function findRenameEntry(renames: Renames, url: string): [string, string] | undefined {
  const exact = renames[url]
  if (typeof exact === 'string') {
    return [url, exact]
  }
  const canonicalUrl = canonicalizeUrl(url)
  for (const [key, value] of Object.entries(renames)) {
    if (canonicalizeUrl(key) === canonicalUrl) {
      return [key, value]
    }
  }
  return undefined
}

export function findRename(renames: Renames, url: string): string | undefined {
  return findRenameEntry(renames, url)?.[1]
}

export function findRenameKey(renames: Renames, url: string): string | undefined {
  return findRenameEntry(renames, url)?.[0]
}
