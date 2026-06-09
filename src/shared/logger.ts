type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const LEVEL_RANK: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 }
const IS_DEV = import.meta.env?.DEV ?? false
const MIN_LEVEL: LogLevel = IS_DEV ? 'debug' : 'warn'

function shouldLog(level: LogLevel): boolean {
  return LEVEL_RANK[level] >= LEVEL_RANK[MIN_LEVEL]
}

function makeLogger(namespace: string) {
  const prefix = `[tab-renamer:${namespace}]`
  return {
    debug: (...args: unknown[]) => shouldLog('debug') && console.debug(prefix, ...args),
    info:  (...args: unknown[]) => shouldLog('info')  && console.info(prefix, ...args),
    warn:  (...args: unknown[]) => shouldLog('warn')  && console.warn(prefix, ...args),
    error: (...args: unknown[]) => shouldLog('error') && console.error(prefix, ...args),
  }
}

export const logger = {
  background: makeLogger('background'),
  content:    makeLogger('content'),
  popup:      makeLogger('popup'),
}
