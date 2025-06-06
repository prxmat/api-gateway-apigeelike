import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RouteLoaderModule } from './modules/route-loader/route-loader.module';
import { ValidationModule } from './modules/validation/validation.module';
import { TransformationModule } from './modules/transformation/transformation.module';
import { MockingModule } from './modules/mocking/mocking.module';
import { RateLimitModule } from './modules/rate-limit/rate-limit.module';
import { MetricsModule } from './modules/metrics/metrics.module';
import { LoggerModule } from './modules/logger/logger.module';
import { ProxyModule } from './modules/proxy/proxy.module';
import { HttpModule } from './modules/http/http.module';
import { AdminUiModule } from './modules/admin-ui/admin-ui.module';

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
    ProxyModule,
  ],
})
export class AppModule {} 