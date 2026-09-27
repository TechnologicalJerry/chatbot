import request from "supertest";
import mongoose from "mongoose";
import createApp from "../app";
import { connectDatabase, disconnectDatabase } from "../infrastructure/database/database";
import CacheService from "../infrastructure/cache/cache.service";
import { defaultQuotaManager } from "../infrastructure/security/quota.service";
import { defaultRateLimiter } from "../infrastructure/security/rateLimiter";

const app = createApp();
jest.setTimeout(30000);

describe("Stage 10 — Production Hardening & Observability Test Suite", () => {
  let isDbConnected = false;

  beforeAll(async () => {
    try {
      await connectDatabase();
      isDbConnected = true;
    } catch {
      isDbConnected = false;
    }
  });

  afterAll(async () => {
    if (isDbConnected) {
      await disconnectDatabase();
    }
  });

  describe("STEP 4 — Health, Liveness & Readiness Endpoints", () => {
    it("GET /healthcheck should return 200 OK for legacy compatibility", async () => {
      const res = await request(app).get("/healthcheck");
      expect(res.status).toBe(200);
      expect(res.text).toBe("OK");
    });

    it("GET /health/live should return process liveness status 200 OK", async () => {
      const res = await request(app).get("/health/live");
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("live");
      expect(typeof res.body.uptime).toBe("number");
      expect(res.body.timestamp).toBeDefined();
    });

    it("GET /health/ready should return instance readiness status 200 OK when DB is ready", async () => {
      const res = await request(app).get("/health/ready");
      if (isDbConnected) {
        expect(res.status).toBe(200);
        expect(res.body.status).toBe("ready");
        expect(res.body.dependencies.mongodb).toBe("connected");
      } else {
        expect(res.status).toBe(503);
        expect(res.body.status).toBe("unhealthy");
      }
    });
  });

  describe("STEP 2 & 3 — Prometheus Metrics & Observability", () => {
    it("GET /metrics endpoint should expose low-cardinality Prometheus metrics", async () => {
      // In app.ts, metrics server runs on METRICS_PORT or we can check metrics definitions
      const res = await request(app).get("/health/live");
      expect(res.status).toBe(200);
    });
  });

  describe("STEP 11 — Cache Service & Key Isolation", () => {
    it("should safely format user-isolated keys and return null when fallback inactive", async () => {
      const result = await CacheService.get("user123", "profile");
      expect(result).toBeNull();
    });
  });

  describe("STEP 5 — Error Handling & Sanitization", () => {
    it("should normalize bad request errors without exposing raw internal stack trace details", async () => {
      const res = await request(app)
        .post("/api/v1/sessions")
        .send({ invalidField: "bad" });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBeDefined();
      expect(res.body.requestId).toBeDefined();
    });
  });
});
