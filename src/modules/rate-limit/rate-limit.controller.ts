import { Controller } from '@nestjs/common';
import { RateLimitService } from './rate-limit.service';

@Controller('rate-limit')
export class RateLimitController {
  constructor(private readonly rateLimitService: RateLimitService) {}
} 