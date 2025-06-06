import { Test, TestingModule } from '@nestjs/testing';
import { ValidationService } from './validation.service';
import { RouteLoaderService } from '../route-loader/route-loader.service';
import { BadRequestException } from '@nestjs/common';
import Ajv from 'ajv';

describe('ValidationService', () => {
  let service: ValidationService;
  let routeLoader: RouteLoaderService;
  let ajvCompileSpy: jest.SpyInstance;

  const mockRoutes = [
    {
      id: 'test-route',
      path: '/test',
      method: 'POST',
      input: {
        validate_schema: {
          type: 'object',
          required: ['name', 'age'],
          properties: {
            name: { type: 'string' },
            age: { type: 'number' }
          }
        }
      },
      output: {
        validate_schema: {
          type: 'object',
          required: ['fullName', 'years'],
          properties: {
            fullName: { type: 'string' },
            years: { type: 'number' }
          }
        }
      }
    }
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ValidationService,
        {
          provide: RouteLoaderService,
          useValue: {
            getRoutes: jest.fn().mockReturnValue(mockRoutes)
          }
        }
      ],
    }).compile();

    service = module.get<ValidationService>(ValidationService);
    routeLoader = module.get<RouteLoaderService>(RouteLoaderService);

    // Créer un spy sur la méthode compile d'Ajv
    const ajv = (service as any).ajv;
    ajvCompileSpy = jest.spyOn(ajv, 'compile');
  });

  afterEach(() => {
    ajvCompileSpy.mockRestore();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should compile schemas on init', async () => {
    await service.onModuleInit();
    
    const compiledSchema = service.getCompiledSchema('test-route');
    expect(compiledSchema).toBeDefined();
    expect(compiledSchema?.input).toBeDefined();
    expect(compiledSchema?.output).toBeDefined();
    
    // Vérifier que compile n'a été appelé que deux fois (une pour input, une pour output)
    expect(ajvCompileSpy).toHaveBeenCalledTimes(2);
  });

  it('should use precompiled schemas for validation', async () => {
    await service.onModuleInit();
    
    // Réinitialiser le compteur d'appels
    ajvCompileSpy.mockClear();
    
    const request = {
      body: { name: 'John', age: 30 }
    };
    
    await service.validateRequest(request, mockRoutes[0].input.validate_schema, 'test-route');
    
    // Vérifier que compile n'a pas été appelé à nouveau
    expect(ajvCompileSpy).not.toHaveBeenCalled();
  });

  it('should fallback to runtime compilation if routeId not found', async () => {
    const request = {
      body: { name: 'John', age: 30 }
    };
    
    await service.validateRequest(request, mockRoutes[0].input.validate_schema, 'non-existent-route');
    
    // Vérifier que compile a été appelé une fois
    expect(ajvCompileSpy).toHaveBeenCalledTimes(1);
  });

  it('should handle both input and output validation', async () => {
    await service.onModuleInit();
    
    // Réinitialiser le compteur d'appels
    ajvCompileSpy.mockClear();
    
    const request = {
      body: { name: 'John', age: 30 }
    };
    
    await service.validateRequest(request, mockRoutes[0].input.validate_schema, 'test-route');
    await service.validateResponse('/test', 'POST', { fullName: 'John', years: 30 });
    
    // Vérifier que compile n'a pas été appelé à nouveau
    expect(ajvCompileSpy).not.toHaveBeenCalled();
  });

  describe('validateRequest', () => {
    it('should validate valid request', async () => {
      const data = {
        name: 'John Doe',
        email: 'john@example.com',
      };

      await expect(
        service.validateRequest(
          { path: '/api/users', method: 'POST', body: data } as any,
          {
            type: 'object',
            required: ['name', 'email'],
            properties: {
              name: { type: 'string', minLength: 2 },
              email: { type: 'string', format: 'email' },
            },
          },
        ),
      ).resolves.not.toThrow();
    });

    it('should reject invalid request', async () => {
      const data = {
        name: 'J', // Too short
        email: 'invalid-email',
      };

      await expect(
        service.validateRequest(
          { path: '/api/users', method: 'POST', body: data } as any,
          {
            type: 'object',
            required: ['name', 'email'],
            properties: {
              name: { type: 'string', minLength: 2 },
              email: { type: 'string', format: 'email' },
            },
          },
        ),
      ).rejects.toThrow();
    });

    it('should handle missing validation schema', async () => {
      const data = { name: 'John Doe' };

      await expect(
        service.validateRequest(
          { path: '/api/other', method: 'GET', body: data } as any,
          undefined,
        ),
      ).resolves.not.toThrow();
    });
  });

  describe('validateResponse', () => {
    it('should pass validation for valid response', async () => {
      const data = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
      };

      await expect(
        service.validateResponse('/api/users', 'POST', data)
      ).resolves.not.toThrow();
    });

    it('should throw BadRequestException for invalid response', async () => {
      const data = {
        id: '1', // should be number
        name: 'John Doe',
        email: 'invalid-email',
      };

      await expect(
        service.validateResponse('/api/users', 'POST', data)
      ).rejects.toThrow(BadRequestException);
    });

    it('should not validate if no schema is defined', async () => {
      const data = { any: 'data' };

      await expect(
        service.validateResponse('/api/other', 'GET', data)
      ).resolves.not.toThrow();
    });
  });
}); 