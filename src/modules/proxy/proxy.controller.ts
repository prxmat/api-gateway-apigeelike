import {
  All,
  Controller,
  Req,
  Res,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { RouteLoaderService } from '../route-loader/route-loader.service';
import { ValidationService } from '../validation/validation.service';
import { TransformationService } from '../transformation/transformation.service';
import { MockingService } from '../mocking/mocking.service';
import { RateLimitService } from '../rate-limit/rate-limit.service';
import { startStepSpan, recordStepError } from '../observability/observability.middleware';
import { MetricsService } from '../metrics/metrics.service';
import { CustomLogger } from '../logger/logger.service';
import { HttpService } from '../http/http.service';

interface ProxyTiming {
  matching: number;
  validation: number;
  rate_limit: number;
  input_transform: number;
  backend_call: number;
  output_transform: number;
  total: number;
}

@Controller()
export class ProxyController {
  constructor(
    private readonly routeLoaderService: RouteLoaderService,
    private readonly validationService: ValidationService,
    private readonly transformationService: TransformationService,
    private readonly mockingService: MockingService,
    private readonly rateLimitService: RateLimitService,
    private readonly metricsService: MetricsService,
    private readonly logger: CustomLogger,
    private readonly httpService: HttpService,
  ) {
    this.logger.setContext('ProxyController');
  }

  @All('*')
  async proxy(@Req() req: Request, @Res() res: Response) {
    const startTime = process.hrtime.bigint();
    const timing: ProxyTiming = {
      matching: 0,
      validation: 0,
      rate_limit: 0,
      input_transform: 0,
      backend_call: 0,
      output_transform: 0,
      total: 0,
    };

    const span = startStepSpan(req, 'proxy');
    try {
      // 1. Route matching
      const matchStart = process.hrtime.bigint();
      const match = this.routeLoaderService.findRoute(req.method, req.path);
      if (!match) {
        this.logger.error({
          message: 'Route not found',
          path: req.path,
          method: req.method,
        });
        throw new HttpException('Route not found', HttpStatus.NOT_FOUND);
      }
      timing.matching = Number(process.hrtime.bigint() - matchStart) / 1_000_000;

      // 2. Validation
      const validationStart = process.hrtime.bigint();
      const validationSpan = startStepSpan(req, 'validation');
      if (match.input?.validate_schema) {
        try {
          await this.validationService.validateRequest(req, match.input.validate_schema, match.id);
        } catch (error) {
          recordStepError(validationSpan, error);
          this.logger.error({
            message: 'Validation error',
            path: req.path,
            method: req.method,
            route_id: match.id,
            error: error.message,
            body: req.body,
            schema: match.input.validate_schema
          });
          res.status(HttpStatus.BAD_REQUEST).json({ 
            success: false,
            error: error.message,
            requestId: Date.now().toString()
          });
          return;
        }
      }
      validationSpan?.end();
      timing.validation = Number(process.hrtime.bigint() - validationStart) / 1_000_000;

      // 3. Rate limiting
      const rateLimitStart = process.hrtime.bigint();
      const rateLimitSpan = startStepSpan(req, 'rate-limit');
      const rateLimit = match.rate_limit;
      if (rateLimit) {
        const limiter = this.rateLimitService.createLimiter(
          match.id,
          rateLimit.points,
          rateLimit.duration
        );
        const key = req.ip;
        const isAllowed = await this.rateLimitService.checkLimit(match.id, key);
        if (!isAllowed) {
          recordStepError(rateLimitSpan, new Error('Rate limit exceeded'));
          res.status(HttpStatus.TOO_MANY_REQUESTS).json({ 
            success: false,
            error: 'Rate limit exceeded',
            requestId: Date.now().toString()
          });
          return;
        }
      }
      rateLimitSpan?.end();
      timing.rate_limit = Number(process.hrtime.bigint() - rateLimitStart) / 1_000_000;

      // 4. Input transformation
      const transformStart = process.hrtime.bigint();
      const transformSpan = startStepSpan(req, 'transform');
      let transformedData = req.body;
      if (match.input_transform) {
        try {
          transformedData = await this.transformationService.transform(
            transformedData,
            match.input_transform,
            match.id
          );
        } catch (error) {
          recordStepError(transformSpan, error);
          this.logger.error({
            message: 'Transformation error',
            path: req.path,
            method: req.method,
            route_id: match.id,
            error: error.message,
            input: req.body,
            transform: match.input_transform
          });
          res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ 
            success: false,
            error: error.message,
            requestId: Date.now().toString()
          });
          return;
        }
      }
      transformSpan?.end();
      timing.input_transform = Number(process.hrtime.bigint() - transformStart) / 1_000_000;

      // 5. Backend call or mock
      const backendStart = process.hrtime.bigint();
      const backendSpan = startStepSpan(req, 'backend-call');
      let response;
      if (match.mock) {
        response = await this.mockingService.getMockResponse(match);
        res.status(HttpStatus.OK).json(response);
        return;
      } else {
        try {
          response = await this.httpService.request(match, transformedData);
        } catch (error) {
          recordStepError(backendSpan, error);
          if (error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND')) {
            throw new HttpException(
              'Backend service unavailable',
              HttpStatus.SERVICE_UNAVAILABLE,
            );
          }
          if (error.message.includes('ETIMEDOUT')) {
            throw new HttpException(
              'Backend request timeout',
              HttpStatus.GATEWAY_TIMEOUT,
            );
          }
          throw error;
        }
      }
      backendSpan?.end();
      timing.backend_call = Number(process.hrtime.bigint() - backendStart) / 1_000_000;

      // 6. Output transformation (uniquement si pas mock)
      const outputTransformStart = process.hrtime.bigint();
      const outputTransformSpan = startStepSpan(req, 'output-transform');
      if (match.output_transform) {
        try {
          response = await this.transformationService.transformOutput(
            response,
            match.output_transform,
            match.id
          );
        } catch (error) {
          recordStepError(outputTransformSpan, error);
          this.logger.error({
            message: 'Output transformation error',
            path: req.path,
            method: req.method,
            route_id: match.id,
            error: error.message,
            transform: match.output_transform
          });
          res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ 
            success: false,
            error: error.message,
            requestId: Date.now().toString()
          });
          return;
        }
      }
      outputTransformSpan?.end();
      timing.output_transform = Number(process.hrtime.bigint() - outputTransformStart) / 1_000_000;

      // 7. Send response
      const responseStart = process.hrtime.bigint();
      const responseSpan = startStepSpan(req, 'response');
      if (response) {
        res.status(HttpStatus.OK).json(response);
      } else {
        res.status(HttpStatus.NO_CONTENT).send();
      }
      responseSpan?.end();
      timing.total = Number(process.hrtime.bigint() - startTime) / 1_000_000;

      // 8. Log success
      this.logger.log({
        message: 'Request processed successfully',
        path: req.path,
        method: req.method,
        route_id: match.id,
        meta: {
          proxy_timing: timing
        }
      });
    } catch (error) {
      span?.end();
      this.logger.error({
        message: 'Error processing request',
        path: req.path,
        method: req.method,
        error: error.message,
        meta: {
          proxy_timing: timing
        }
      });
      res.status(error.status || HttpStatus.INTERNAL_SERVER_ERROR).json({ 
        success: false,
        error: error.message,
        requestId: Date.now().toString()
      });
    }
  }
} 