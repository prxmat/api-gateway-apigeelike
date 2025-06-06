import { Injectable, OnModuleInit } from '@nestjs/common';
import { CustomLogger } from '../logger/logger.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as yaml from 'js-yaml';
import * as fs from 'fs';
import * as path from 'path';
import { LoadedRoute } from './interfaces/loaded-route.interface';
import { App } from './interfaces/app.interface';

@Injectable()
export class RouteLoaderService implements OnModuleInit {
  private apps: App[] = [];
  private routeIndex: Map<string, Map<string, LoadedRoute>> = new Map();

  constructor(
    private readonly logger: CustomLogger,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.logger.setContext('RouteLoaderService');
  }

  async onModuleInit() {
    await this.loadRoutes();
  }

  async loadRoutes() {
    try {
      const filePath = path.join(process.cwd(), 'config', 'routes.yaml');
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const config = yaml.load(fileContent) as { apps: App[] };
      
      if (!config || !config.apps || !Array.isArray(config.apps)) {
        throw new Error('Invalid routes configuration: apps must be an array');
      }

      this.apps = config.apps;
      this.buildRouteIndex();

      this.logger.log({
        message: 'Routes loaded successfully',
        count: this.apps.flatMap(app => app.routes).length,
        apps: this.apps.map(app => app.id)
      });

      // Émettre un événement pour notifier les autres services
      this.eventEmitter.emit('routes.loaded', this.apps);
    } catch (error) {
      this.logger.error({
        message: 'Failed to load routes',
        error: error.message
      });
      throw error;
    }
  }

  private buildRouteIndex() {
    this.routeIndex.clear();
    for (const app of this.apps) {
      for (const route of app.routes) {
        const method = route.method.toUpperCase();
        if (!this.routeIndex.has(method)) {
          this.routeIndex.set(method, new Map());
        }
        this.routeIndex.get(method).set(route.path, route);
      }
    }
  }

  getApps(): App[] {
    return this.apps;
  }

  getApp(id: string): App | undefined {
    return this.apps.find(app => app.id === id);
  }

  getRoutes(appId?: string): LoadedRoute[] {
    if (appId) {
      const app = this.apps.find(a => a.id === appId);
      return app ? app.routes : [];
    }
    return this.apps.flatMap(app => app.routes);
  }

  getRoute(appId: string, routeId: string): LoadedRoute | undefined {
    const app = this.apps.find(a => a.id === appId);
    return app ? app.routes.find(r => r.id === routeId) : undefined;
  }

  async updateRoute(appId: string, routeId: string, updatedRoute: LoadedRoute): Promise<void> {
    const app = this.apps.find(a => a.id === appId);
    if (!app) {
      throw new Error('App not found');
    }

    const routeIndex = app.routes.findIndex(route => route.id === routeId);
    if (routeIndex === -1) {
      throw new Error('Route not found');
    }

    // Mettre à jour la route dans le tableau
    app.routes[routeIndex] = updatedRoute;

    // Sauvegarder les changements dans le fichier YAML
    const filePath = path.join(process.cwd(), 'config', 'routes.yaml');
    const config = { apps: this.apps };
    const yamlContent = yaml.dump(config);
    fs.writeFileSync(filePath, yamlContent);

    // Reconstruire l'index après la sauvegarde
    this.buildRouteIndex();

    // Émettre un événement pour notifier les autres services
    this.eventEmitter.emit('routes.loaded', this.apps);

    this.logger.log({
      message: 'Route updated successfully',
      app_id: appId,
      route_id: routeId
    });
  }

  async updateRoutes(appId: string, routes: LoadedRoute[]) {
    try {
      const appIndex = this.apps.findIndex(app => app.id === appId);
      if (appIndex === -1) {
        throw new Error(`App ${appId} not found`);
      }

      // Mettre à jour les routes
      this.apps[appIndex].routes = routes;

      // Sauvegarder les changements dans le fichier YAML
      const filePath = path.join(process.cwd(), 'config', 'routes.yaml');
      const config = { apps: this.apps };
      const yamlContent = yaml.dump(config);
      fs.writeFileSync(filePath, yamlContent);

      // Reconstruire l'index après la sauvegarde
      this.buildRouteIndex();

      // Émettre un événement pour notifier les autres services
      this.eventEmitter.emit('routes.loaded', this.apps);

      this.logger.log({
        message: 'Routes updated successfully',
        app_id: appId,
        route_count: routes.length
      });

      return true;
    } catch (error) {
      this.logger.error({
        message: 'Failed to update routes',
        app_id: appId,
        error: error.message
      });
      throw error;
    }
  }

  findRoute(method: string, path: string): LoadedRoute | undefined {
    const methodRoutes = this.routeIndex.get(method.toUpperCase());
    return methodRoutes ? methodRoutes.get(path) : undefined;
  }

  async isMockEnabled(routeId: string, environment: string): Promise<boolean> {
    const route = this.apps
      .flatMap(app => app.routes)
      .find(r => r.id === routeId);

    if (!route) {
      return false;
    }

    const envConfig = route.environments[environment];
    if (!envConfig) {
      return false;
    }

    return envConfig.mock === true;
  }
} 