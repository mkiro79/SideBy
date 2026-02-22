// NOTA: dotenv/config carga .env en local sin romper produccion.
// En Railway, las variables del entorno del contenedor tienen prioridad.
import "dotenv/config";

import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { connectDB } from "./config/database.js";
import { errorHandler } from "./middleware/errorHandler.js";
import logger from "./utils/logger.js";
import v1Routes from "./v1/routes.js";
import { generateOpenApiDocs } from "./infrastructure/openapi/openapi.registry.js";
// Importar swagger definitions para registrar rutas
import "./modules/auth/presentation/auth.swagger.js";
import "./modules/auth/presentation/dev-auth.swagger.js";
import "./modules/datasets/presentation/datasets.swagger.js";
import "./modules/insights/presentation/insights.swagger.js";

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check route
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "SideBy API is running" });
});

// API routes
app.get("/api", (req, res) => {
  res.json({ message: "Welcome to SideBy API" });
});

// Swagger UI - Documentacion interactiva
const openApiDocs = generateOpenApiDocs();
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openApiDocs));

// Swagger JSON - Especificacion OpenAPI cruda
app.get("/api/docs.json", (req, res) => {
  res.json(openApiDocs);
});

// API v1 routes
app.use("/api/v1", v1Routes);

// Error handler middleware
app.use(errorHandler);

// Connect to database and start server
const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || "development"}`);
    });
  } catch (error) {
    logger.error({ err: error }, "Failed to start server");
    process.exit(1);
  }
};

startServer();
