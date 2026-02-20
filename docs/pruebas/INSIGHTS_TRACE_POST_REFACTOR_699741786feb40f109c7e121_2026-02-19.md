# Traza post-refactor: comparativa A/B por dimensión (Docker)

## Objetivo
Validar en runtime que el endpoint de insights refleja la nueva lógica de `RuleEngineAdapter`:

- anomalías por comparación `groupA` vs `groupB` por dimensión,
- soporte de dimensión combinada `__combined__`,
- tiempos reales con `forceRefresh=true`.

## Artefacto generado

- JSON completo de la corrida:
  - `docs/pruebas/insights-flow-raw-after-comparativa.json`

## Resultado principal

### Request 1 (`forceRefresh=true`)
- `status`: `200`
- `meta.cacheStatus`: `miss`
- `meta.narrativeStatus`: `generated`
- `elapsedMs`: `11279`
- `meta.generationTimeMs`: `11242`
- `insightsCount`: `22`

### Request 2 (cache)
- `status`: `200`
- `meta.cacheStatus`: `hit`
- `elapsedMs`: `124`

## Validación funcional del refactor

Se confirma que los mensajes de `anomaly` ya incluyen comparación explícita A/B:

- Ejemplo real:
  - `PushCategoria: En 2026 A=2 vs En 2025 B=297679361 en total_sends (+14883967950.0%, domina En 2025 B).`

También se confirma presencia de anomalías en dimensión combinada (`__combined__`):

- Ejemplo real:
  - `country=CO | source=Notification/Mail/AlertImpact | source_detail=Push Email | page=PushCategoria: En 2026 A=1 vs En 2025 B=55444854 en total_sends (+5544485300.0%, domina En 2025 B).`

## Tiempos internos RuleEngine (medidos)

- `detectDimensionalComparisons`: `131 ms`
- `generateInsightsTotal`: `127 ms`
- `dimensionalComparisonsCount`: `1293`
- salida por tipo: `{"anomaly":20,"suggestion":1,"summary":1}`

## Nota operativa

Para que el endpoint expusiera el código nuevo en runtime fue necesario reiniciar `sideby-api`.