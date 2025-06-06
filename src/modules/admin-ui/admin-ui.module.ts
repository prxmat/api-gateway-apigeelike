import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AdminUiController } from './admin-ui.controller';
import { AdminUiService } from './admin-ui.service';
import { RouteLoaderModule } from '../route-loader/route-loader.module';
import { HttpModule } from '../http/http.module';
import { ValidationModule } from '../validation/validation.module';
import { TransformationModule } from '../transformation/transformation.module';
import { MockingModule } from '../mocking/mocking.module';
import { ProxyModule } from '../proxy/proxy.module';

@Module({
  imports: [
    RouteLoaderModule,
    HttpModule,
    ValidationModule,
    TransformationModule,
    MockingModule,
    ProxyModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, 'public'),
      serveRoot: '/admin',
      exclude: ['/api*'],
    }),
  ],
  controllers: [AdminUiController],
  providers: [AdminUiService],
})
export class AdminUiModule {} 