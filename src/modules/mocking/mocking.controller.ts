import { Controller } from '@nestjs/common';
import { MockingService } from './mocking.service';

@Controller('mocking')
export class MockingController {
  constructor(private readonly mockingService: MockingService) {}
} 