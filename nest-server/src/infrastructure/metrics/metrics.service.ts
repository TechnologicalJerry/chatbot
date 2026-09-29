import { Injectable, OnModuleInit } from '@nestjs/common';
import * as client from 'prom-client';

@Injectable()
export class MetricsService implements OnModuleInit {
  private readonly registry: client.Registry;
  public readonly httpRequestDurationSeconds: client.Histogram<string>;
  public readonly httpRequestsTotal: client.Counter<string>;
  public readonly llmTokenUsageTotal: client.Counter<string>;
  public readonly activeSessionsGauge: client.Gauge<string>;

  constructor() {
    this.registry = new client.Registry();

    this.httpRequestDurationSeconds = new client.Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status'],
      buckets: [0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
      registers: [this.registry],
    });

    this.httpRequestsTotal = new client.Counter({
      name: 'http_requests_total',
      help: 'Total count of HTTP requests',
      labelNames: ['method', 'route', 'status'],
      registers: [this.registry],
    });

    this.llmTokenUsageTotal = new client.Counter({
      name: 'llm_token_usage_total',
      help: 'Total LLM tokens consumed',
      labelNames: ['model', 'type'],
      registers: [this.registry],
    });

    this.activeSessionsGauge = new client.Gauge({
      name: 'active_sessions_total',
      help: 'Total active user sessions',
      registers: [this.registry],
    });
  }

  onModuleInit() {
    client.collectDefaultMetrics({ register: this.registry });
  }

  async getMetrics(): Promise<string> {
    return await this.registry.metrics();
  }

  getContentType(): string {
    return this.registry.contentType;
  }
}
