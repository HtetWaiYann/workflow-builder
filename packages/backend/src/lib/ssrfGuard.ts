import { resolve4, resolve6 } from 'node:dns/promises'

/**
 * Regex patterns matching IP ranges that must never be reached by user-supplied URLs.
 * Covers: loopback, RFC-1918 private, link-local (AWS metadata), shared address space,
 * documentation ranges, and their IPv6 equivalents.
 */
const PRIVATE_IP_PATTERNS: RegExp[] = [
  /^127\./, // IPv4 loopback
  /^10\./, // RFC 1918
  /^192\.168\./, // RFC 1918
  /^172\.(1[6-9]|2\d|3[01])\./, // RFC 1918
  /^169\.254\./, // link-local / AWS metadata endpoint
  /^0\./, // current network
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./, // shared address space (RFC 6598)
  /^198\.51\.100\./, // TEST-NET-2 (RFC 5737)
  /^203\.0\.113\./, // TEST-NET-3 (RFC 5737)
  /^::1$/, // IPv6 loopback
  /^fc00:/i, // IPv6 ULA
  /^fd/i, // IPv6 ULA (fd00::/8)
  /^fe80:/i, // IPv6 link-local
]

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'metadata.google.internal', // GCP metadata service
])

function isPrivateAddress(address: string): boolean {
  return PRIVATE_IP_PATTERNS.some((p) => p.test(address))
}

/**
 * Validates that a URL is safe to fetch from the backend, blocking SSRF attacks.
 *
 * Checks:
 * 1. Protocol must be http or https
 * 2. Hostname is not a known-private literal (localhost, etc.)
 * 3. Hostname string itself is not a private IP range
 * 4. All DNS-resolved addresses are not in private IP ranges
 *
 * @param rawUrl - The URL to validate.
 * @throws If the URL is invalid, uses a disallowed protocol, or resolves to a private address.
 */
export async function assertSafeUrl(rawUrl: string): Promise<void> {
  let url: URL
  try {
    url = new URL(rawUrl)
  } catch {
    throw new Error('Invalid URL')
  }

  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error(
      `Protocol '${url.protocol}' is not allowed — use http or https`
    )
  }

  const hostname = url.hostname.toLowerCase()

  if (BLOCKED_HOSTNAMES.has(hostname)) {
    throw new Error(`Hostname '${hostname}' is not allowed`)
  }

  // Block raw private IP addresses supplied directly (no DNS lookup needed)
  if (isPrivateAddress(hostname)) {
    throw new Error(`URL points to a private or reserved address: ${hostname}`)
  }

  // Resolve the hostname and verify every returned address is public.
  // This blocks hostnames that map to internal IPs without requiring the
  // attacker to supply a raw IP.
  const [v4, v6] = await Promise.all([
    resolve4(hostname).catch((): string[] => []),
    resolve6(hostname).catch((): string[] => []),
  ])
  const addresses = [...v4, ...v6]

  if (addresses.length === 0) {
    throw new Error(`Cannot resolve hostname: ${hostname}`)
  }

  for (const addr of addresses) {
    if (isPrivateAddress(addr)) {
      throw new Error(
        `URL resolves to a private or reserved IP address: ${addr}`
      )
    }
  }
}
