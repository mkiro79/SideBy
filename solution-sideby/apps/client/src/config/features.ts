/**
 * Global Feature Flags Configuration
 *
 * Sistema centralizado para controlar características que están en desarrollo
 * o que se activan bajo demanda. Todas las feature flags deben estar aquí.
 *
 * @see .env.example para configurar las variables de entorno
 */

/**
 * Feature Flags disponibles en la aplicación
 */
export const FEATURES = Object.freeze({
  /**
   * Habilita/deshabilita el login con Email/Password
   * Por defecto usa solo Google OAuth
   *
   * @default false
   * @env VITE_FEATURE_EMAIL_LOGIN
   */
  EMAIL_LOGIN: import.meta.env.VITE_FEATURE_EMAIL_LOGIN === "true" || false,

  /**
   * Habilita/deshabilita la funcionalidad de análisis con IA
   * Controla la sección de prompt de IA en ConfigurationStep del wizard
   *
   * @default false
   * @env VITE_FEATURE_AI_ENABLED
   */
  AI_ENABLED: import.meta.env.VITE_FEATURE_AI_ENABLED === "true" || false,

  // Futuras features...
  // ADVANCED_FILTERS: import.meta.env.VITE_FEATURE_ADVANCED_FILTERS === 'true' || false,
  // EXPORT_PDF: import.meta.env.VITE_FEATURE_EXPORT_PDF === 'true' || false,
} as const);

export type FeatureFlags = typeof FEATURES;

/**
 * Helper para debugging en desarrollo
 * Solo se ejecuta en modo development
 */
if (import.meta.env.DEV) {
  console.log("[Feature Flags] Configuration loaded:", FEATURES);
}

/**
 * Helper para verificar si una feature está habilitada
 * Útil para checks condicionales complejos
 *
 * @param feature - Nombre de la feature a verificar
 * @returns true si la feature está habilitada
 */
export function isFeatureEnabled(feature: keyof FeatureFlags): boolean {
  return FEATURES[feature];
}
