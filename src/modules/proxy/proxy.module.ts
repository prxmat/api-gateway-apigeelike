import { Module } from '@nestjs/common';
import { ProxyController } from './proxy.controller';
import { RouteLoaderModule } from '../route-loader/route-loader.module';
import { ValidationModule } from '../validation/validation.module';
import { TransformationModule } from '../transformation/transformation.module';
import { MockingModule } from '../mocking/mocking.module';
import { RateLimitModule } from '../rate-limit/rate-limit.module';
import { MetricsModule } from '../metrics/metrics.module';
import { HttpModule } from '../http/http.module';

@Module({
  imports: [
    RouteLoaderModule,
    ValidationModule,
    TransformationModule,
    MockingModule,
    RateLimitModule,
    MetricsModule,
    HttpModule,
  ],
  controllers: [ProxyController],
})
export class ProxyModule {} 