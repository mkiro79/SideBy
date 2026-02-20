import mongoose from "mongoose";
import { DatasetModel } from "/app/src/modules/datasets/infrastructure/mongoose/DatasetSchema.ts";
import { RuleEngineAdapter } from "/app/src/modules/insights/infrastructure/RuleEngineAdapter.ts";

const datasetId = "699741786feb40f109c7e121";
const token =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwOGMyODg1Mi1hNGZkLTQxZmItYThmOS1jOGRkOWE5Yjg5ZTgiLCJlbWFpbCI6Im1hcmliZWwucXVpcm9zLmZvcm1hY2lvbkBnbWFpbC5jb20iLCJyb2xlIjoidXNlciIsImlhdCI6MTc3MTUyMDM1MCwiZXhwIjoxNzcyMTI1MTUwfQ.uaNk_esQuxDKgzshrNmaJjea_zefljqT9GREgH_CERk";
const filters = { categorical: {} as Record<string, string[]> };

const callEndpoint = async (forceRefresh: boolean) => {
  const encodedFilters = encodeURIComponent(JSON.stringify(filters));
  const url = `http://localhost:3000/api/v1/datasets/${datasetId}/insights?filters=${encodedFilters}${forceRefresh ? "&forceRefresh=true" : ""}`;
  const startedAt = Date.now();
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  const endedAt = Date.now();
  const body = await response.json();

  return {
    request: { url, method: "GET", forceRefresh, filters },
    response: {
      status: response.status,
      elapsedMs: endedAt - startedAt,
      meta: body?.meta ?? null,
      insightsCount: Array.isArray(body?.insights)
        ? body.insights.length
        : null,
      hasBusinessNarrative: !!body?.businessNarrative,
    },
    body,
  };
};

const measureRuleEngine = async (dataset: any) => {
  const engine = new RuleEngineAdapter();
  const engineAny = engine as any;

  const t0 = Date.now();
  const filteredData = engineAny.applyFilters(dataset.data, filters);
  const t1 = Date.now();

  const kpiFields = dataset.schemaMapping?.kpiFields ?? [];
  const kpis = engineAny.calculateKPIs(filteredData, kpiFields);
  const t2 = Date.now();

  const dimensions = dataset.schemaMapping?.categoricalFields ?? [];
  const dimensionalComparisons = engineAny.detectDimensionalComparisons(
    filteredData,
    dimensions,
    kpiFields,
  );
  const t3 = Date.now();

  const topPerformer = engineAny.findTopPerformer(dimensionalComparisons);
  const t4 = Date.now();

  const overallChange = engineAny.calculateOverallChange(kpis);
  const t5 = Date.now();

  const fullStart = Date.now();
  const insights = await engine.generateInsights(dataset, filters);
  const fullEnd = Date.now();

  return {
    timingsMs: {
      applyFilters: t1 - t0,
      calculateKPIs: t2 - t1,
      detectDimensionalComparisons: t3 - t2,
      findTopPerformer: t4 - t3,
      calculateOverallChange: t5 - t4,
      generateInsightsTotal: fullEnd - fullStart,
    },
    intermediate: {
      filteredRows: filteredData.length,
      kpisCount: kpis.length,
      kpisPreview: kpis.slice(0, 10),
      dimensionalComparisonsCount: dimensionalComparisons.length,
      dimensionalComparisonsPreview: dimensionalComparisons.slice(0, 15),
      topPerformer,
      overallChange,
    },
    output: {
      insightsCount: insights.length,
      byType: insights.reduce((acc: Record<string, number>, item: any) => {
        acc[item.type] = (acc[item.type] ?? 0) + 1;
        return acc;
      }, {}),
    },
  };
};

const main = async () => {
  const startedAtIso = new Date().toISOString();
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error("MONGO_URI is missing");
  }

  const firstCall = await callEndpoint(true);
  const secondCall = await callEndpoint(false);

  await mongoose.connect(mongoUri);
  const dataset = await DatasetModel.findById(datasetId).lean();

  if (!dataset) {
    throw new Error("Dataset not found");
  }

  const datasetSnapshot = {
    id: String(dataset._id),
    ownerId: dataset.ownerId,
    status: dataset.status,
    aiConfig: dataset.aiConfig,
    meta: dataset.meta,
    sourceConfig: {
      groupA: dataset.sourceConfig?.groupA,
      groupB: dataset.sourceConfig?.groupB,
    },
    schemaMapping: dataset.schemaMapping,
    totalRows: Array.isArray(dataset.data) ? dataset.data.length : 0,
    rowsByGroup: Array.isArray(dataset.data)
      ? dataset.data.reduce((acc: Record<string, number>, row: any) => {
          const key = String(row?._source_group ?? "unknown");
          acc[key] = (acc[key] ?? 0) + 1;
          return acc;
        }, {})
      : {},
  };

  const ruleEngineTrace = await measureRuleEngine({
    ...dataset,
    id: String(dataset._id),
  });

  await mongoose.disconnect();

  console.log(
    JSON.stringify(
      {
        startedAtIso,
        firstCall,
        secondCall,
        datasetSnapshot,
        ruleEngineTrace,
      },
      null,
      2,
    ),
  );
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
