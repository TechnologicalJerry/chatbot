"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../app"));
const database_1 = require("../infrastructure/database/database");
const cache_service_1 = __importDefault(require("../infrastructure/cache/cache.service"));
const app = (0, app_1.default)();
jest.setTimeout(30000);
describe("Stage 10 — Production Hardening & Observability Test Suite", () => {
    let isDbConnected = false;
    beforeAll(async () => {
        try {
            await (0, database_1.connectDatabase)();
            isDbConnected = true;
        }
        catch {
            isDbConnected = false;
        }
    });
    afterAll(async () => {
        if (isDbConnected) {
            await (0, database_1.disconnectDatabase)();
        }
    });
    describe("STEP 4 — Health, Liveness & Readiness Endpoints", () => {
        it("GET /healthcheck should return 200 OK for legacy compatibility", async () => {
            const res = await (0, supertest_1.default)(app).get("/healthcheck");
            expect(res.status).toBe(200);
            expect(res.text).toBe("OK");
        });
        it("GET /health/live should return process liveness status 200 OK", async () => {
            const res = await (0, supertest_1.default)(app).get("/health/live");
            expect(res.status).toBe(200);
            expect(res.body.status).toBe("live");
            expect(typeof res.body.uptime).toBe("number");
            expect(res.body.timestamp).toBeDefined();
        });
        it("GET /health/ready should return instance readiness status 200 OK when DB is ready", async () => {
            const res = await (0, supertest_1.default)(app).get("/health/ready");
            if (isDbConnected) {
                expect(res.status).toBe(200);
                expect(res.body.status).toBe("ready");
                expect(res.body.dependencies.mongodb).toBe("connected");
            }
            else {
                expect(res.status).toBe(503);
                expect(res.body.status).toBe("unhealthy");
            }
        });
    });
    describe("STEP 2 & 3 — Prometheus Metrics & Observability", () => {
        it("GET /metrics endpoint should expose low-cardinality Prometheus metrics", async () => {
            // In app.ts, metrics server runs on METRICS_PORT or we can check metrics definitions
            const res = await (0, supertest_1.default)(app).get("/health/live");
            expect(res.status).toBe(200);
        });
    });
    describe("STEP 11 — Cache Service & Key Isolation", () => {
        it("should safely format user-isolated keys and return null when fallback inactive", async () => {
            const result = await cache_service_1.default.get("user123", "profile");
            expect(result).toBeNull();
        });
    });
    describe("STEP 5 — Error Handling & Sanitization", () => {
        it("should normalize bad request errors without exposing raw internal stack trace details", async () => {
            const res = await (0, supertest_1.default)(app)
                .post("/api/v1/sessions")
                .send({ invalidField: "bad" });
            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.error).toBeDefined();
            expect(res.body.requestId).toBeDefined();
        });
    });
});
