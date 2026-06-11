import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useThemeStore } from '@/stores/themeStore'

// Zustand store that persists the selected UI theme to localStorage and exposes
// setTheme to change it. Defaults to 'system' when no value is stored.
describe('themeStore', () => {
  beforeEach(() => {
    localStorage.clear()
    // Reset store to initial state by re-reading from empty localStorage
    useThemeStore.setState({ theme: 'system' })
  })

  it('defaults to system theme when localStorage is empty', () => {
    expect(useThemeStore.getState().theme).toBe('system')
  })

  it('setTheme updates the store state', () => {
    useThemeStore.getState().setTheme('dark')
    expect(useThemeStore.getState().theme).toBe('dark')
  })

  it('setTheme persists the selected theme to localStorage', () => {
    useThemeStore.getState().setTheme('light')
    expect(localStorage.getItem('triggr-theme')).toBe('light')
  })

  it('setTheme can switch between themes', () => {
    useThemeStore.getState().setTheme('dark')
    useThemeStore.getState().setTheme('light')
    expect(useThemeStore.getState().theme).toBe('light')
    expect(localStorage.getItem('triggr-theme')).toBe('light')
  })

  it('does not throw when localStorage throws', () => {
    const spy = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new Error('storage full')
      })
    expect(() => useThemeStore.getState().setTheme('dark')).not.toThrow()
    expect(useThemeStore.getState().theme).toBe('dark')
    spy.mockRestore()
  })
})
