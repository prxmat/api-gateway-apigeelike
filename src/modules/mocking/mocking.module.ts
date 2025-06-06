import { Module } from '@nestjs/common';
import { MockingService } from './mocking.service';
import { RouteLoaderModule } from '../route-loader/route-loader.module';

@Module({
  imports: [RouteLoaderModule],
  providers: [MockingService],
  exports: [MockingService],
})
export class MockingModule {} 