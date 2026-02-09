# [RFC-003-A] Adéndum: UI Simplificada de Auto-Mapeo / Addendum: Simplified Auto-Mapping UI

| Metadatos | Detalles |
| :--- | :--- |
| **RFC Padre / Parent RFC** | RFC-003 (Schema Mapping) |
| **Fecha / Date** | 2026-02-08 |
| **Estado / Status** | **Aprobado para Implementación / Approved for Implementation** |
| **Alcance / Scope** | `apps/client/src/features/dataset/components/wizard/MappingStep.tsx` |

---

## 1. Contexto y Motivación / Context & Motivation
El diseño original proponía una configuración detallada, fila por fila, para cada columna. Este enfoque incrementa la carga cognitiva y la fricción durante el proceso de onboarding. 
**Objetivo:** Reemplazar la tabla de mapeo compleja por un **Asistente Simplificado** que clasifique las columnas de forma automática y solo le pida al usuario selecciones de alto nivel.
The original design proposed a detailed, row-by-row configuration for each column. This approach increases cognitive load and friction during the onboarding process. 
**Goal:** Replace the complex mapping table with a **Simplified Wizard** that auto-classifies columns and asks the user for high-level selections only.

## 2. Lógica de Auto-Detección (Backend/Frontend) / Auto-Detection Logic (Backend/Frontend)
En lugar de pedirle al usuario que defina los tipos, el sistema los inferirá automáticamente basándose en las primeras 50 filas del CSV:
Instead of asking the user to define types, the system will infer them automatically based on the first 50 rows of the CSV:

1.  **Detección de Fechas:** Escanear formatos comunes de fecha (`YYYY-MM-DD`, `DD/MM/YYYY`, ISO8601). La primera coincidencia se propone como el campo de "Serie Temporal".  
1.  **Date Detection:** Scan for common date formats (`YYYY-MM-DD`, `DD/MM/YYYY`, ISO8601). The first match is proposed as the "Time Series" field.
2.  **Detección Numérica:** Si una columna contiene solo números (o nulos), se clasifica como **Métrica (KPI)**.  
2.  **Numeric Detection:** If a column contains only numbers (or nulls), it is classified as **Metric (KPI)**.
3.  **Detección de Cadenas:** Todo lo demás se clasifica como **Dimensión (Categoría)**.  
3.  **String Detection:** Everything else is classified as **Dimension (Category)**.

---

## 3. Especificación Revisada de UI (El "Modo Fácil") / Revised UI Specification (The "Easy Mode")

La pantalla del Paso 2 se divide en 3 secciones claras.  
The Step 2 Screen is divided into 3 clear sections.

### Sección A: Referencia Temporal (Parte Superior) / Section A: Time Reference (Top)
* **Etiqueta / Label:** "Selecciona la columna de fecha (para tendencias en el tiempo)" / "Select Date Column (for Time Trends)"
* **Componente / Component:** Dropdown de selección única / Single Select Dropdown.
* **Comportamiento / Behavior:** Preseleccionado con la columna de fecha auto-detectada. Opcional (el usuario puede seleccionar "Sin fecha" / "No Date").

### Sección B: Métricas y KPIs (Columna Izquierda) / Section B: Metrics & KPIs (Left Column)
* **Título / Title:** "Campos numéricos (Métricas)" / "Numeric Fields (Metrics)"
* **Descripción / Description:** "Selecciona los números que quieres analizar. Hasta 4 se mostrarán como tarjetas de KPI." / "Select the numbers you want to analyze. Up to 4 will be shown as KPI Cards."
* **Componente / Component:** Grupo de checklist / Checklist Group.
* **Comportamiento / Behavior:**
    * **Lista / List:** Muestra todas las columnas detectadas como numéricas. / Displays all columns detected as Numeric.
    * **Selección / Selection:** Checkboxes para incluir/excluir del dataset. / Checkboxes to include/exclude from the dataset.
    * **Restricción / Constraint:** Máx. 4 elementos seleccionables para el MVP (para mapear directamente a las 4 tarjetas del dashboard). / Max 4 items selectable for the MVP (to map directly to the 4 Dashboard Cards).
    * **Agregación / Aggregation:** Todas las métricas seleccionadas usarán por defecto **SUM** internamente. No se requiere elección del usuario. / All selected metrics will default to **SUM** internally. No user choice required.

### Sección C: Dimensiones (Columna Derecha) / Section C: Dimensions (Right Column)
* **Título / Title:** "Campos categóricos (Filtros)" / "Categorical Fields (Filters)"
* **Descripción / Description:** "Selecciona campos de texto para usar como filtros o segmentos (p. ej., País, Producto)." / "Select text fields to use as filters or segments (e.g., Country, Product)."
* **Componente / Component:** Grupo de checklist (scrollable si hay muchos). / Checklist Group (Scrollable if many).
* **Comportamiento / Behavior:**
    * **Lista / List:** Muestra todas las columnas detectadas como cadena/categoría. / Displays all columns detected as String/Category.
    * **Selección / Selection:** Checkboxes para incluir/excluir. / Checkboxes to include/exclude.
    * **Por defecto / Default:** Todas marcadas por defecto (o un límite inteligente si hay >20 columnas). / All checked by default (or smart limit if >20 columns).

---

## 4. Restricciones Técnicas (MVP) / Technical Constraints (MVP)
Para simplificar la experiencia de usuario, aplican las siguientes restricciones:  
To simplify the user experience, the following constraints apply:

1.  **Sin renombrado / No Renaming:** El sistema utilizará directamente los nombres de cabecera del CSV. La UI no ofrecerá un campo de entrada "Renombrar" en este paso.  
1.  **No Renaming:** The system will use the CSV header names directly. The UI will not offer a "Rename" input field in this step.
2.  **Tipos fijos / Fixed Types:** Las personas usuarias no pueden cambiar manualmente una columna "Texto" a "Número" en este asistente. La lógica de parseo debe ser robusta.  
2.  **Fixed Types:** Users cannot manually change a "Text" column to "Number" in this wizard. The parsing logic must be robust.
3.  **Complejidad oculta / Hidden Complexity:** Los métodos de agregación (Average, Count, Min, Max) se ocultan. El sistema asume `SUM` para todos los campos numéricos.  
3.  **Hidden Complexity:** Aggregation methods (Average, Count, Min, Max) are hidden. The system assumes `SUM` for all numeric fields.

## 5. Referencia Visual (Descripción de Wireframe) / Visual Reference (Wireframe Description)
A continuación se muestra un esquema en texto de la pantalla del Paso 2. / The following is a text-based sketch of the Step 2 screen.

```text
+---------------------------------------------------------------+
|  [ Step 1 ] > [ Step 2: Mapping ] > [ Step 3 ]                |
+---------------------------------------------------------------+
|                                                               |
|  1. Time Series (Optional)                                    |
|  [ Date (Auto-detected)  v ]                                  |
|                                                               |
|  -----------------------------------------------------------  |
|                                                               |
|  2. Select Data to Import                                     |
|                                                               |
|  [ NUMBERS / KPIs ]            [ TEXT / DIMENSIONS ]          |
|  (Select max 4)                (Select for filtering)         |
|                                                               |
|  [x] Revenue                   [x] Country                    |
|  [x] Cost                      [x] Product_Category           |
|  [x] Units_Sold                [ ] Internal_ID (Unchecked)    |
|  [ ] Profit_Margin             [x] Region                     |
|  [ ] Tax_Rate                  [ ] Comments                   |
|                                                               |
|  -----------------------------------------------------------  |
|                                                               |
|                      [ < Back ]  [ Next: Analyze > ]          |
+---------------------------------------------------------------+