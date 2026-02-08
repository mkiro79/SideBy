# [RFC-003-A] Addendum: Simplified Auto-Mapping UI

| Metadata | Details |
| :--- | :--- |
| **Parent RFC** | RFC-003 (Schema Mapping) |
| **Date** | 2026-02-08 |
| **Status** | **Approved for Implementation** |
| **Scope** | `apps/client/src/features/dataset/components/wizard/MappingStep.tsx` |

---

## 1. Context & Motivation
The original design proposed a detailed, row-by-row configuration for each column. This approach increases cognitive load and friction during the onboarding process. 
**Goal:** Replace the complex mapping table with a **Simplified Wizard** that auto-classifies columns and asks the user for high-level selections only.

## 2. Auto-Detection Logic (Backend/Frontend)
Instead of asking the user to define types, the system will infer them automatically based on the first 50 rows of the CSV:

1.  **Date Detection:** Scan for common date formats (`YYYY-MM-DD`, `DD/MM/YYYY`, ISO8601). The first match is proposed as the "Time Series" field.
2.  **Numeric Detection:** If a column contains only numbers (or nulls), it is classified as **Metric (KPI)**.
3.  **String Detection:** Everything else is classified as **Dimension (Category)**.

---

## 3. Revised UI Specification (The "Easy Mode")

The Step 2 Screen is divided into 3 clear sections.

### Section A: Time Reference (Top)
* **Label:** "Select Date Column (for Time Trends)"
* **Component:** Single Select Dropdown.
* **Behavior:** Pre-selected with the auto-detected date column. Optional (user can select "No Date").

### Section B: Metrics & KPIs (Left Column)
* **Title:** "Numeric Fields (Metrics)"
* **Description:** "Select the numbers you want to analyze. Up to 4 will be shown as KPI Cards."
* **Component:** Checklist Group.
* **Behavior:**
    * **List:** Displays all columns detected as Numeric.
    * **Selection:** Checkboxes to include/exclude from the dataset.
    * **Constraint:** Max 4 items selectable for the MVP (to map directly to the 4 Dashboard Cards).
    * **Aggregation:** All selected metrics will default to **SUM** internally. No user choice required.

### Section C: Dimensions (Right Column)
* **Title:** "Categorical Fields (Filters)"
* **Description:** "Select text fields to use as filters or segments (e.g., Country, Product)."
* **Component:** Checklist Group (Scrollable if many).
* **Behavior:**
    * **List:** Displays all columns detected as String/Category.
    * **Selection:** Checkboxes to include/exclude.
    * **Default:** All checked by default (or smart limit if >20 columns).

---

## 4. Technical Constraints (MVP)
To simplify the user experience, the following constraints apply:

1.  **No Renaming:** The system will use the CSV header names directly. The UI will not offer a "Rename" input field in this step.
2.  **Fixed Types:** Users cannot manually change a "Text" column to "Number" in this wizard. The parsing logic must be robust.
3.  **Hidden Complexity:** Aggregation methods (Average, Count, Min, Max) are hidden. The system assumes `SUM` for all numeric fields.

## 5. Visual Reference (Wireframe Description)

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