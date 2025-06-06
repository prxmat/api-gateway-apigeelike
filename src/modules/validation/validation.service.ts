import { Injectable, BadRequestException, OnModuleInit } from '@nestjs/common';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { RouteLoaderService } from '../route-loader/route-loader.service';
import { ValidateFunction } from 'ajv';
import { LoadedRoute } from '../route-loader/interfaces/loaded-route.interface';

interface CompiledSchemas {
  input?: any;
  output?: any;
}

@Injectable()
export class ValidationService implements OnModuleInit {
  private ajv: Ajv;
  private compiledSchemas: Map<string, CompiledSchemas> = new Map();
  private routeCache: Map<string, any> = new Map();

  constructor(private readonly routeLoader: RouteLoaderService) {
    this.ajv = new Ajv({
      allErrors: true,
      verbose: true,
      strict: false,
    });
    addFormats(this.ajv);
  }

  async onModuleInit() {
    await this.compileAllSchemas();
    this.preloadRouteCache();
  }

  private preloadRouteCache() {
    const routes = this.routeLoader.getRoutes();
    for (const route of routes) {
      const key = `${route.method}:${route.path}`;
      this.routeCache.set(key, route);
    }
  }

  private async compileAllSchemas() {
    const routes = this.routeLoader.getRoutes();
    for (const route of routes) {
      const schemas: CompiledSchemas = this.compileSchemas(route);
      
      if (Object.keys(schemas).length > 0) {
        this.compiledSchemas.set(route.id, schemas);
      }
    }
  }

  private compileSchemas(route: LoadedRoute): CompiledSchemas {
    const schemas: CompiledSchemas = {};

    if (route.input?.validate_schema) {
      schemas.input = this.ajv.compile(route.input.validate_schema);
    }

    return schemas;
  }

  async validateRequest(request: any, schema: any, routeId?: string): Promise<void> {
    if (!schema) {
      return;
    }

    let validate: ValidateFunction;
    
    if (routeId && this.compiledSchemas.has(routeId)) {
      validate = this.compiledSchemas.get(routeId)!.input!;
    } else {
      validate = this.ajv.compile(schema);
    }

    const valid = validate(request.body);
    if (!valid) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: validate.errors,
      });
    }
  }

  async validateResponse(path: string, method: string, data: any): Promise<void> {
    const key = `${method}:${path}`;
    const route = this.routeCache.get(key) || this.routeLoader.findRoute(method, path);
    
    if (!route?.output?.validate_schema) {
      return;
    }

    let validate: ValidateFunction;
    if (this.compiledSchemas.has(route.id)) {
      validate = this.compiledSchemas.get(route.id)!.output!;
    } else {
      validate = this.ajv.compile(route.output.validate_schema);
    }

    const valid = validate(data);
    if (!valid) {
      throw new BadRequestException({
        message: 'Response validation failed',
        errors: validate.errors,
      });
    }
  }

  getCompiledSchema(routeId: string): CompiledSchemas | undefined {
    return this.compiledSchemas.get(routeId);
  }
} 