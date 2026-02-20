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