import { Module } from '@nestjs/common';
import { ValidationService } from './validation.service';
import { RouteLoaderModule } from '../route-loader/route-loader.module';

@Module({
  imports: [RouteLoaderModule],
  providers: [ValidationService],
  exports: [ValidationService],
})
export class ValidationModule {} 