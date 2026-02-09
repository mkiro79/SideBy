/**
 * Vitest Test Setup
 *
 * Configuración global para tests de React + Testing Library
 */

import "@testing-library/jest-dom/vitest";

// Mock de globalThis.matchMedia para componentes que usan media queries
Object.defineProperty(globalThis, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {
      /* mock */
    },
    removeListener: () => {
      /* mock */
    },
    addEventListener: () => {
      /* mock */
    },
    removeEventListener: () => {
      /* mock */
    },
    dispatchEvent: () => {
      /* mock */
    },
  }),
});

// Mock de IntersectionObserver para componentes que lo usan
globalThis.IntersectionObserver = class IntersectionObserver {
  disconnect() {
    /* mock */
  }
  observe() {
    /* mock */
  }
  takeRecords() {
    return [];
  }
  unobserve() {
    /* mock */
  }
} as unknown as typeof IntersectionObserver;

// Mock de ResizeObserver
globalThis.ResizeObserver = class ResizeObserver {
  disconnect() {
    /* mock */
  }
  observe() {
    /* mock */
  }
  unobserve() {
    /* mock */
  }
} as unknown as typeof ResizeObserver;

// Mock de Element.scrollIntoView para Radix UI
Element.prototype.scrollIntoView = () => {
  /* mock */
};

// Mock de PointerEvent para Radix UI
if (typeof PointerEvent === "undefined") {
  (
    globalThis as typeof globalThis & { PointerEvent: typeof PointerEvent }
  ).PointerEvent = class PointerEvent extends MouseEvent {
    public pointerId = 0;
    public width = 0;
    public height = 0;
    public pressure = 0;
    public tangentialPressure = 0;
    public tiltX = 0;
    public tiltY = 0;
    public twist = 0;
    public pointerType = "";
    public isPrimary = false;

    constructor(type: string, params: PointerEventInit = {}) {
      super(type, params);
    }
  } as typeof PointerEvent;
}

// Mock de HTMLElement.hasPointerCapture para Radix UI
if (!HTMLElement.prototype.hasPointerCapture) {
  HTMLElement.prototype.hasPointerCapture = () => false;
}

// Mock de HTMLElement.setPointerCapture y releasePointerCapture para Radix UI
if (!HTMLElement.prototype.setPointerCapture) {
  HTMLElement.prototype.setPointerCapture = () => {
    /* mock */
  };
}

if (!HTMLElement.prototype.releasePointerCapture) {
  HTMLElement.prototype.releasePointerCapture = () => {
    /* mock */
  };
}
