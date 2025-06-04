import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { trace, context, SpanStatusCode } from '@opentelemetry/api';

@Injectable()
export class ObservabilityMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const tracer = trace.getTracer('api-gateway');
    const parentSpan = tracer.startSpan(`HTTP ${req.method} ${req.path}`);
    context.with(trace.setSpan(context.active(), parentSpan), () => {
      // On attache le span au request pour les étapes suivantes
      (req as any).otelSpan = parentSpan;
      res.on('finish', () => {
        parentSpan.setAttribute('http.status_code', res.statusCode);
        parentSpan.end();
      });
      next();
    });
  }
}

// Helpers pour les autres modules :
export function startStepSpan(req: Request, step: string) {
  const tracer = trace.getTracer('api-gateway');
  const parentSpan = (req as any).otelSpan;
  if (!parentSpan) return undefined;
  return tracer.startSpan(step, undefined, trace.setSpan(context.active(), parentSpan));
}

export function recordStepError(span: any, error: Error) {
  if (!span) return;
  span.recordException(error);
  span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
} 