import {
  All,
  Controller,
  Req,
  Res,
  HttpStatus,
  HttpException,
  OnModuleInit,
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
import { EventEmitter2 } from '@nestjs/event-emitter';

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
export class ProxyController implements OnModuleInit {
  private routeCache: Map<string, any> = new Map();

  constructor(
    private readonly routeLoaderService: RouteLoaderService,
    private readonly validationService: ValidationService,
    private readonly transformationService: TransformationService,
    private readonly mockingService: MockingService,
    private readonly rateLimitService: RateLimitService,
    private readonly metricsService: MetricsService,
    private readonly logger: CustomLogger,
    private readonly httpService: HttpService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.logger.setContext('ProxyController');
  }

  onModuleInit() {
    // Écouter l'événement routes.loaded
    this.eventEmitter.on('routes.loaded', (apps) => {
      this.logger.log({
        message: 'Routes reloaded in proxy',
        apps: apps.map(app => app.id)
      });
      // Vider le cache
      this.routeCache.clear();
    });
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
      const cacheKey = `${req.method}:${req.path}`;
      let match = this.routeCache.get(cacheKey);
      
      if (!match) {
        match = this.routeLoaderService.findRoute(req.method, req.path);
        if (match) {
          this.routeCache.set(cacheKey, match);
        }
      }

      if (!match) {
        this.logger.error({
          message: 'Route not found',
          path: req.path,
          method: req.method,
        });
        throw new HttpException('Route not found', HttpStatus.NOT_FOUND);
      }
      timing.matching = Number(process.hrtime.bigint() - matchStart) / 1_000_000;

      // Déterminer l'environnement depuis le paramètre ou le header
      const environment = req.headers['x-environment'] as string || 'default';
      const envConfig = match.environments[environment];
      if (!envConfig) {
        throw new Error(`Environment ${environment} not configured for this route`);
      }

      this.logger.debug({
        message: 'Environment and mock status',
        environment,
        route_id: match.id,
        mock_enabled: await this.routeLoaderService.isMockEnabled(match.id, environment),
        headers: req.headers
      });

      let response;

      if (await this.routeLoaderService.isMockEnabled(match.id, environment)) {
        // 1. Si mock activé, retourner mock_response
        const mockResponse = await this.mockingService.getMockResponse(match, environment);
        if (!mockResponse) {
          throw new HttpException('Mock response not found', HttpStatus.INTERNAL_SERVER_ERROR);
        }
        response = mockResponse;
      } else {
        // 2. Sinon, retourner valeur backend avec output_transformation
        try {
          // Transformer les données d'entrée
          let transformedData = req.body;
          if (match.input_transform) {
            try {
              transformedData = await this.transformationService.transform(
                transformedData,
                match.input_transform,
                match.id
              );
            } catch (error) {
              recordStepError(span, error);
              this.logger.error({
                message: 'Input transformation error',
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

          const backendResponse = await this.httpService.request({
            ...match,
            backend_url: envConfig.backend_url,
            headers: {
              ...req.headers,
              'x-environment': environment,
              'content-type': 'application/json'
            }
          }, transformedData);
          response = backendResponse;

          // Appliquer la transformation de sortie
          if (match.output_transform) {
            try {
              response = await this.transformationService.transformOutput(
                response,
                match.output_transform,
                match.id
              );
            } catch (error) {
              recordStepError(span, error);
              this.logger.error({
                message: 'Output transformation error',
                path: req.path,
                method: req.method,
                route_id: match.id,
                error: error.message,
                output: response,
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
        } catch (error) {
          recordStepError(span, error);
          this.logger.error({
            message: 'Backend request error',
            path: req.path,
            method: req.method,
            route_id: match.id,
            error: error.message,
            backend_url: envConfig.backend_url
          });
          res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ 
            success: false,
            error: error.message,
            requestId: Date.now().toString()
          });
          return;
        }
      }

      // 7. Send response
      res.status(HttpStatus.OK).json(response);

      // 8. Record metrics
      const endTime = process.hrtime.bigint();
      timing.total = Number(endTime - startTime) / 1_000_000;
      this.metricsService.recordTiming(match.id, timing);
      this.metricsService.incrementRequestCount(match.id);

    } catch (error) {
      recordStepError(span, error);
      this.logger.error(error);
      if (error instanceof HttpException) {
        res.status(error.getStatus()).json({
          success: false,
          error: error.message,
          requestId: Date.now().toString()
        });
      } else {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          success: false,
          error: 'Internal server error',
          requestId: Date.now().toString()
        });
      }
    } finally {
      span?.end();
    }
  }
} 