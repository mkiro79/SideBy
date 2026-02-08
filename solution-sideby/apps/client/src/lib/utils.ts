/**
 * Utility Functions
 *
 * Funciones de utilidad compartidas en toda la aplicación
 */

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combina clases de Tailwind CSS con conflicto resolution
 *
 * @param inputs - Array de clases CSS
 * @returns String con clases combinadas y optimizadas
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
