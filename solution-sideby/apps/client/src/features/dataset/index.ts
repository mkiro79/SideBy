/**
 * Dataset Feature - Barrel Exports
 * Simplifica las importaciones de componentes del módulo de datasets
 */

// Pages
export { DatasetsList } from "./pages/DatasetsList.js";

// Components
export { DatasetCard } from "./components/DatasetCard.js";
export { EmptyDatasets } from "./components/EmptyDatasets.js";

// Hooks
export { useDatasets } from "./hooks/useDatasets.js";

// Services
export * as datasetService from "./services/datasetService.mock.js";

// Types
export type * from "./types/dataset.types.js";
