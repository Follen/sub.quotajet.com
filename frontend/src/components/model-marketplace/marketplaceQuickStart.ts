/**
 * Normalize the configured API origin to an http(s) URL suitable for a
 * copied command. Invalid schemes and control characters fall back to the
 * current site origin supplied by the caller.
 */
export function normalizeMarketplaceApiOrigin(value: string, fallbackOrigin = ''): string {
  return parseMarketplaceApiOrigin(value) || parseMarketplaceApiOrigin(fallbackOrigin)
}

function parseMarketplaceApiOrigin(value: string): string {
  const candidate = value.trim()
  if (!candidate || hasControlCharacter(candidate)) return ''

  let parsed: URL
  try {
    parsed = new URL(candidate)
  } catch {
    return ''
  }

  if (!['http:', 'https:'].includes(parsed.protocol.toLowerCase())) return ''
  if (!parsed.hostname || parsed.username || parsed.password) return ''

  // An API origin may be configured with a trailing /v1, but query/hash
  // components are never part of the generated endpoint.
  parsed.search = ''
  parsed.hash = ''
  let pathname = parsed.pathname.replace(/\/+$/, '')
  if (/\/v1$/i.test(pathname)) {
    pathname = pathname.slice(0, -3).replace(/\/+$/, '')
  }
  parsed.pathname = pathname || '/'
  return parsed.toString().replace(/\/$/, '')
}

function hasControlCharacter(value: string): boolean {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index)
    if (code <= 31 || code === 127) return true
  }
  return false
}

/** Quote one argument for POSIX shells, including URLs and JSON payloads. */
export function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'"'"'`)}'`
}
