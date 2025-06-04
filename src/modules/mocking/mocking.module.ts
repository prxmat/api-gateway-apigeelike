import { Module } from '@nestjs/common';
import { MockingService } from './mocking.service';

@Module({
  imports: [],
  providers: [MockingService],
  exports: [MockingService],
})
export class MockingModule {} 