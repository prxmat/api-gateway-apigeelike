import { Injectable, NotFoundException } from '@nestjs/common';
import { RouteLoaderService } from '../route-loader/route-loader.service';
import { LoadedRoute } from '../route-loader/interfaces/loaded-route.interface';
import { App } from '../route-loader/interfaces/app.interface';
import { HttpService } from '../http/http.service';
import { ValidationService } from '../validation/validation.service';
import { TransformationService } from '../transformation/transformation.service';
import { MockingService } from '../mocking/mocking.service';
import { CustomLogger } from '../logger/logger.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class AdminUiService {
  constructor(
    private readonly routeLoader: RouteLoaderService,
    private readonly httpService: HttpService,
    private readonly validationService: ValidationService,
    private readonly transformationService: TransformationService,
    private readonly mockingService: MockingService,
    private readonly logger: CustomLogger,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.logger.setContext('AdminUiService');
  }

  getApps(): App[] {
    return this.routeLoader.getApps();
  }

  getApp(id: string): App | undefined {
    return this.routeLoader.getApp(id);
  }

  getRoutes(appId: string): LoadedRoute[] {
    const app = this.routeLoader.getApp(appId);
    return app ? app.routes : [];
  }

  getRoute(appId: string, routeId: string): LoadedRoute | undefined {
    return this.routeLoader.getRoute(appId, routeId);
  }

  async updateRoute(appId: string, routeId: string, updatedRoute: LoadedRoute): Promise<void> {
    await this.routeLoader.updateRoute(appId, routeId, updatedRoute);
  }

  async toggleMock(appId: string, routeId: string, environment: string, mock: boolean): Promise<void> {
    const route = this.routeLoader.getRoute(appId, routeId);
    if (!route) {
      throw new Error('Route not found');
    }

    if (!route.environments[environment]) {
      throw new Error(`Environment ${environment} not found`);
    }

    route.environments[environment].mock = mock;
    await this.updateRoute(appId, routeId, route);

    // Forcer le rechargement des routes pour vider le cache
    await this.routeLoader.loadRoutes();
  }

  async testRoute(appId: string, routeId: string, data: any, environment: string = 'integration'): Promise<any> {
    const route = this.routeLoader.getRoute(appId, routeId);
    if (!route) {
      throw new Error('Route not found');
    }

    if (!route.environments[environment]) {
      throw new Error(`Environment ${environment} not found`);
    }

    // Vérifier si le mock est activé
    if (route.environments[environment].mock) {
      // Utiliser le MockingService pour obtenir la réponse mockée
      return this.mockingService.getMockResponse(route, environment);
    }

    console.log(route)

    // Si pas de mock, faire une requête au proxy
    const transformedData = await this.transformationService.transform(
      data,
      route.input_transform,
      route.id
    );
    console.log(transformedData)

    const response = await this.httpService.request({
      ...route,
      backend_url: route.environments[environment].backend_url
    }, transformedData);

    console.log(response);


    const transformedResponse = await this.transformationService.transformOutput(
      response,
      route.output_transform,
      route.id
    );

    return transformedResponse;
  }

  async updateEnvironmentMock(appId: string, environment: string, mockEnabled: boolean) {
    try {
      const apps = this.routeLoader.getApps();
      const app = apps.find(a => a.id === appId);
      
      if (!app) {
        throw new Error(`App ${appId} not found`);
      }

      // Mettre à jour la configuration de l'environnement
      if (!app.environments) {
        app.environments = {};
      }
      if (!app.environments[environment]) {
        app.environments[environment] = {};
      }
      app.environments[environment].mock = mockEnabled;

      // Sauvegarder les changements
      await this.routeLoader.updateRoutes(appId, app.routes);

      this.logger.log({
        message: 'Environment mock updated',
        app_id: appId,
        environment,
        mock_enabled: mockEnabled
      });

      return true;
    } catch (error) {
      this.logger.error({
        message: 'Failed to update environment mock',
        app_id: appId,
        environment,
        error: error.message
      });
      throw error;
    }
  }
} 