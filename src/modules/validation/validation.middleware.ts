import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ValidationService } from './validation.service';

@Injectable()
export class ValidationMiddleware implements NestMiddleware {
  constructor(private readonly validationService: ValidationService) {}

  use(req: Request, res: Response, next: NextFunction) {
    // Get the route configuration
    const route = this.validationService['routeLoader'].getRoutes().find(
      r => r.path === req.path && r.method.toUpperCase() === req.method.toUpperCase()
    );

    // Validate request
    if (route?.input_validation) {
      this.validationService.validateRequest(req, route.input_validation);
    }

    // Intercept the response for validation
    const originalJson = res.json;
    res.json = function(body: any) {
      try {
        this.validationService.validateResponse(req.path, req.method, body);
        return originalJson.call(this, body);
      } catch (error) {
        return originalJson.call(this, error.response);
      }
    }.bind(res);

    next();
  }
} 