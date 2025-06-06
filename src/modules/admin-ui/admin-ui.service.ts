import { Injectable } from '@nestjs/common';
import { RouteLoaderService } from '../route-loader/route-loader.service';
import { LoadedRoute } from '../route-loader/interfaces/loaded-route.interface';
import { HttpService } from '../http/http.service';
import { ValidationService } from '../validation/validation.service';
import { TransformationService } from '../transformation/transformation.service';
import { MockingService } from '../mocking/mocking.service';

@Injectable()
export class AdminUiService {
  constructor(
    private readonly routeLoader: RouteLoaderService,
    private readonly httpService: HttpService,
    private readonly validationService: ValidationService,
    private readonly transformationService: TransformationService,
    private readonly mockingService: MockingService,
  ) {}

  getRoutes(): LoadedRoute[] {
    return this.routeLoader.getRoutes();
  }

  getRoute(id: string): LoadedRoute | undefined {
    return this.routeLoader.getRoute(id);
  }

  async updateRoute(id: string, data: Partial<LoadedRoute>): Promise<LoadedRoute> {
    const route = this.routeLoader.getRoute(id);
    if (!route) {
      throw new Error('Route not found');
    }

    // Mettre à jour la route
    const updatedRoute = { ...route, ...data };
    await this.routeLoader.updateRoute(id, updatedRoute);

    return updatedRoute;
  }

  async toggleMock(id: string): Promise<LoadedRoute> {
    const route = this.routeLoader.getRoute(id);
    if (!route) {
      throw new Error('Route not found');
    }

    // Inverser l'état du mock
    const updatedRoute = { ...route, mock: !route.mock };
    await this.routeLoader.updateRoute(id, updatedRoute);

    // Recharger les réponses mock
    await this.mockingService.loadMockResponses();

    return updatedRoute;
  }

  async testRoute(id: string, data: any): Promise<any> {
    const route = this.routeLoader.getRoute(id);
    if (!route) {
      throw new Error('Route not found');
    }

    // Si le mock est activé, utiliser le service de mock
    if (route.mock) {
      return this.mockingService.getMockResponse(route);
    }

    // Sinon, faire une vraie requête
    let transformedData = data;
    if (route.input_transform) {
      transformedData = await this.transformationService.transform(data, route.input_transform, route.id);
    }

    const response = await this.httpService.request(route, transformedData);
    if (route.output_transform) {
      return this.transformationService.transformOutput(response, route.output_transform, route.id);
    }

    return response;
  }
} 