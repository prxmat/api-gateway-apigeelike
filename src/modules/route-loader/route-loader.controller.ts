import { Controller } from '@nestjs/common';
import { RouteLoaderService } from './route-loader.service';

@Controller('routes')
export class RouteLoaderController {
  constructor(private readonly routeLoaderService: RouteLoaderService) {}
} 