/**
 * Date Umbrella Utilities
 *
 * Sistema para alinear fechas de diferentes períodos (años) en un eje común
 * para permitir comparaciones válidas "side-by-side".
 *
 * El problema que resuelve:
 * - Cuando comparamos datos de 2023 vs 2024, los gráficos tradicionales
 *   muestran dos líneas separadas en el eje X (no comparables)
 * - Date Umbrella normaliza las fechas por calendario (ignorando año)
 *   para que ambos grupos se puedan comparar en el mismo eje X
 *
 * @example
 * // Datos de entrada
 * const groupA = [{ date: '2023-01-15', revenue: 100 }];
 * const groupB = [{ date: '2024-01-15', revenue: 150 }];
 *
 * // Resultado alineado
 * const result = createDateUmbrella(groupA, groupB, 'date', 'revenue', 'months');
 * // [{
 * //   umbrellaKey: '01',
 * //   label: 'Ene',
 * //   groupA: { originalDate: Date(2023-01-15), year: '2023', value: 100 },
 * //   groupB: { originalDate: Date(2024-01-15), year: '2024', value: 150 }
 * // }]
 */

import type { DataRow } from "../types/api.types.js";

// ============================================================================
// TYPES
// ============================================================================

/**
 * Granularidad temporal para agrupar datos
 */
export type DateGranularity = "days" | "weeks" | "months" | "quarters";

/**
 * Punto de datos alineado en el Date Umbrella
 */
export interface UmbrellaDatePoint {
  /** Clave de agrupación normalizada (ej: "01", "Q1", "Week 03") */
  umbrellaKey: string;

  /** Label para mostrar en el eje X del gráfico */
  label: string;

  /** Datos del Grupo A (null si no hay datos para ese período) */
  groupA: {
    /** Fecha original del dato (la más reciente si hay agregación) */
    originalDate: Date;
    /** Año del dato */
    year: string;
    /** Valor del KPI agregado */
    value: number;
  } | null;

  /** Datos del Grupo B (null si no hay datos para ese período) */
  groupB: {
    originalDate: Date;
    year: string;
    value: number;
  } | null;
}

/**
 * Datos agrupados por clave temporal
 */
interface GroupedData {
  originalDate: Date;
  year: string;
  value: number;
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

/**
 * Alinea datos de dos grupos por fecha calendario
 *
 * @param groupAData - Datos del grupo A con fecha
 * @param groupBData - Datos del grupo B con fecha
 * @param dateField - Nombre del campo de fecha en los datos
 * @param valueField - Nombre del campo de valor (KPI) a comparar
 * @param granularity - Nivel de agrupación (days, weeks, months, quarters)
 * @param omitGaps - Si true, omite períodos donde faltan datos de ambos grupos
 * @param periodFilter - Rango de períodos relativos (índices 1-based según granularidad)
 * @returns Array de puntos alineados para el gráfico
 */
export function createDateUmbrella(
  groupAData: DataRow[],
  groupBData: DataRow[],
  dateField: string,
  valueField: string,
  granularity: DateGranularity = "months",
  omitGaps: boolean = true,
  periodFilter?: { from?: number; to?: number },
): UmbrellaDatePoint[] {
  // 1. Parsear y agrupar datos por granularidad
  const groupAByKey = groupDataByGranularity(
    groupAData,
    dateField,
    valueField,
    granularity,
  );
  const groupBByKey = groupDataByGranularity(
    groupBData,
    dateField,
    valueField,
    granularity,
  );

  // 2. Obtener todas las keys (union de ambos grupos)
  let allKeys = new Set([
    ...Object.keys(groupAByKey),
    ...Object.keys(groupBByKey),
  ]);

  // 3. Si omitGaps=false, generar todas las keys intermedias
  if (!omitGaps && allKeys.size > 0) {
    const sortedKeys = Array.from(allKeys).sort();
    const minKey = sortedKeys[0];
    const maxKey = sortedKeys[sortedKeys.length - 1];

    // Generar todas las keys entre min y max
    const completeKeys = generateKeysInRange(minKey, maxKey, granularity);
    allKeys = new Set(completeKeys);
  }

  // 4. Crear puntos alineados
  const umbrellaPoints: UmbrellaDatePoint[] = [];

  for (const key of Array.from(allKeys).sort()) {
    const pointA = groupAByKey[key] || null;
    const pointB = groupBByKey[key] || null;

    // Omitir si ambos grupos no tienen datos (solo si omitGaps=true)
    if (omitGaps && !pointA && !pointB) continue;

    umbrellaPoints.push({
      umbrellaKey: key,
      label: formatUmbrellaLabel(key, granularity),
      groupA: pointA,
      groupB: pointB,
    });
  }

  // 5. Aplicar filtro de período relativo (opcional)
  if (
    periodFilter &&
    (periodFilter.from !== undefined || periodFilter.to !== undefined)
  ) {
    const fromIndex =
      periodFilter.from !== undefined ? periodFilter.from - 1 : 0; // Convertir a 0-based
    const toIndex =
      periodFilter.to !== undefined ? periodFilter.to : umbrellaPoints.length;

    return umbrellaPoints.slice(fromIndex, toIndex);
  }

  return umbrellaPoints;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Agrupa datos por granularidad temporal
 *
 * @param data - Array de filas de datos
 * @param dateField - Nombre del campo de fecha
 * @param valueField - Nombre del campo de valor
 * @param granularity - Granularidad de agrupación
 * @returns Objeto con datos agrupados por clave temporal
 */
function groupDataByGranularity(
  data: DataRow[],
  dateField: string,
  valueField: string,
  granularity: DateGranularity,
): Record<string, GroupedData> {
  const grouped: Record<string, GroupedData> = {};

  for (const row of data) {
    const dateValue = row[dateField];
    if (!dateValue) continue;

    // Parsear fecha (soporta múltiples formatos)
    const date = parseFlexibleDate(dateValue);
    if (!date || isNaN(date.getTime())) continue;

    // Generar clave según granularidad
    const key = generateGranularityKey(date, granularity);

    // Parsear valor numérico
    const numericValue = Number(row[valueField]) || 0;

    // Agregar o actualizar datos
    if (!grouped[key]) {
      grouped[key] = {
        originalDate: date,
        year: date.getFullYear().toString(),
        value: numericValue,
      };
    } else {
      // Agregar valores si ya existe la key
      grouped[key].value += numericValue;

      // Mantener la fecha más reciente
      if (date.getTime() > grouped[key].originalDate.getTime()) {
        grouped[key].originalDate = date;
      }
    }
  }

  return grouped;
}

/**
 * Genera la clave de agrupación según granularidad
 *
 * @param date - Fecha a procesar
 * @param granularity - Nivel de granularidad
 * @returns Clave de agrupación (ej: "01", "Q2", "Week 15")
 */
function generateGranularityKey(
  date: Date,
  granularity: DateGranularity,
): string {
  const month = date.getMonth() + 1; // 1-12
  const day = date.getDate();

  switch (granularity) {
    case "days":
      // Clave: "MM/DD" (ej: "01/15")
      return `${month.toString().padStart(2, "0")}/${day.toString().padStart(2, "0")}`;

    case "weeks": {
      // Clave: "Week NN" (ej: "Week 03")
      const weekNumber = getWeekNumber(date);
      return `Week ${weekNumber.toString().padStart(2, "0")}`;
    }

    case "months":
      // Clave: "MM" (ej: "03" para Marzo)
      return month.toString().padStart(2, "0");

    case "quarters": {
      // Clave: "QN" (ej: "Q1")
      const quarter = Math.ceil(month / 3);
      return `Q${quarter}`;
    }

    default:
      return month.toString().padStart(2, "0");
  }
}

/**
 * Formatea el label para el eje X del gráfico
 *
 * @param key - Clave de agrupación
 * @param granularity - Nivel de granularidad
 * @returns Label formateado para mostrar
 */
function formatUmbrellaLabel(
  key: string,
  granularity: DateGranularity,
): string {
  // Para quarters y weeks, mantener key como está
  if (granularity === "quarters" || granularity === "weeks") {
    return key;
  }

  // Para days, mantener formato MM/DD
  if (granularity === "days") {
    return key;
  }

  // Para meses, convertir a nombre abreviado en español
  if (granularity === "months") {
    const monthNames = [
      "Ene",
      "Feb",
      "Mar",
      "Abr",
      "May",
      "Jun",
      "Jul",
      "Ago",
      "Sep",
      "Oct",
      "Nov",
      "Dic",
    ];
    const monthIndex = parseInt(key, 10) - 1;
    return monthNames[monthIndex] || key;
  }

  return key;
}

/**
 * Obtiene el número de semana del año (ISO 8601)
 *
 * @param date - Fecha a procesar
 * @returns Número de semana (1-53)
 */
function getWeekNumber(date: Date): number {
  // Algoritmo ISO 8601
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/**
 * Genera todas las keys en un rango dado (para omitGaps=false)
 *
 * @param minKey - Clave mínima
 * @param maxKey - Clave máxima
 * @param granularity - Granularidad
 * @returns Array de todas las keys en el rango
 */
function generateKeysInRange(
  minKey: string,
  maxKey: string,
  granularity: DateGranularity,
): string[] {
  const keys: string[] = [];

  if (granularity === "months") {
    const minMonth = parseInt(minKey, 10);
    const maxMonth = parseInt(maxKey, 10);

    for (let month = minMonth; month <= maxMonth; month++) {
      keys.push(month.toString().padStart(2, "0"));
    }
  } else if (granularity === "quarters") {
    const minQuarter = parseInt(minKey.replace("Q", ""), 10);
    const maxQuarter = parseInt(maxKey.replace("Q", ""), 10);

    for (let q = minQuarter; q <= maxQuarter; q++) {
      keys.push(`Q${q}`);
    }
  } else if (granularity === "weeks") {
    const minWeek = parseInt(minKey.replace("Week ", ""), 10);
    const maxWeek = parseInt(maxKey.replace("Week ", ""), 10);

    for (let w = minWeek; w <= maxWeek; w++) {
      keys.push(`Week ${w.toString().padStart(2, "0")}`);
    }
  } else if (granularity === "days") {
    // Para días, generar TODOS los días del año (01/01 a 31/12)
    // Formato esperado: "MM/DD" o "DD/MM" (asumimos MM/DD basado en generateGranularityKey)

    // Días por mes (año no bisiesto por defecto)
    const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

    for (let month = 1; month <= 12; month++) {
      const maxDay = daysInMonth[month - 1];
      for (let day = 1; day <= maxDay; day++) {
        const monthStr = month.toString().padStart(2, "0");
        const dayStr = day.toString().padStart(2, "0");
        keys.push(`${monthStr}/${dayStr}`);
      }
    }
  }

  return keys;
}

/**
 * Parsea fechas en múltiples formatos (ISO, DD/MM/YYYY, MM/DD/YYYY, etc.)
 *
 * @param value - Valor de fecha (string, number, Date)
 * @returns Objeto Date o null si no se puede parsear
 */
function parseFlexibleDate(
  value: string | number | boolean | Date,
): Date | null {
  if (!value) return null;

  // Si ya es un objeto Date válido
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }

  // Convertir a string
  const dateStr = String(value).trim();

  // Intentar parseo ISO estándar primero (YYYY-MM-DD, YYYY-MM-DDTHH:mm:ss)
  let date = new Date(dateStr);
  if (!isNaN(date.getTime())) {
    return date;
  }

  // Intentar formato DD/MM/YYYY o DD/MM/YY
  const ddmmyyyyMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (ddmmyyyyMatch) {
    const [, day, month, year] = ddmmyyyyMatch;
    let fullYear = parseInt(year, 10);

    // Convertir año de 2 dígitos a 4
    if (fullYear < 100) {
      fullYear += fullYear < 50 ? 2000 : 1900;
    }

    date = new Date(fullYear, parseInt(month, 10) - 1, parseInt(day, 10));
    if (!isNaN(date.getTime())) {
      return date;
    }
  }

  // Intentar formato MM/DD/YYYY (formato americano)
  const mmddyyyyMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (mmddyyyyMatch) {
    const [, month, day, year] = mmddyyyyMatch;
    let fullYear = parseInt(year, 10);

    if (fullYear < 100) {
      fullYear += fullYear < 50 ? 2000 : 1900;
    }

    date = new Date(fullYear, parseInt(month, 10) - 1, parseInt(day, 10));
    if (!isNaN(date.getTime())) {
      // Verificar que el mes sea válido (1-12)
      if (parseInt(month, 10) >= 1 && parseInt(month, 10) <= 12) {
        return date;
      }
    }
  }

  return null;
}
