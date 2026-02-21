# RFC: Implementación de Semantic Caching con TTL para LLM Insights

## 1. Contexto y Objetivo
Actualmente, el sistema genera resúmenes ejecutivos utilizando un LLM local (Ollama/Qwen/Llama) basado en los insights deterministas calculados por el `RuleEngineAdapter`. 
Dado que la generación del LLM es costosa computacionalmente y dependiente de los filtros dinámicos del dashboard, necesitamos implementar un sistema de **Caché Semántica** para evitar llamadas redundantes al LLM cuando un usuario (o múltiples usuarios) consultan el mismo dataset con los mismos filtros.

El objetivo es reducir la latencia de respuesta de ~4 segundos a <50ms para consultas repetidas, utilizando MongoDB con un índice TTL (Time-To-Live) para la autolimpieza de datos obsoletos.

## 2. Arquitectura de la Solución
1. **Generación de Hash (Cache Key):** Se creará un hash criptográfico (SHA-256) determinista basado en el `datasetId` y los filtros activos (`DashboardFilters`). Es crítico ordenar alfabéticamente las claves de los filtros antes de serializar para garantizar que `{a: 1, b: 2}` y `{b: 2, a: 1}` generen el mismo hash.
2. **Persistencia Transitoria (MongoDB TTL):** Se creará una nueva colección `InsightCache` que almacenará la respuesta del LLM asociada al hash. Los documentos se eliminarán automáticamente a las 24 horas usando un índice TTL nativo de MongoDB.
3. **Flujo de Orquestación:** Antes de llamar al endpoint de Ollama (`/chat/completions`), el sistema comprobará si existe el hash en la base de datos (Cache Hit). Si no existe (Cache Miss), llamará al LLM y guardará el resultado.

---

## 3. Instrucciones de Implementación para el Agente (Tasks)

Por favor, implementa los siguientes componentes en TypeScript:

### Task 1: Crear el Schema y Modelo de Mongoose (`InsightCache`)
Crea un nuevo archivo para el modelo de Mongoose que cumpla con la siguiente interfaz. Asegúrate de añadir el índice TTL.

- **Campos requeridos:**
  - `cacheKey`: String, required, unique, indexado.
  - `datasetId`: String o ObjectId (según corresponda en el proyecto), required.
  - `filters`: Schema.Types.Mixed (Opcional, útil para debugear qué filtros generaron este hash).
  - `summary`: Schema.Types.Mixed (El JSON de respuesta del LLM).
  - `createdAt`: Date, default `Date.now`, **index TTL de 86400 segundos (24 horas)**.

### Task 2: Implementar el Generador de Hash (`InsightCacheManager`)
Crea una clase o servicio utilitario que utilice `node:crypto` nativo. 

**Requisitos estrictos de la función:**
1. Debe recibir el `datasetId` y el objeto `filters`.
2. Debe implementar una función privada `sortObjectKeys(obj)` que ordene las propiedades del objeto de forma recursiva.
3. Debe hacer un `JSON.stringify` del objeto ordenado junto con el `datasetId`.
4. Debe devolver un string hexadecimal usando `createHash("sha256")`.

### Task 3: Actualizar el Orquestador del LLM (Integración)
Modifica el servicio que actualmente hace el `fetch` a `/chat/completions`. El nuevo flujo debe ser:

```typescript
// Pseudo-código esperado:
const cacheKey = cacheManager.generateCacheKey(input.datasetId, input.filters);
const cachedResult = await InsightCacheModel.findOne({ cacheKey });

if (cachedResult) {
  return cachedResult.summary; // Cache Hit
}

// Cache Miss: Proceder con la llamada al LLM
const response = await fetch(/* ... lógica actual del LLM ... */);
const generatedSummary = await response.json();

// Guardar en MongoDB de forma asíncrona (no bloquear el return)
await InsightCacheModel.create({
  cacheKey,
  datasetId: input.datasetId,
  filters: input.filters,
  summary: generatedSummary
});

return generatedSummary;
```

### Task 4: Modificar el prompt del LLM para mejorar las respuestas
Asegúrate de que el prompt incluya instrucciones claras para generar resúmenes ejecutivos concisos, enfocados en insights accionables, y que evite información redundante. Esto mejorará la calidad de las respuestas almacenadas en caché.
Algo como:
```typescript
const systemPrompt = `
Eres un Analista de Datos Senior reportando directamente a la directiva (C-Level). 
Tu objetivo es interpretar un conjunto de anomalías e insights pre-calculados por nuestro motor de reglas (Rule Engine) y generar un resumen ejecutivo de altísimo nivel.

REGLAS DE REDACCIÓN (ESTRICTAS):
1. CERO INTRODUCCIONES: No uses frases vacías como "A continuación presento el análisis", "Basado en los datos", o "En resumen". Ve directo al grano.
2. SÍNTESIS DE NEGOCIO: No repitas los números como un loro. Si el JSON de entrada dice "PushCargo subió 6000%", tu trabajo es inferir el impacto (ej. "Crecimiento explosivo y atípico en PushCargo que lidera la tracción del periodo").
3. AGRUPACIÓN: Si ves múltiples anomalías positivas en países (ej. CO y MX) o fuentes, agrúpalas en una sola conclusión lógica.
4. TONO: Directo, analítico, frío y orientado a la acción.

FORMATO DE SALIDA OBLIGATORIO:
Debes responder ÚNICA y EXCLUSIVAMENTE con un objeto JSON válido que siga EXACTAMENTE esta estructura, sin texto markdown fuera del JSON:

{
  "estado_general": "Una frase contundente (máximo 15 palabras) resumiendo la tendencia global o el impacto de los KPIs.",
  "hallazgos_clave": [
    "Viñeta 1: El patrón o anomalía más crítica detectada y su posible impacto.",
    "Viñeta 2: Agrupación de otras anomalías secundarias relevantes.",
    "Viñeta 3: (Opcional) Otro hallazgo destacable si lo hay."
  ],
  "recomendacion": "Una única recomendación táctica o área a investigar basada en los datos (ej. 'Investigar la fuente de tráfico de MX y CO para replicar la campaña')."
}
`;
```

## Task 5: Los calculos del Rule Engine revision

Necesitamos revisar los cálculos actuales del `RuleEngineAdapter` para asegurarnos de que los insights generados sean consistentes y relevantes para el LLM. Esto incluye validar que los KPIs y anomalías detectadas estén correctamente formateados y sean comprensibles para el modelo de lenguaje.
Ahora mismo el creo que tiene invertido los calculos delta, asegurate que se calculan como esta en la funcion de client solution-sideby\apps\client\src\features\dataset\utils\delta.ts

El contraste se tiene que hacer respecto al grupo de base B. Si el grupo A es mayor que el B hay crecimiento sino descrecimiento, ahora mismo esta al reves, revisa eso y asegurate que el delta se calcula como (A-B)/B para que el resultado sea positivo en caso de crecimiento y negativo en caso de descrecimiento.

---

## 4. Registro de Implementación Backend (2026-02-20)

### Estado general

- [x] **Task 1** completada: persistencia TTL en MongoDB.
- [x] **Task 2** completada: hash SHA-256 determinista con orden recursivo de claves.
- [x] **Task 3** completada: integración de caché semántica en flujo de insights con guardado asíncrono.
- [x] **Task 4** completada: prompt de narrativa reforzado para síntesis ejecutiva accionable.
- [x] **Task 5** completada: corrección de delta en `RuleEngineAdapter` con baseline grupo B.

### Cambios implementados

1. **Caché persistente TTL (`InsightCache`)**
  - Archivo: `solution-sideby/apps/api/src/modules/insights/infrastructure/mongoose/InsightCacheSchema.ts`.
  - Colección: `insight_cache`.
  - Campos: `cacheKey`, `datasetId`, `filters`, `summary`, `language`, `promptVersion`, `createdAt`.
  - TTL configurable por env: `INSIGHTS_SUMMARY_CACHE_TTL_SECONDS` (default `86400`).

2. **Generación de cache key semántica**
  - Archivo: `solution-sideby/apps/api/src/modules/insights/infrastructure/InsightCacheManager.ts`.
  - Hash sobre payload normalizado con:
    - `datasetId`
    - `filters` (ordenado recursivamente)
    - `language`
    - `promptVersion`
  - Algoritmo: `createHash("sha256")`.

3. **Estrategia de caché híbrida (memoria + Mongo)**
  - Archivo: `solution-sideby/apps/api/src/modules/insights/infrastructure/HybridInsightsCacheRepository.ts`.
  - Prioridad:
    1) hit en memoria,
    2) fallback a Mongo,
    3) warm-up de memoria si Mongo responde.
  - Se conserva la caché en memoria existente y se añade persistencia temporal.

4. **Integración en el orquestador de insights**
  - Use case: `solution-sideby/apps/api/src/modules/insights/application/use-cases/GenerateInsightsUseCase.ts`.
  - Controller composition root: `solution-sideby/apps/api/src/modules/insights/presentation/insights.controller.ts`.
  - Flujo actual:
    - Consulta caché semántica con contexto (`language`, `promptVersion`).
    - Si no hay hit, genera insights/rules + narrativa opcional LLM.
    - Persiste snapshot completo de respuesta (`insights` + `businessNarrative`) de forma asíncrona (sin bloquear response).
    - Si falla persistencia, log warning y fallback silencioso.

5. **Corrección de delta en Rule Engine**
  - Archivo: `solution-sideby/apps/api/src/modules/insights/infrastructure/RuleEngineAdapter.ts`.
  - Fórmula actualizada a: `(A - B) / B * 100`.
  - Comportamiento:
    - `A > B` => crecimiento positivo.
    - `A < B` => decrecimiento negativo.

6. **Mejora del prompt LLM**
  - Archivo: `solution-sideby/apps/api/src/modules/insights/infrastructure/LLMNarratorAdapter.ts`.
  - Se refuerzan reglas de redacción para salida ejecutiva, directa, sin redundancias y accionable.

7. **Configuración de entorno**
  - Archivo: `solution-sideby/apps/api/.env.example`.
  - Nuevas variables:
    - `INSIGHTS_LLM_PROMPT_VERSION=v1`
    - `INSIGHTS_SUMMARY_CACHE_TTL_SECONDS=86400`

### Testing y validación

- Tests unitarios de insights en verde.
- Cobertura objetivo validada en use case principal (`> 80%`).
- Build backend exitoso (`npm run build:api`).

### Rama de trabajo

- `feat/rfc-010-ai-insights-summary-cache-previo`