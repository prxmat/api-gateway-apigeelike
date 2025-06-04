import { Module } from '@nestjs/common';
import { RouteLoaderModule } from './modules/route-loader/route-loader.module';
import { ProxyModule } from './modules/proxy/proxy.module';
import { ValidationModule } from './modules/validation/validation.module';
import { TransformationModule } from './modules/transformation/transformation.module';
import { MockingModule } from './modules/mocking/mocking.module';
import { AdminUiModule } from './modules/admin-ui/admin-ui.module';
import { ObservabilityModule } from './modules/observability/observability.module';
import { RateLimitModule } from './modules/rate-limit/rate-limit.module';

@Module({
  imports: [
    RouteLoaderModule,
    ProxyModule,
    ValidationModule,
    TransformationModule,
    MockingModule,
    AdminUiModule,
    ObservabilityModule,
    RateLimitModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {} 