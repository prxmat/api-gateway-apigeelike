import { MockingService } from './mocking.service';
import * as fs from 'fs';
import * as path from 'path';
import { Test, TestingModule } from '@nestjs/testing';
import { RouteLoaderService } from '../route-loader/route-loader.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

jest.mock('fs', () => ({
  readFileSync: jest.fn(),
  existsSync: jest.fn(),
}));

describe('MockingService', () => {
  let service: MockingService;
  let routeLoader: RouteLoaderService;
  let eventEmitter: EventEmitter2;
  let readFileSyncSpy: jest.SpyInstance;

  const mockRoutes = [
    {
      id: 'test-route-1',
      path: '/test1',
      method: 'GET',
      mock: true,
      mock_response: {
        data: {
          id: 1,
          name: 'Test 1',
          status: '@transform:status'
        }
      }
    },
    {
      id: 'test-route-2',
      path: '/test2',
      method: 'GET',
      mock: true,
      mock_response: 'mocks/test2.json'
    }
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MockingService,
        {
          provide: RouteLoaderService,
          useValue: {
            getRoutes: jest.fn().mockReturnValue(mockRoutes)
          }
        },
        {
          provide: EventEmitter2,
          useValue: {
            on: jest.fn()
          }
        }
      ],
    }).compile();

    service = module.get<MockingService>(MockingService);
    routeLoader = module.get<RouteLoaderService>(RouteLoaderService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);

    // Mock fs.existsSync pour retourner true
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    
    // Mock fs.readFileSync pour retourner un JSON valide
    (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify({
      data: {
        id: 2,
        name: 'Test 2',
        status: '@transform:status'
      }
    }));

    readFileSyncSpy = jest.spyOn(fs, 'readFileSync');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should load mock responses on init', async () => {
    await service.onModuleInit();
    
    // Vérifier que les réponses sont en cache
    const response1 = service.getMockResponseFromCache('test-route-1');
    const response2 = service.getMockResponseFromCache('test-route-2');
    
    expect(response1).toBeDefined();
    expect(response2).toBeDefined();
    expect(response1.data.status).toBeDefined();
    expect(response2.data.status).toBeDefined();
  });

  it('should read mock files only once', async () => {
    await service.onModuleInit();
    
    // Appeler getMockResponse plusieurs fois
    await service.getMockResponse(mockRoutes[1]);
    await service.getMockResponse(mockRoutes[1]);
    await service.getMockResponse(mockRoutes[1]);
    
    // Vérifier que readFileSync n'a été appelé qu'une seule fois
    expect(readFileSyncSpy).toHaveBeenCalledTimes(1);
  });

  it('should reload mock responses when routes change', async () => {
    await service.onModuleInit();
    
    // Simuler un changement de routes
    const newRoutes = [...mockRoutes];
    newRoutes[0].mock_response = {
      data: {
        id: 3,
        name: 'Test 3',
        status: '@transform:status'
      }
    };
    
    (routeLoader.getRoutes as jest.Mock).mockReturnValue(newRoutes);
    
    // Déclencher l'événement routes.loaded
    const onCallback = (eventEmitter.on as jest.Mock).mock.calls[0][1];
    await onCallback();
    
    // Vérifier que les réponses ont été rechargées
    const response = service.getMockResponseFromCache('test-route-1');
    expect(response.data.id).toBe(3);
  });

  it('should handle missing mock files gracefully', async () => {
    // Simuler un fichier manquant
    (fs.existsSync as jest.Mock).mockReturnValueOnce(false);
    
    await service.onModuleInit();
    
    // Vérifier que le service continue de fonctionner
    const response = service.getMockResponseFromCache('test-route-2');
    expect(response).toBeUndefined();
  });

  it('should return inline mock response', async () => {
    const route = {
      mock: true,
      mock_response: { foo: 'bar', value: 42 }
    };
    const result = await service.getMockResponse(route);
    expect(result).toEqual({ foo: 'bar', value: 42 });
  });

  it('should return mock response from file', async () => {
    const mockObj = { hello: 'world', arr: [1,2,3] };
    const filePath = path.join(process.cwd(), 'mock-test.json');
    fs.writeFileSync(filePath, JSON.stringify(mockObj), 'utf-8');
    const route = {
      mock: true,
      mock_response: 'mock-test.json'
    };
    const result = await service.getMockResponse(route);
    expect(result).toEqual(mockObj);
    fs.unlinkSync(filePath);
  });

  it('should return undefined if mock is false', async () => {
    const route = {
      mock: false,
      mock_response: { foo: 'bar' }
    };
    const result = await service.getMockResponse(route);
    expect(result).toBeUndefined();
  });

  it('should return undefined if no mock_response', async () => {
    const route = {
      mock: true
    };
    const result = await service.getMockResponse(route);
    expect(result).toBeUndefined();
  });

  it('should throw if file does not exist', async () => {
    const route = {
      mock: true,
      mock_response: 'not-exist.json'
    };
    await expect(service.getMockResponse(route)).rejects.toThrow('Mock file not found');
  });
}); 