import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('node:dns/promises', () => ({
  resolve4: vi.fn(),
  resolve6: vi.fn(),
}))

import { resolve4, resolve6 } from 'node:dns/promises'
import { assertSafeUrl } from './ssrfGuard'

const mockResolve4 = vi.mocked(resolve4)
const mockResolve6 = vi.mocked(resolve6)

beforeEach(() => {
  vi.clearAllMocks()
  // Default: resolves to a real public IP that passes all checks
  mockResolve4.mockResolvedValue(['1.2.3.4'])
  mockResolve6.mockResolvedValue([])
})

// Validates that a URL is safe to fetch from the backend, blocking SSRF attacks.
// Rejects private IPs, blocked hostnames, bad protocols, and non-resolvable hosts.
describe('assertSafeUrl', () => {
  it('resolves without error for a valid public https URL', async () => {
    await expect(
      assertSafeUrl('https://example.com/api')
    ).resolves.toBeUndefined()
  })

  it('resolves without error for a valid public http URL', async () => {
    await expect(assertSafeUrl('http://example.com/')).resolves.toBeUndefined()
  })

  it('throws for a completely invalid URL string', async () => {
    await expect(assertSafeUrl('not-a-url')).rejects.toThrow('Invalid URL')
  })

  it('throws when the protocol is ftp', async () => {
    await expect(assertSafeUrl('ftp://example.com/file')).rejects.toThrow(
      "Protocol 'ftp:' is not allowed"
    )
  })

  it('throws for the localhost hostname', async () => {
    await expect(assertSafeUrl('http://localhost/api')).rejects.toThrow(
      "Hostname 'localhost' is not allowed"
    )
  })

  it('throws for the GCP metadata service hostname', async () => {
    await expect(
      assertSafeUrl('http://metadata.google.internal/')
    ).rejects.toThrow("Hostname 'metadata.google.internal' is not allowed")
  })

  it('throws when the raw hostname is a loopback IP (127.x)', async () => {
    await expect(assertSafeUrl('http://127.0.0.1/')).rejects.toThrow(
      'private or reserved address'
    )
  })

  it('throws when the raw hostname is a private RFC-1918 10.x address', async () => {
    await expect(assertSafeUrl('http://10.0.0.1/')).rejects.toThrow(
      'private or reserved address'
    )
  })

  it('throws when the raw hostname is a private 192.168.x address', async () => {
    await expect(assertSafeUrl('http://192.168.1.100/')).rejects.toThrow(
      'private or reserved address'
    )
  })

  it('throws when the raw hostname is the link-local (AWS metadata) range', async () => {
    await expect(assertSafeUrl('http://169.254.169.254/')).rejects.toThrow(
      'private or reserved address'
    )
  })

  it('throws when DNS resolves to a private RFC-1918 address', async () => {
    mockResolve4.mockResolvedValue(['10.0.0.5'])
    await expect(
      assertSafeUrl('https://internal.corp.example.com/')
    ).rejects.toThrow('URL resolves to a private or reserved IP address')
  })

  it('throws when the hostname cannot be resolved (empty DNS response)', async () => {
    mockResolve4.mockResolvedValue([])
    mockResolve6.mockResolvedValue([])
    await expect(
      assertSafeUrl('https://no-such-host.invalid/')
    ).rejects.toThrow('Cannot resolve hostname')
  })

  it('passes when only IPv6 resolves to a public address', async () => {
    mockResolve4.mockResolvedValue([])
    mockResolve6.mockResolvedValue(['2001:db9::1'])
    await expect(
      assertSafeUrl('https://ipv6only.example.com/')
    ).resolves.toBeUndefined()
  })

  it('throws when an IPv6 address resolves to the loopback', async () => {
    mockResolve4.mockResolvedValue([])
    mockResolve6.mockResolvedValue(['::1'])
    await expect(assertSafeUrl('https://sneaky.example.com/')).rejects.toThrow(
      'URL resolves to a private or reserved IP address'
    )
  })
})
