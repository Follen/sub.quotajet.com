/**
 * Normalize the configured API origin to an http(s) URL suitable for a
 * copied command. Invalid schemes and control characters fall back to the
 * current site origin supplied by the caller.
 */
export function normalizeMarketplaceApiOrigin(value: string, fallbackOrigin = ''): string {
  const fallback = parseMarketplaceApiOrigin(fallbackOrigin)
  return parseMarketplaceApiOrigin(value, fallback) || fallback
}

function parseMarketplaceApiOrigin(value: string, fallbackOrigin = ''): string {
  const candidate = value.trim()
  if (!candidate || hasControlCharacter(candidate)) return ''

  if (candidate.startsWith('/')) {
    // A protocol-relative URL is still an external origin. Backslash is
    // rejected in this position too because URL parsing normalizes /\\evil
    // into a protocol-relative host in browsers.
    if (candidate.startsWith('//') || candidate.startsWith('/\\')) return ''
    if (!fallbackOrigin) return ''

    let fallback: URL
    try {
      fallback = new URL(fallbackOrigin)
    } catch {
      return ''
    }

    let relative: URL
    try {
      relative = new URL(candidate, fallback)
    } catch {
      return ''
    }
    if (relative.origin !== fallback.origin) return ''
    return normalizeParsedMarketplaceApiOrigin(relative)
  }

  let parsed: URL
  try {
    parsed = new URL(candidate)
  } catch {
    return ''
  }

  return normalizeParsedMarketplaceApiOrigin(parsed)
}

function normalizeParsedMarketplaceApiOrigin(parsed: URL): string {

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
