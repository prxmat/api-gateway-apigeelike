import { Controller, Get, Post, Param, Body, Patch } from '@nestjs/common';
import { AdminUiService } from './admin-ui.service';
import { LoadedRoute } from '../route-loader/interfaces/loaded-route.interface';

@Controller("admin")
export class AdminUiController {
  constructor(private readonly adminUiService: AdminUiService) {}

  @Get('routes')
  getRoutes(): LoadedRoute[] {
    return this.adminUiService.getRoutes();
  }

  @Get('routes/:id')
  getRoute(@Param('id') id: string): LoadedRoute | undefined {
    return this.adminUiService.getRoute(id);
  }

  @Patch('routes/:id')
  updateRoute(@Param('id') id: string, @Body() data: Partial<LoadedRoute>): Promise<LoadedRoute> {
    return this.adminUiService.updateRoute(id, data);
  }

  @Post('routes/:id/toggle-mock')
  toggleMock(@Param('id') id: string): Promise<LoadedRoute> {
    return this.adminUiService.toggleMock(id);
  }

  @Post('routes/:id/test')
  testRoute(@Param('id') id: string, @Body() data: any): Promise<any> {
    return this.adminUiService.testRoute(id, data);
  }
} 