import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AdminUiController } from './admin-ui.controller';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '../../../admin-ui/dist'),
      serveRoot: '/admin',
    }),
  ],
  controllers: [AdminUiController],
})
export class AdminUiModule {} 