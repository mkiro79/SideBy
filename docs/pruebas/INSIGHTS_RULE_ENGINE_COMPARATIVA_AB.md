# Cambio aplicado: comparativa A/B por dimensión en RuleEngine

## Qué cambió

Se reemplazó el cálculo de anomalías basado en outliers de datos mezclados por un cálculo de **comparativa explícita entre grupos** (`groupA` vs `groupB`) por cada dimensión.

Archivo principal:
- `solution-sideby/apps/api/src/modules/insights/infrastructure/RuleEngineAdapter.ts`

## Nuevo significado de `metadata.change`

En insights de tipo `anomaly`, `metadata.change` ahora representa:

- **% de variación de `groupB` respecto a `groupA`** para la combinación `(dimension, dimensionValue, kpi)`.

Fórmula:

```text
change = ((groupB - groupA) / groupA) * 100
```

Casos borde:
- si `groupA = 0` y `groupB > 0` => `change = 100`
- si `groupA = 0` y `groupB = 0` => `change = 0`

## Cómo se construyen las comparativas

1. Se agrupa por dimensión + valor de dimensión + KPI.
2. Se acumulan valores separados por grupo (`groupA`, `groupB`).
3. Se calcula `change` para cada fila comparativa.
4. Se generan insights `anomaly` solo si `|change| >= 40%` (threshold actual).
5. Se limita la cantidad de anomalías para evitar ruido.

## Dimensiones combinadas

Si existen varias dimensiones categóricas, además de cada dimensión individual se agrega una dimensión compuesta:

- `__combined__`
- valor tipo: `country=CO | source=Notification/... | page=...`

Esto permite detectar comportamientos por combinación de dimensiones, similar a una tabla resumen cruzada.

## Resultado esperado en tus dudas

- Ahora sí hay comparativa por dimensión entre grupos.
- El mensaje de anomaly ya muestra ambos grupos (A y B) explícitamente.
- `change` deja de ser una desviación contra media global y pasa a ser delta real A/B.
