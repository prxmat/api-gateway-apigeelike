import { Injectable, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { Transformers as MockTransformers } from './transformers.config';
import { RouteLoaderService } from '../route-loader/route-loader.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

// Décorateur pour les transformations
export function Transform(transformFn: (value: any) => any) {
  return function (target: any, propertyKey: string) {
    Reflect.defineMetadata('transform', transformFn, target, propertyKey);
  };
}

// Transformations prédéfinies
export const Transformers = {
  now: () => new Date().toISOString(),
  random: () => Math.random().toString(36).substring(2, 10),
  amount: () => Math.floor(Math.random() * (1000 - 10 + 1)) + 10,
  currency: () => ['EUR', 'USD'][Math.floor(Math.random() * 2)],
  status: () => 'completed',
  transactionId: () => `tx_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`
};

@Injectable()
export class MockingService implements OnModuleInit {
  private mockResponses: Map<string, any> = new Map();

  constructor(
    private readonly routeLoader: RouteLoaderService,
    private readonly eventEmitter: EventEmitter2
  ) {
    // S'abonner aux événements de changement de routes
    this.eventEmitter.on('routes.loaded', () => this.loadMockResponses());
  }

  async onModuleInit() {
    await this.loadMockResponses();
  }

  async loadMockResponses() {
    // Réinitialiser le cache
    this.mockResponses.clear();

    const routes = this.routeLoader.getRoutes();
    
    for (const route of routes) {
      if (!route.mock || !route.mock_response) {
        continue;
      }

      let mockResponse: any;

      // Si c'est un objet inline
      if (typeof route.mock_response === 'object') {
        console.log('Transforming mock response for route:', route.id, route.mock_response);
        mockResponse = this.transformResponse(route.mock_response);
        console.log('Transformed mock response:', mockResponse);
      }
      // Si c'est un chemin de fichier
      else if (typeof route.mock_response === 'string') {
        const filePath = path.isAbsolute(route.mock_response)
          ? route.mock_response
          : path.join(process.cwd(), route.mock_response);

        if (!fs.existsSync(filePath)) {
          console.warn(`Mock file not found: ${filePath}`);
          continue;
        }

        try {
          const content = fs.readFileSync(filePath, 'utf-8');
          const parsed = JSON.parse(content);
          mockResponse = this.transformResponse(parsed);
        } catch (error) {
          console.error(`Error loading mock file ${filePath}:`, error);
          continue;
        }
      }

      if (mockResponse) {
        this.mockResponses.set(route.id, mockResponse);
      }
    }
  }

  private transformValue(value: any): any {
    if (typeof value === 'string' && value.startsWith('@transform:')) {
      const key = value.replace('@transform:', '');
      const transformer = MockTransformers[key];
      if (transformer) {
        const result = transformer();
        console.log(`Transformed ${key}:`, result);
        return result;
      }
    }
    return value;
  }

  private transformResponse(response: any): any {
    if (Array.isArray(response)) {
      return response.map(item => this.transformResponse(item));
    }
    if (typeof response === 'object' && response !== null) {
      const transformed: any = {};
      for (const [key, value] of Object.entries(response)) {
        transformed[key] = this.transformResponse(value);
      }
      return transformed;
    }
    return this.transformValue(response);
  }

  async getMockResponse(route: any): Promise<any | undefined> {
    if (!route.mock) {
      console.log('Mock is disabled for route:', route.id);
      return undefined;
    }
    const response = this.mockResponses.get(route.id);
    console.log('Getting mock response for route:', route.id, response);
    return response;
  }

  // Méthode utilitaire pour les tests
  getMockResponseFromCache(routeId: string): any | undefined {
    return this.mockResponses.get(routeId);
  }
} 