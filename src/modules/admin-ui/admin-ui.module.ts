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

@Module({
  imports: [
    RouteLoaderModule,
    HttpModule,
    ValidationModule,
    TransformationModule,
    MockingModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '../../../admin-ui/dist'),
      serveRoot: '/admin',
    }),
  ],
  controllers: [AdminUiController],
  providers: [AdminUiService],
})
export class AdminUiModule {} 