/**
 * Tests para utilidades de filtros de insights (insightsFilters)
 *
 * Verifica:
 * - Generación de claves de caché estables independientes del orden de filtros categóricos
 * - Construcción de filtros de request que incluyen solo filtros categóricos (excluyendo periodFilter)
 * - Detección de cambios en filtros categóricos, incluyendo casos donde el orden varía pero los valores son idénticos
 */

import { describe, it, expect } from "vitest";
import {
  buildInsightsCategoricalKey,
  buildInsightsRequestFilters,
  hasCategoricalFiltersChanged,
} from "../insightsFilters.js";

describe("insightsFilters", () => {
  it("buildInsightsCategoricalKey debe ser estable sin importar el orden", () => {
    const first = buildInsightsCategoricalKey({
      region: ["Sur", "Norte"],
      channel: ["Retail", "Web"],
    });

    const second = buildInsightsCategoricalKey({
      channel: ["Web", "Retail"],
      region: ["Norte", "Sur"],
    });

    expect(first).toBe(second);
  });

  it("buildInsightsRequestFilters debe incluir solo filtros categóricos", () => {
    const requestFilters = buildInsightsRequestFilters({
      categorical: {
        region: ["Norte"],
      },
      periodFilter: {
        from: 1,
        to: 6,
      },
    });

    expect(requestFilters).toEqual({
      categorical: {
        region: ["Norte"],
      },
    });
    expect(requestFilters).not.toHaveProperty("periodFilter");
  });

  it("hasCategoricalFiltersChanged detecta cambios reales", () => {
    expect(
      hasCategoricalFiltersChanged(
        { region: ["Norte"] },
        { region: ["Norte"] },
      ),
    ).toBe(false);

    expect(
      hasCategoricalFiltersChanged({ region: ["Norte"] }, { region: ["Sur"] }),
    ).toBe(true);

    expect(
      hasCategoricalFiltersChanged(
        { region: ["Sur", "Norte"] },
        { region: ["Norte", "Sur"] },
      ),
    ).toBe(false);
  });
});
