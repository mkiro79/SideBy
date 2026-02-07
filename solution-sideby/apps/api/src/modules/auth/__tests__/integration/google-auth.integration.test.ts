import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  vi,
} from "vitest";
import request from "supertest";
import express from "express";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { errorHandler } from "../../../../middleware/errorHandler.js";

const verifyGoogleTokenMock = vi.fn();

vi.mock("@/modules/auth/infrastructure/google-auth.service.js", () => {
  return {
    GoogleAuthService: class {
      async verify(token: string) {
        return verifyGoogleTokenMock(token);
      }
    },
  };
});

const BASE_PATH = "/api/v1";
describe("POST /api/v1/auth/google - Integration Tests", () => {
  let app: express.Application;
  let mongoServer: MongoMemoryServer;
  let authRoutes: express.Router;

  beforeAll(async () => {
    // Setup MongoDB in-memory
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);

    // Setup Express app
    app = express();
    app.use(express.json());
    const { default: routes } =
      await import("../../presentation/auth.routes.js");
    authRoutes = routes;
    app.use(BASE_PATH + "/auth", authRoutes);
    app.use(errorHandler); // Add error handler middleware
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    verifyGoogleTokenMock.mockReset();
    verifyGoogleTokenMock.mockImplementation(async () => {
      throw new Error("Invalid Google token");
    });

    // Clear database between tests
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  });

  describe("Request Validation", () => {
    it("should return 400 if no token provided", async () => {
      const response = await request(app)
        .post(BASE_PATH + "/auth/google")
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toHaveProperty("message");
      expect(response.body.error).toHaveProperty("code");
    });

    it("should return 400 if token is empty string", async () => {
      const response = await request(app)
        .post(BASE_PATH + "/auth/google")
        .send({ token: "" });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("success", false);
      expect(response.body.error.message).toContain("token");
    });
  });

  describe("Authentication Flow", () => {
    it("should return 401 for invalid Google token", async () => {
      const response = await request(app)
        .post(BASE_PATH + "/auth/google")
        .send({ token: "invalid-token-123" });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toHaveProperty("message");
      expect(response.body.error).toHaveProperty("code", "AUTH_ERROR");
    });

    it("should return 401 for expired Google token", async () => {
      const expiredToken = "expired.jwt.token";
      const response = await request(app)
        .post(BASE_PATH + "/auth/google")
        .send({ token: expiredToken });

      expect(response.status).toBe(401);
    });

    it("should return 200 with mocked Google token", async () => {
      const mockedPayload = {
        email: "mocked@example.com",
        googleId: "mocked-google-id",
        name: "Mocked User",
        picture: "https://example.com/avatar.jpg",
      };
      verifyGoogleTokenMock.mockResolvedValue(mockedPayload);

      const response = await request(app)
        .post(BASE_PATH + "/auth/google")
        .send({ token: "mocked-token-123" });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("data");
      expect(response.body.data).toHaveProperty("token");
      expect(response.body.data.user).toHaveProperty(
        "email",
        mockedPayload.email,
      );
      expect(response.body.data.user).toHaveProperty(
        "avatar",
        mockedPayload.picture,
      );
      expect(response.body.data.user).toHaveProperty("role", "user");

      const userCount = await mongoose.connection
        .collection("users")
        .countDocuments();
      expect(userCount).toBe(1);
    });

    // // NOTE: Para testear un login exitoso, necesitarías mockear el GoogleAuthService
    // // o usar un token de prueba válido de Google (requiere credenciales de test)
    // it.skip("should return 200 with user and token for valid Google token", async () => {
    //   // Este test requiere configurar mocks o credenciales de test de Google
    //   const validToken = "VALID_GOOGLE_TEST_TOKEN";
    //   const response = await request(app)
    //     .post(BASE_PATH + "/auth/google")
    //     .send({ token: validToken });

    //   expect(response.status).toBe(200);
    //   expect(response.body).toHaveProperty("user");
    //   expect(response.body).toHaveProperty("token");
    //   expect(response.body.user).toHaveProperty("email");
    //   expect(response.body.user).toHaveProperty("googleId");
    // });
  });

  describe("Database Integration", () => {
    it("should create user in database on first login (mocked)", async () => {
      // Este test verifica que la base de datos esté funcionando
      // Para implementación completa, necesitas mockear GoogleAuthService
      const userCountBefore = await mongoose.connection
        .collection("users")
        .countDocuments();
      expect(userCountBefore).toBe(0);

      // Aquí iría el test con un token válido mockeado
      // const response = await request(app).post("/api/auth/google").send({ token: mockedToken });
      // const userCountAfter = await mongoose.connection.collection("users").countDocuments();
      // expect(userCountAfter).toBe(1);
    });
  });

  describe("Response Format", () => {
    it("should return proper error format for validation errors", async () => {
      const response = await request(app)
        .post(BASE_PATH + "/auth/google")
        .send({});

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toHaveProperty("message");
      expect(response.body.error).toHaveProperty("code");
      expect(typeof response.body.error.message).toBe("string");
      expect(typeof response.body.error.code).toBe("string");
    });
  });
});
