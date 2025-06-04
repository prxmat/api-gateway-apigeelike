import { Controller } from '@nestjs/common';
import { ValidationService } from './validation.service';

@Controller('validation')
export class ValidationController {
  constructor(private readonly validationService: ValidationService) {}
} 