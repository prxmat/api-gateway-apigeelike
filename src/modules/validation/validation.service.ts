import { Injectable, BadRequestException } from '@nestjs/common';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { RouteLoaderService } from '../route-loader/route-loader.service';

@Injectable()
export class ValidationService {
  private ajv: Ajv;

  constructor(private readonly routeLoader: RouteLoaderService) {
    this.ajv = new Ajv({
      allErrors: true,
      verbose: true,
      strict: false,
    });
    addFormats(this.ajv);
  }

  async validateRequest(request: any, schema: any): Promise<void> {
    if (!schema) {
      return;
    }
    const validate = this.ajv.compile(schema);
    const valid = validate(request.body);
    if (!valid) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: validate.errors,
      });
    }
  }

  async validateResponse(path: string, method: string, data: any): Promise<void> {
    const route = this.routeLoader.getRoutes().find(
      r => r.path === path && r.method.toUpperCase() === method.toUpperCase()
    );
    const schema = route?.output?.validate_schema;
    if (!schema) {
      return;
    }
    const validate = this.ajv.compile(schema);
    const valid = validate(data);
    if (!valid) {
      throw new BadRequestException({
        message: 'Response validation failed',
        errors: validate.errors,
      });
    }
  }
} 