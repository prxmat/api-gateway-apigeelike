import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ValidationService } from './validation.service';
import { ValidationMiddleware } from './validation.middleware';
import { RouteLoaderModule } from '../route-loader/route-loader.module';

@Module({
  imports: [RouteLoaderModule],
  providers: [ValidationService],
  exports: [ValidationService],
})
export class ValidationModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(ValidationMiddleware)
      .forRoutes('*');
  }
} 