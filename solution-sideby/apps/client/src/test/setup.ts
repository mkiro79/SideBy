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
