/**
 * Mock Services - Servicios temporales para funcionalidades pendientes
 *
 * Estos servicios retornan promesas que resuelven con console.log
 * hasta que se implementen los endpoints reales del API
 */

// ============================================================================
// NEWSLETTER MOCK
// ============================================================================

export const subscribeToNewsletter = async (email: string): Promise<void> => {
  console.log("🔔 [PENDIENTE] Newsletter subscription:", email);
  // Simular delay de red
  await new Promise((resolve) => setTimeout(resolve, 500));
  return Promise.resolve();
};

// ============================================================================
// CONTACT FORM MOCK
// ============================================================================

export interface ContactFormData {
  name: string;
  email: string;
  message: string;
}

export const sendContactForm = async (data: ContactFormData): Promise<void> => {
  console.log("📧 [PENDIENTE] Contact form submission:", data);
  await new Promise((resolve) => setTimeout(resolve, 800));
  return Promise.resolve();
};

// ============================================================================
// DEMO REQUEST MOCK
// ============================================================================

export const requestDemo = async (email: string): Promise<void> => {
  console.log("🎬 [PENDIENTE] Demo request from:", email);
  await new Promise((resolve) => setTimeout(resolve, 600));
  return Promise.resolve();
};

// ============================================================================
// ANALYTICS MOCK (Product Analytics)
// ============================================================================

export const trackPageView = (pageName: string): void => {
  console.log("📊 [PENDIENTE] Page view tracked:", pageName);
};

export const trackButtonClick = (buttonName: string): void => {
  console.log("🖱️ [PENDIENTE] Button click tracked:", buttonName);
};
