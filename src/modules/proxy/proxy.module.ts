import { Module } from '@nestjs/common';
import { ProxyService } from './proxy.service';
import { ProxyController } from './proxy.controller';
import { RouteLoaderModule } from '../route-loader/route-loader.module';

@Module({
  providers: [ProxyService],
  controllers: [ProxyController],
  exports: [ProxyService],
  imports: [RouteLoaderModule],
})
export class ProxyModule {} 