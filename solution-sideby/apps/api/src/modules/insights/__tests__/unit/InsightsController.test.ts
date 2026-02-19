import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextFunction, Response } from "express";
import type { AuthRequest } from "@/middleware/auth.middleware.js";
import { InsightsController } from "@/modules/insights/presentation/insights.controller.js";
import { DatasetNotFoundError } from "@/modules/datasets/domain/errors/DatasetNotFoundError.js";

const createResponseMock = (): Response => {
  const response = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;

  return response;
};

describe("InsightsController", () => {
  const executeMock = vi.fn();
  let controller: InsightsController;

  beforeEach(() => {
    executeMock.mockReset();
    controller = new InsightsController({
      execute: executeMock,
    });
  });

  it("returns 401 when request has no userId", async () => {
    const req = {
      params: { id: "507f1f77bcf86cd799439011" },
      query: {},
    } as unknown as AuthRequest;

    const res = createResponseMock();
    const next = vi.fn() as unknown as NextFunction;

    await controller.getDatasetInsights(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("returns 400 for invalid dataset id", async () => {
    const req = {
      userId: "owner-1",
      params: { id: "invalid-id" },
      query: {},
    } as unknown as AuthRequest;

    const res = createResponseMock();
    const next = vi.fn() as unknown as NextFunction;

    await controller.getDatasetInsights(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(executeMock).not.toHaveBeenCalled();
  });

  it("returns 200 and expected payload when use case succeeds", async () => {
    executeMock.mockResolvedValueOnce({
      insights: [
        {
          id: "ins-1",
          datasetId: "507f1f77bcf86cd799439011",
          type: "summary",
          severity: 1,
          icon: "💡",
          title: "Resumen",
          message: "Mensaje",
          metadata: {},
          generatedBy: "rule-engine",
          confidence: 1,
          generatedAt: new Date(),
        },
      ],
      fromCache: true,
    });

    const req = {
      userId: "owner-1",
      params: { id: "507f1f77bcf86cd799439011" },
      query: { filters: JSON.stringify({ categorical: {} }) },
    } as unknown as AuthRequest;

    const res = createResponseMock();
    const next = vi.fn() as unknown as NextFunction;

    await controller.getDatasetInsights(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        insights: expect.any(Array),
        meta: expect.objectContaining({
          total: 1,
          cacheStatus: "hit",
        }),
      }),
    );
  });

  it("returns 404 when dataset is not found", async () => {
    executeMock.mockRejectedValueOnce(
      new DatasetNotFoundError("507f1f77bcf86cd799439011"),
    );

    const req = {
      userId: "owner-1",
      params: { id: "507f1f77bcf86cd799439011" },
      query: {},
    } as unknown as AuthRequest;

    const res = createResponseMock();
    const next = vi.fn() as unknown as NextFunction;

    await controller.getDatasetInsights(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(next).not.toHaveBeenCalled();
  });

  it("delegates malformed filters error to next", async () => {
    const req = {
      userId: "owner-1",
      params: { id: "507f1f77bcf86cd799439011" },
      query: { filters: "{bad-json}" },
    } as unknown as AuthRequest;

    const res = createResponseMock();
    const next = vi.fn() as unknown as NextFunction;

    await controller.getDatasetInsights(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });
});
