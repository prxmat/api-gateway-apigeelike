import { Module } from '@nestjs/common';
import { TransformationService } from './transformation.service';
import { RouteLoaderModule } from '../route-loader/route-loader.module';

@Module({
  imports: [RouteLoaderModule],
  providers: [TransformationService],
  exports: [TransformationService],
})
export class TransformationModule {} 