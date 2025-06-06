import { Module } from '@nestjs/common';
import { AdminUiModule } from '../admin-ui/admin-ui.module';
import { RouteLoaderModule } from '../route-loader/route-loader.module';
import { ValidationModule } from '../validation/validation.module';
import { TransformationModule } from '../transformation/transformation.module';
import { MockingModule } from '../mocking/mocking.module';
import { RateLimitModule } from '../rate-limit/rate-limit.module';
import { MetricsModule } from '../metrics/metrics.module';
import { LoggerModule } from '../logger/logger.module';
import { HttpModule } from '../http/http.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    RouteLoaderModule,
    ValidationModule,
    TransformationModule,
    MockingModule,
    RateLimitModule,
    MetricsModule,
    LoggerModule,
    HttpModule,
    AdminUiModule,
  ],
})
export class AdminServerModule {} 