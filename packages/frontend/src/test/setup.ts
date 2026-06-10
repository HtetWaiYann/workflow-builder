import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Radix UI uses ResizeObserver internally for scroll button visibility
globalThis.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Radix UI reads matchMedia for responsive behaviour
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Radix calls pointer-capture and scroll methods that jsdom doesn't implement
if (!HTMLElement.prototype.hasPointerCapture) {
  HTMLElement.prototype.hasPointerCapture = () => false
}
if (!HTMLElement.prototype.releasePointerCapture) {
  HTMLElement.prototype.releasePointerCapture = () => {}
}
if (!HTMLElement.prototype.setPointerCapture) {
  HTMLElement.prototype.setPointerCapture = () => {}
}
if (!HTMLElement.prototype.scrollIntoView) {
  HTMLElement.prototype.scrollIntoView = () => {}
}
if (!HTMLElement.prototype.scrollTo) {
  HTMLElement.prototype.scrollTo = () => {}
}

// Radix Select trigger only opens when event.pointerType === 'mouse'.
// jsdom's PointerEvent leaves pointerType as '' by default, so we patch the
// constructor so that userEvent.click() produces events Radix will respond to.
const OriginalPointerEvent = window.PointerEvent
window.PointerEvent = class extends OriginalPointerEvent {
  constructor(type: string, init: PointerEventInit = {}) {
    super(type, { pointerType: 'mouse', ...init })
  }
} as typeof PointerEvent
