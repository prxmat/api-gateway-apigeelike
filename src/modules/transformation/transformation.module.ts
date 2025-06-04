import { Module } from '@nestjs/common';
import { TransformationService } from './transformation.service';

@Module({
  imports: [],
  providers: [TransformationService],
  exports: [TransformationService],
})
export class TransformationModule {} 