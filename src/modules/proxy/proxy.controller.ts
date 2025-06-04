import {
  All,
  Controller,
  Req,
  Res,
  Next,
  HttpStatus,
  HttpException,
  Inject,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { RouteLoaderService } from '../route-loader/route-loader.service';
import { ValidationService } from '../validation/validation.service';
import { TransformationService } from '../transformation/transformation.service';
import { MockingService } from '../mocking/mocking.service';
import { RateLimitService } from '../rate-limit/rate-limit.service';
import { startStepSpan, recordStepError } from '../observability/observability.middleware';
import axios from 'axios';

@Controller('*')
export class ProxyController {
  constructor(
    private readonly routeLoader: RouteLoaderService,
    private readonly validationService: ValidationService,
    private readonly transformationService: TransformationService,
    private readonly mockingService: MockingService,
    private readonly rateLimitService: RateLimitService,
  ) {}

  @All('*')
  async proxy(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    const span = startStepSpan(req, 'proxy');
    try {
      const routes = this.routeLoader.getRoutes();
      console.log('Available routes:', routes);
      console.log('Request path:', req.path);
      console.log('Request method:', req.method);

      const match = routes.find(
        (route) =>
          route.method.toUpperCase() === req.method.toUpperCase() &&
          route.path === req.path
      );

      console.log('Matched route:', match);

      if (!match) {
        console.log('No route found');
        return res.status(HttpStatus.NOT_FOUND).json({ error: 'No route found' });
      }

      // Check rate limit
      const rateLimitSpan = startStepSpan(req, 'rate-limit');
      const rateLimit = match.rate_limit;
      if (rateLimit) {
        const limiter = this.rateLimitService.createLimiter(
          match.id,
          rateLimit.points,
          rateLimit.duration
        );
        const key = req.ip; // Use IP as key, could be more sophisticated
        const isAllowed = await this.rateLimitService.checkLimit(match.id, key);
        if (!isAllowed) {
          recordStepError(rateLimitSpan, new Error('Rate limit exceeded'));
          res.status(HttpStatus.TOO_MANY_REQUESTS).json({ error: 'Rate limit exceeded' });
          return;
        }
      }
      rateLimitSpan?.end();

      // Validate request
      const validationSpan = startStepSpan(req, 'validation');
      if (match.input_validation) {
        try {
          await this.validationService.validateRequest(req, match.input_validation);
        } catch (error) {
          recordStepError(validationSpan, error);
          res.status(HttpStatus.BAD_REQUEST).json({ error: error.message });
          return;
        }
      }
      validationSpan?.end();

      // Transform request
      const transformSpan = startStepSpan(req, 'transform');
      if (match.input_transform) {
        try {
          const transformedData = await this.transformationService.transform(
            req.body,
            match.input_transform
          );
          req.body = transformedData;
        } catch (error) {
          recordStepError(transformSpan, error);
          res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: error.message });
          return;
        }
      }
      transformSpan?.end();

      // Check for mock
      const mockSpan = startStepSpan(req, 'mock');
      const mockResponse = await this.mockingService.getMockResponse(match);
      if (mockResponse) {
        mockSpan?.end();
        res.json(mockResponse);
        return;
      }
      mockSpan?.end();

      // Proxy to backend
      const proxySpan = startStepSpan(req, 'proxy-backend');
      try {
        console.log('Making request to backend:', match.backend_url);
        const axiosConfig = {
          method: req.method as any,
          url: match.backend_url,
          headers: { ...req.headers },
          data: req.body,
          params: req.query,
          timeout: match.rate_limit?.duration * 1000, // Convertir en millisecondes
          validateStatus: () => true, // On laisse passer toutes les réponses
        };
        console.log('Axios config:', axiosConfig);

        const response = await axios(axiosConfig);
        console.log('Backend response:', response.status, response.data);
        
        // Filtrer les headers pour éviter les problèmes de CORS
        const headers = { ...response.headers };
        delete headers['access-control-allow-origin'];
        delete headers['access-control-allow-methods'];
        delete headers['access-control-allow-headers'];
        
        // S'assurer que le content-type est correct
        if (response.data && typeof response.data === 'object') {
          headers['content-type'] = 'application/json';
        }
        
        res.status(response.status).set(headers).send(response.data);
      } catch (error) {
        recordStepError(proxySpan, error);
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          error: 'Internal Server Error',
          message: error.message
        });
      }
      proxySpan?.end();
    } catch (error) {
      recordStepError(span, error);
      console.error('Proxy error:', error);
      if (error.response) {
        console.log('Error response:', error.response.status, error.response.data);
        const headers = { ...error.response.headers };
        delete headers['access-control-allow-origin'];
        delete headers['access-control-allow-methods'];
        delete headers['access-control-allow-headers'];
        
        if (error.response.data && typeof error.response.data === 'object') {
          headers['content-type'] = 'application/json';
        }
        
        res.status(error.response.status).set(headers).send(error.response.data);
      } else {
        console.log('Passing error to next:', error);
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          error: 'Internal Server Error',
          message: error.message
        });
      }
    }
    span?.end();
  }
} 