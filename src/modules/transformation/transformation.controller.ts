import { Controller } from '@nestjs/common';
import { TransformationService } from './transformation.service';

@Controller('transformation')
export class TransformationController {
  constructor(private readonly transformationService: TransformationService) {}
} 