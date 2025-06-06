import { Test, TestingModule } from '@nestjs/testing';
import { TransformationService } from './transformation.service';
import { RouteLoaderService } from '../route-loader/route-loader.service';

describe('TransformationService', () => {
  let service: TransformationService;
  let routeLoader: RouteLoaderService;

  const mockRoute = {
    id: 'test-route',
    method: 'POST',
    path: '/test',
    backend_url: 'http://backend/test',
    input: {
      transform: '{"transformed": $}',
    },
    output: {
      transform: '{"result": $}',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransformationService,
        {
          provide: RouteLoaderService,
          useValue: {
            getRoutes: jest.fn().mockReturnValue([mockRoute]),
            findRoute: jest.fn().mockReturnValue(mockRoute),
          },
        },
      ],
    }).compile();

    service = module.get<TransformationService>(TransformationService);
    routeLoader = module.get<RouteLoaderService>(RouteLoaderService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should compile expressions during initialization', async () => {
    await service.onModuleInit();
    const compiledExpression = service.getCompiledExpression('test-route');
    expect(compiledExpression).toBeDefined();
    expect(compiledExpression?.input).toBeDefined();
    expect(compiledExpression?.output).toBeDefined();
  });

  it('should use precompiled expressions for transformation', async () => {
    await service.onModuleInit();
    const inputData = { test: 'data' };
    const result = await service.transform(inputData, mockRoute.input.transform, 'test-route');
    expect(result).toEqual({ transformed: { test: 'data' } });
  });

  it('should compile expressions at runtime if not precompiled', async () => {
    const inputData = { test: 'data' };
    const template = '{"runtime": $}';
    const result = await service.transform(inputData, template, 'non-existent-route');
    expect(result).toEqual({ runtime: { test: 'data' } });
  });

  it('should handle both input and output transformations', async () => {
    await service.onModuleInit();
    const inputData = { test: 'data' };
    
    const inputResult = await service.transform(inputData, mockRoute.input.transform, 'test-route');
    expect(inputResult).toEqual({ transformed: { test: 'data' } });

    const outputResult = await service.transformOutput(inputData, mockRoute.path, mockRoute.method);
    expect(outputResult).toEqual({ result: { test: 'data' } });
  });

  describe('transform', () => {
    it('should return original data if no expression provided', async () => {
      const data = { name: 'John', age: 30 };
      const result = await service.transform(data, '');
      expect(result).toEqual(data);
    });

    it('should perform simple mapping', async () => {
      const data = { name: 'John', age: 30 };
      const expression = '{ "fullName": name, "years": age }';
      const result = await service.transform(data, expression);
      expect(result).toEqual({ fullName: 'John', years: 30 });
    });

    it('should handle string concatenation', async () => {
      const data = { firstName: 'John', lastName: 'Doe' };
      const expression = '{ "fullName": firstName & " " & lastName }';
      const result = await service.transform(data, expression);
      expect(result).toEqual({ fullName: 'John Doe' });
    });

    it('should handle nested structures', async () => {
      const data = {
        user: {
          profile: {
            name: 'John',
            address: {
              city: 'Paris',
              country: 'France'
            }
          }
        }
      };
      const expression = '{ "userInfo": { "name": user.profile.name, "location": user.profile.address.city & ", " & user.profile.address.country } }';
      const result = await service.transform(data, expression);
      expect(result).toEqual({
        userInfo: {
          name: 'John',
          location: 'Paris, France'
        }
      });
    });

    it('should handle arrays', async () => {
      const data = {
        items: [
          { id: 1, name: 'Item 1' },
          { id: 2, name: 'Item 2' }
        ]
      };
      const expression = '{ "itemsList": items[*].{ "itemId": id, "itemName": name } }';
      const result = await service.transform(data, expression);
      expect(JSON.parse(JSON.stringify(result))).toEqual({
        itemsList: [
          { itemId: 1, itemName: 'Item 1' },
          { itemId: 2, itemName: 'Item 2' }
        ]
      });
    });

    it('should throw error for invalid expression', async () => {
      const data = { name: 'John' };
      const expression = '{ invalid expression }';
      await expect(service.transform(data, expression)).rejects.toThrow('Transformation error');
    });
  });
}); 