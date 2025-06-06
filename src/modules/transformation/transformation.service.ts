import { Injectable, OnModuleInit } from '@nestjs/common';
import * as jsonata from 'jsonata';
import { RouteLoaderService } from '../route-loader/route-loader.service';

interface CompiledExpressions {
  input?: jsonata.Expression;
  output?: jsonata.Expression;
}

@Injectable()
export class TransformationService implements OnModuleInit {
  private compiledExpressions: Map<string, CompiledExpressions> = new Map();
  private routeCache: Map<string, any> = new Map();

  constructor(private readonly routeLoader: RouteLoaderService) {}

  async onModuleInit() {
    await this.compileAllExpressions();
    this.preloadRouteCache();
  }

  private preloadRouteCache() {
    const routes = this.routeLoader.getRoutes();
    for (const route of routes) {
      const key = `${route.method}:${route.path}`;
      this.routeCache.set(key, route);
    }
  }

  private async compileAllExpressions() {
    const routes = this.routeLoader.getRoutes();
    for (const route of routes) {
      const expressions: CompiledExpressions = {};

      if (route.input_transform) {
        expressions.input = jsonata(route.input_transform);
      }
      if (route.output_transform) {
        expressions.output = jsonata(route.output_transform);
      }

      if (Object.keys(expressions).length > 0) {
        this.compiledExpressions.set(route.id, expressions);
      }
    }
  }

  async transform(data: any, expression: string, routeId?: string): Promise<any> {
    if (!expression) {
      return data;
    }

    console.log('Transformation input:', {
      data,
      expression,
      routeId
    });

    let compiledExpression: jsonata.Expression;
    
    if (routeId && this.compiledExpressions.has(routeId)) {
      compiledExpression = this.compiledExpressions.get(routeId)!.input!;
    } else {
      compiledExpression = jsonata(expression);
    }

    const result = await compiledExpression.evaluate(data);
    console.log('Transformation output:', result);
    return result;
  }

  async transformOutput(data: any, expression: string, routeId: string): Promise<any> {
    if (!expression) {
      return data;
    }

    let compiledExpression: jsonata.Expression;
    if (this.compiledExpressions.has(routeId)) {
      compiledExpression = this.compiledExpressions.get(routeId)!.output!;
    } else {
      compiledExpression = jsonata(expression);
    }

    return compiledExpression.evaluate(data);
  }

  getCompiledExpression(routeId: string): CompiledExpressions | undefined {
    return this.compiledExpressions.get(routeId);
  }
} 