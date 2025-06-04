import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { ObservabilityMiddleware } from './observability.middleware';

const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces';

const sdk = new NodeSDK({
  traceExporter: new OTLPTraceExporter({ url: otlpEndpoint }),
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();

@Module({})
export class ObservabilityModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ObservabilityMiddleware).forRoutes('*');
  }
} 