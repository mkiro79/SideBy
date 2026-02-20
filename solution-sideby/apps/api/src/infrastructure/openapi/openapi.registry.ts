import {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
} from "@asteasolutions/zod-to-openapi";

// Crear instancia del registro OpenAPI
export const registry = new OpenAPIRegistry();

// Configurar componente de seguridad JWT
registry.registerComponent("securitySchemes", "bearerAuth", {
  type: "http",
  scheme: "bearer",
  bearerFormat: "JWT",
  description: "JWT token obtenido tras autenticacion exitosa",
});

// Funcion para generar la especificacion OpenAPI completa
export function generateOpenApiDocs() {
  const generator = new OpenApiGeneratorV3(registry.definitions);

  return generator.generateDocument({
    openapi: "3.0.0",
    info: {
      title: "SideBy API",
      version: "1.0.0",
      description:
        "API RESTful para SideBy - Plataforma de gestion de datos y reportes",
      contact: {
        name: "SideBy Team",
        email: "dev@sideby.com",
      },
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Servidor de desarrollo local",
      },
      {
        url: "https://api.sideby.com",
        description: "Servidor de produccion",
      },
    ],
    tags: [
      {
        name: "Auth",
        description: "Endpoints de autenticacion y autorizacion",
      },
      {
        name: "Users",
        description: "Gestion de usuarios",
      },
      {
        name: "Datasets",
        description: "Gestion de conjuntos de datos",
      },
      {
        name: "Insights",
        description: "Generacion de insights con IA para datasets",
      },
      {
        name: "Reports",
        description: "Generacion y visualizacion de reportes",
      },
    ],
  });
}
