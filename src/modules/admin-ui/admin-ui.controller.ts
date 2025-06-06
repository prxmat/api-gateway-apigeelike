import { Controller, Get, Post, Body, Param, Put, Headers, Query, NotFoundException } from '@nestjs/common';
import { AdminUiService } from './admin-ui.service';
import { LoadedRoute } from '../route-loader/interfaces/loaded-route.interface';
import { App } from '../route-loader/interfaces/app.interface';

@Controller('admin')
export class AdminUiController {
  constructor(
    private readonly adminUiService: AdminUiService
  ) {}

  @Get('apps')
  getApps(): App[] {
    return this.adminUiService.getApps();
  }

  @Get('apps/:id')
  getApp(@Param('id') id: string): App | undefined {
    return this.adminUiService.getApp(id);
  }

  @Get('apps/:appId/routes')
  getRoutes(@Param('appId') appId: string): LoadedRoute[] {
    return this.adminUiService.getRoutes(appId);
  }

  @Get('apps/:appId/routes/:routeId')
  getRoute(
    @Param('appId') appId: string,
    @Param('routeId') routeId: string
  ): LoadedRoute | undefined {
    return this.adminUiService.getRoute(appId, routeId);
  }

  @Put('apps/:appId/routes/:routeId')
  async updateRoute(
    @Param('appId') appId: string,
    @Param('routeId') routeId: string,
    @Body() updatedRoute: LoadedRoute
  ): Promise<void> {
    await this.adminUiService.updateRoute(appId, routeId, updatedRoute);
  }

  @Post('apps/:appId/routes/:routeId/environments/:environment/mock')
  async toggleMock(
    @Param('appId') appId: string,
    @Param('routeId') routeId: string,
    @Param('environment') environment: string,
    @Body('mock') mock: boolean
  ): Promise<void> {
    await this.adminUiService.toggleMock(appId, routeId, environment, mock);
  }

  @Post('apps/:appId/routes/:routeId/test')
  async testRoute(
    @Param('appId') appId: string,
    @Param('routeId') routeId: string,
    @Body() data: any,
    @Headers('x-environment') environment: string
  ): Promise<any> {
    return this.adminUiService.testRoute(appId, routeId, data, environment);
  }

  @Put('apps/:appId/environments/:environment/mock')
  async updateEnvironmentMock(
    @Param('appId') appId: string,
    @Param('environment') environment: string,
    @Body('enabled') enabled: boolean,
  ): Promise<void> {
    await this.adminUiService.updateEnvironmentMock(appId, environment, enabled);
  }
} 