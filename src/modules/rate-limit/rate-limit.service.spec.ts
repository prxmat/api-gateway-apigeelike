import { Test, TestingModule } from '@nestjs/testing';
import { RateLimitService } from './rate-limit.service';

describe('RateLimitService', () => {
  let service: RateLimitService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RateLimitService],
    }).compile();

    service = module.get<RateLimitService>(RateLimitService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('rate limiting', () => {
    const routeId = 'test-route';
    const key = 'test-key';
    const points = 2;
    const duration = 1; // 1 second

    beforeEach(() => {
      service.createLimiter(routeId, points, duration);
    });

    it('should allow requests within limit', async () => {
      expect(await service.checkLimit(routeId, key)).toBe(true);
      expect(await service.checkLimit(routeId, key)).toBe(true);
    });

    it('should reject requests over limit', async () => {
      await service.checkLimit(routeId, key);
      await service.checkLimit(routeId, key);
      expect(await service.checkLimit(routeId, key)).toBe(false);
    });

    it('should reset limit after duration', async () => {
      await service.checkLimit(routeId, key);
      await service.checkLimit(routeId, key);
      expect(await service.checkLimit(routeId, key)).toBe(false);

      // Wait for duration to expire
      await new Promise(resolve => setTimeout(resolve, duration * 1000 + 100));

      expect(await service.checkLimit(routeId, key)).toBe(true);
    });

    it('should return correct remaining points', async () => {
      expect(await service.getRemainingPoints(routeId, key)).toBe(points);
      await service.checkLimit(routeId, key);
      expect(await service.getRemainingPoints(routeId, key)).toBe(points - 1);
    });

    it('should return Infinity for unknown route', async () => {
      expect(await service.getRemainingPoints('unknown-route', key)).toBe(Infinity);
    });
  });
}); 