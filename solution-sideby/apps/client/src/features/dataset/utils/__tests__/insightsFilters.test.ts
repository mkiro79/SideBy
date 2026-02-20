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
  });
});
