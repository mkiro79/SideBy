import rateLimit from "express-rate-limit";
import type { Request } from "express";

/**
 * Helper para generar key basada en userId del JWT o IP.
 * - Si hay userId (autenticado): usa el userId
 * - Si no hay userId (no autenticado): usa la IP
 *
 * NOTA: Deshabilitamos la validación de IPv6 porque confiamos en el proxy
 * y la configuración de Express para manejar correctamente las IPs.
 */
const getClientKey = (req: Request & { userId?: string }): string => {
  if (req.userId) {
    return `user:${req.userId}`;
  }
  return req.ip || "unknown";
};

/**
 * Rate limiter para endpoints de subida de archivos (datasets).
 *
 * Límites:
 * - Máximo 10 uploads por hora por usuario
 * - Basado en userId del JWT (o IP como fallback)
 *
 * Headers de respuesta:
 * - X-RateLimit-Limit: Número máximo de requests
 * - X-RateLimit-Remaining: Requests restantes
 * - X-RateLimit-Reset: Timestamp de reset
 */
export const uploadRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 10, // 10 uploads por hora
  message: {
    success: false,
    error: {
      message:
        "Demasiadas solicitudes de subida. Intenta de nuevo en una hora.",
      code: "RATE_LIMIT_EXCEEDED",
    },
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  // Usar userId del JWT si está disponible, sino usar IP normalizada
  keyGenerator: getClientKey,
  // Deshabilitar validación de IPv6 (confiamos en Express config)
  validate: false,
  // Omitir rate limiting en rutas de health check
  skip: (req: Request) => req.path === "/health",
});

/**
 * Rate limiter para endpoints de actualización de mapping.
 *
 * Límites:
 * - Máximo 50 actualizaciones por hora por usuario
 * - Basado en userId del JWT (o IP como fallback)
 *
 * Más permisivo que uploadRateLimiter ya que las actualizaciones de mapping
 * son operaciones más ligeras y los usuarios pueden necesitar iterar
 * sobre la configuración.
 */
export const mappingRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 50, // 50 actualizaciones por hora
  message: {
    success: false,
    error: {
      message: "Demasiadas actualizaciones. Intenta de nuevo más tarde.",
      code: "RATE_LIMIT_EXCEEDED",
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getClientKey,
  validate: false,
  skip: (req: Request) => req.path === "/health",
});

/**
 * Rate limiter general para endpoints de lectura (GET).
 *
 * Límites:
 * - Máximo 100 requests por minuto por usuario
 * - Basado en userId del JWT (o IP como fallback)
 */
export const generalRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 100, // 100 requests por minuto
  message: {
    success: false,
    error: {
      message: "Demasiadas solicitudes. Reduce la frecuencia de peticiones.",
      code: "RATE_LIMIT_EXCEEDED",
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getClientKey,
  validate: false,
  skip: (req: Request) => req.path === "/health",
});
