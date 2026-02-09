/**
 * Test Utilities - Custom Render Functions
 * 
 * Helpers para renderizar componentes en tests con los providers necesarios.
 * Evita renderizar el layout completo (sidebar, navbar) en tests unitarios.
 * 
 * Uso:
 * - renderComponent: Para tests unitarios de componentes aislados
 * - renderWithRouter: Para tests de páginas que necesitan router
 * - render (de @testing-library/react): Para tests de integración completos
 */

import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import type { RenderOptions } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// ============================================================================
// CUSTOM RENDER - Para Tests Unitarios
// ============================================================================

/**
 * Renderiza un componente con MemoryRouter sin layout completo
 * Ideal para tests unitarios de componentes
 */
export function renderComponent(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, {
    wrapper: ({ children }) => (
      <MemoryRouter>
        {children}
      </MemoryRouter>
    ),
    ...options,
  });
}

/**
 * Renderiza un componente con MemoryRouter y ruta inicial específica
 * Útil para tests que necesitan una URL específica
 */
export function renderWithRouter(
  ui: ReactElement,
  {
    initialEntries = ['/'],
    ...options
  }: {
    initialEntries?: string[];
  } & Omit<RenderOptions, 'wrapper'> = {}
) {
  return render(ui, {
    wrapper: ({ children }) => (
      <MemoryRouter initialEntries={initialEntries}>
        {children}
      </MemoryRouter>
    ),
    ...options,
  });
}

// ============================================================================
// RE-EXPORTS
// ============================================================================

// Re-exportar utilidades de testing-library
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
