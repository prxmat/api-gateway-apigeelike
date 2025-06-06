import { Injectable } from '@nestjs/common';
import { Span } from '@opentelemetry/api';
import { trace } from '@opentelemetry/api';

@Injectable()
export class MetricsService {
  private readonly tracer = trace.getTracer('proxy-metrics');

  recordProxyTiming(span: Span, timing: {
    matching: number;
    validation: number;
    rate_limit: number;
    input_transform: number;
    backend_call: number;
    output_transform: number;
    total: number;
  }): void {
    // Enregistrer les métriques dans la span OpenTelemetry
    span.setAttributes({
      'proxy.timing.matching': timing.matching,
      'proxy.timing.validation': timing.validation,
      'proxy.timing.rate_limit': timing.rate_limit,
      'proxy.timing.input_transform': timing.input_transform,
      'proxy.timing.backend_call': timing.backend_call,
      'proxy.timing.output_transform': timing.output_transform,
      'proxy.timing.total': timing.total,
    });
  }
} 