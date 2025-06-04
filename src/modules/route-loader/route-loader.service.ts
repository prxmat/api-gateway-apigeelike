import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as chokidar from 'chokidar';
import * as yaml from 'yaml';
import * as fs from 'fs';
import * as path from 'path';
import { LoadedRoute } from './interfaces/loaded-route.interface';

@Injectable()
export class RouteLoaderService implements OnModuleInit, OnModuleDestroy {
  private routes: LoadedRoute[] = [];
  private watcher: chokidar.FSWatcher;
  private readonly routesPath: string;

  constructor(private eventEmitter: EventEmitter2) {
    // En test, utiliser le fichier de routes approprié selon le type de test
    const testType = process.env.TEST_TYPE;
    if (testType === 'proxy') {
      this.routesPath = path.join(process.cwd(), 'routes.proxy.yaml');
    } else if (testType === 'validation') {
      this.routesPath = path.join(process.cwd(), 'routes.validation.yaml');
    } else {
      this.routesPath = path.join(process.cwd(), 'routes.yaml');
    }
  }

  async onModuleInit() {
    await this.loadRoutes();
    this.setupWatcher();
  }

  onModuleDestroy() {
    this.watcher?.close();
  }

  getRoutes(): LoadedRoute[] {
    return this.routes;
  }

  private async loadRoutes() {
    try {
      const fileContent = await fs.promises.readFile(this.routesPath, 'utf8');
      console.log('Routes file content:', fileContent);
      const parsed = yaml.parse(fileContent);
      console.log('Parsed routes:', parsed);
      const parsedRoutes = Array.isArray(parsed) ? parsed : parsed?.routes;
      console.log('Final routes:', parsedRoutes);
      this.routes = Array.isArray(parsedRoutes) ? parsedRoutes : [];
      this.eventEmitter.emit('routes.loaded', this.routes);
    } catch (error) {
      console.error('Error loading routes:', error);
      this.routes = [];
    }
  }

  private setupWatcher() {
    this.watcher = chokidar.watch(this.routesPath, {
      persistent: true,
      ignoreInitial: true,
    });

    this.watcher
      .on('add', () => this.loadRoutes())
      .on('change', () => this.loadRoutes())
      .on('unlink', () => {
        this.routes = [];
        this.eventEmitter.emit('routes.loaded', []);
      });
  }
} 