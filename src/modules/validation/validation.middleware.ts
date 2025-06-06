import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ValidationService } from './validation.service';

@Injectable()
export class ValidationMiddleware implements NestMiddleware {
  constructor(private readonly validationService: ValidationService) {}

  use(req: Request, res: Response, next: NextFunction) {
    console.log('Validation Middleware - Request received:', {
      path: req.path,
      method: req.method,
      body: req.body
    });

    // Get the route configuration
    const route = this.validationService['routeLoader'].getRoutes().find(
      r => r.path === req.path && r.method.toUpperCase() === req.method.toUpperCase()
    );

    console.log('Found route:', route);

    // Validate request
    if (route?.input?.validate_schema) {
      console.log('Validation schema:', route.input.validate_schema);
      try {
        this.validationService.validateRequest(req, route.input.validate_schema);
        console.log('Validation successful');
      } catch (error) {
        console.error('Validation error:', error);
        throw error;
      }
    } else {
      console.log('No validation schema found for this route');
    }

    // Intercept the response for validation
    const originalJson = res.json;
    const validationService = this.validationService; // Capture this in a variable
    res.json = function(body: any) {
      try {
        validationService.validateResponse(req.path, req.method, body);
        return originalJson.call(this, body);
      } catch (error) {
        console.error('Response validation error:', error);
        return originalJson.call(this, error.response);
      }
    };

    next();
  }
} 