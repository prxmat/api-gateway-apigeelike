import { Test, TestingModule } from '@nestjs/testing';
import { ValidationService } from './validation.service';
import { RouteLoaderService } from '../route-loader/route-loader.service';
import { BadRequestException } from '@nestjs/common';

describe('ValidationService', () => {
  let service: ValidationService;
  let routeLoader: RouteLoaderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ValidationService,
        {
          provide: RouteLoaderService,
          useValue: {
            getRoutes: jest.fn().mockReturnValue([
              {
                path: '/api/users',
                method: 'POST',
                input_validation: {
                  type: 'object',
                  required: ['name', 'email'],
                  properties: {
                    name: { type: 'string', minLength: 2 },
                    email: { type: 'string', format: 'email' },
                  },
                },
                output: {
                  validate_schema: {
                    type: 'object',
                    required: ['id', 'name', 'email'],
                    properties: {
                      id: { type: 'number' },
                      name: { type: 'string' },
                      email: { type: 'string', format: 'email' },
                    },
                  },
                },
              },
            ]),
          },
        },
      ],
    }).compile();

    service = module.get<ValidationService>(ValidationService);
    routeLoader = module.get<RouteLoaderService>(RouteLoaderService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
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