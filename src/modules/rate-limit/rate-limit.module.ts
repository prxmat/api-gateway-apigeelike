import { Module } from '@nestjs/common';
import { RateLimitService } from './rate-limit.service';

@Module({
  imports: [],
  providers: [RateLimitService],
  exports: [RateLimitService],
})
export class RateLimitModule {} 