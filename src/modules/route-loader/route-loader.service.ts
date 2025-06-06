import { Injectable, OnModuleInit } from '@nestjs/common';
import * as yaml from 'js-yaml';
import * as fs from 'fs';
import * as path from 'path';
import { LoadedRoute } from './interfaces/loaded-route.interface';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class RouteLoaderService implements OnModuleInit {
  private routes: LoadedRoute[] = [];
  private routeIndex: Map<string, Map<string, LoadedRoute>> = new Map();

  constructor(private eventEmitter: EventEmitter2) {}

  async onModuleInit() {
    await this.loadRoutes();
  }

  private async loadRoutes() {
    try {
      const filePath = path.join(process.cwd(), 'config', 'routes.yaml');
      const fileContents = fs.readFileSync(filePath, 'utf8');
      const config = yaml.load(fileContents) as { routes: LoadedRoute[] };
      
      this.routes = config.routes;
      this.buildRouteIndex();
      
      // Émettre un événement pour notifier les autres services
      this.eventEmitter.emit('routes.loaded', this.routes);
    } catch (error) {
      console.error('Error loading routes:', error);
      throw error;
    }
  }

  private buildRouteIndex() {
    this.routeIndex.clear();
    for (const route of this.routes) {
      const method = route.method.toUpperCase();
      if (!this.routeIndex.has(method)) {
        this.routeIndex.set(method, new Map());
      }
      this.routeIndex.get(method).set(route.path, route);
    }
  }

  getRoutes(): LoadedRoute[] {
    return this.routes;
  }

  getRoute(id: string): LoadedRoute | undefined {
    return this.routes.find(route => route.id === id);
  }

  async updateRoute(id: string, updatedRoute: LoadedRoute): Promise<void> {
    const index = this.routes.findIndex(route => route.id === id);
    if (index === -1) {
      throw new Error('Route not found');
    }

    // Mettre à jour la route dans le tableau
    this.routes[index] = updatedRoute;

    // Reconstruire l'index
    this.buildRouteIndex();

    // Sauvegarder les changements dans le fichier YAML
    const filePath = path.join(process.cwd(), 'config', 'routes.yaml');
    const config = { routes: this.routes };
    fs.writeFileSync(filePath, yaml.dump(config));

    // Émettre un événement pour notifier les autres services
    this.eventEmitter.emit('routes.loaded', this.routes);
  }

  findRoute(method: string, path: string): LoadedRoute | undefined {
    const methodMap = this.routeIndex.get(method.toUpperCase());
    if (!methodMap) {
      return undefined;
    }
    return methodMap.get(path);
  }
} 