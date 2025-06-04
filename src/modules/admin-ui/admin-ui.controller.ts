import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { AdminUiService } from './admin-ui.service';

@Controller('admin')
export class AdminUiController {
  constructor(private readonly adminUiService: AdminUiService) {}

  @Get('api/routes')
  getRoutes() {
    // TODO: retourner la liste réelle des routes
    return [
      { id: '1', path: '/api/users', method: 'GET', mock: false },
      { id: '2', path: '/api/orders', method: 'POST', mock: true },
    ];
  }

  @Post('api/mock/:routeId')
  setMock(@Param('routeId') routeId: string, @Body() body: { mock: boolean }) {
    // TODO: activer/désactiver le mock pour la route
    return { routeId, mock: body.mock, status: 'ok' };
  }

  @Post('api/reload')
  reloadConfig() {
    // TODO: recharger la config
    return { status: 'reloaded' };
  }

  @Post('api/test/:routeId')
  testRoute(@Param('routeId') routeId: string, @Body() body: any) {
    // TODO: tester la route avec le JSON d'entrée
    return { routeId, input: body, output: { result: 'mocked output' } };
  }
} 