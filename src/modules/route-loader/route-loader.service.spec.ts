jest.mock('chokidar', () => ({
  watch: jest.fn(() => ({
    on: jest.fn().mockReturnThis(),
    close: jest.fn(),
  })),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RouteLoaderService } from './route-loader.service';
import * as fs from 'fs';

jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
  },
}));

describe('RouteLoaderService', () => {
  let service: RouteLoaderService;
  let eventEmitter: EventEmitter2;
  const mockRoutes = [
    {
      path: '/api/users',
      method: 'GET',
      target: 'http://users-service/api/users',
    },
    {
      path: '/api/orders',
      method: 'POST',
      target: 'http://orders-service/api/orders',
      options: {
        timeout: 5000,
      },
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RouteLoaderService,
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RouteLoaderService>(RouteLoaderService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);

    // Mock fs.promises.readFile
    (fs.promises.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockRoutes));

    // Mock chokidar.watch
    const mockWatcher = {
      on: jest.fn().mockReturnThis(),
      close: jest.fn(),
    };
    (require('chokidar').watch as jest.Mock).mockReturnValue(mockWatcher);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should load routes on init', async () => {
    await service.onModuleInit();
    expect(fs.promises.readFile).toHaveBeenCalled();
    expect(eventEmitter.emit).toHaveBeenCalledWith('routes.loaded', mockRoutes);
  });

  it('should return loaded routes', async () => {
    await service.onModuleInit();
    const routes = service.getRoutes();
    expect(routes).toEqual(mockRoutes);
  });

  it('should handle file changes', async () => {
    const newRoutes = [
      {
        path: '/api/products',
        method: 'GET',
        target: 'http://products-service/api/products',
      },
    ];

    (fs.promises.readFile as jest.Mock).mockResolvedValueOnce(JSON.stringify(newRoutes));

    await service.onModuleInit();
    const watcher = (require('chokidar').watch as jest.Mock).mock.results[0].value;
    const changeCallback = watcher.on.mock.calls.find(call => call[0] === 'change')[1];

    await changeCallback();
    expect(eventEmitter.emit).toHaveBeenCalledWith('routes.loaded', newRoutes);
  });

  it('should handle file deletion', async () => {
    await service.onModuleInit();
    const watcher = (require('chokidar').watch as jest.Mock).mock.results[0].value;
    const unlinkCallback = watcher.on.mock.calls.find(call => call[0] === 'unlink')[1];

    unlinkCallback();
    expect(eventEmitter.emit).toHaveBeenCalledWith('routes.loaded', []);
    expect(service.getRoutes()).toEqual([]);
  });
}); 