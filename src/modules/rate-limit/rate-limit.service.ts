import { Injectable } from '@nestjs/common';
import { RateLimiterMemory } from 'rate-limiter-flexible';

@Injectable()
export class RateLimitService {
  private limiters: Map<string, RateLimiterMemory> = new Map();

  createLimiter(routeId: string, points: number, duration: number) {
    const limiter = new RateLimiterMemory({
      points: points,
      duration: duration,
    });
    this.limiters.set(routeId, limiter);
    return limiter;
  }

  getLimiter(routeId: string): RateLimiterMemory | undefined {
    return this.limiters.get(routeId);
  }

  async checkLimit(routeId: string, key: string): Promise<boolean> {
    const limiter = this.getLimiter(routeId);
    if (!limiter) return true;

    try {
      await limiter.consume(key);
      return true;
    } catch (error) {
      return false;
    }
  }

  async getRemainingPoints(routeId: string, key: string): Promise<number> {
    const limiter = this.getLimiter(routeId);
    if (!limiter) return Infinity;

    try {
      const res = await limiter.get(key);
      return res ? res.remainingPoints : limiter.points;
    } catch {
      return 0;
    }
  }
} 