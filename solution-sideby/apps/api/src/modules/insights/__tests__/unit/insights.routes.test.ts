import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import insightsRoutes from "@/modules/insights/presentation/insights.routes.js";

describe("insights routes auth", () => {
  it("requires JWT authorization for insights endpoint", async () => {
    const app = express();
    app.use(express.json());
    app.use("/datasets", insightsRoutes);

    const response = await request(app).get(
      "/datasets/507f1f77bcf86cd799439011/insights",
    );

    expect(response.status).toBe(401);
    expect(response.body).toEqual(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: "AUTH_ERROR",
        }),
      }),
    );
  });
});
