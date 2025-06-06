import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ConfigModule } from '@nestjs/config';
import { RouteLoaderService } from './route-loader.service';

@Module({
  imports: [
    ConfigModule,
    EventEmitterModule.forRoot()
  ],
  providers: [RouteLoaderService],
  exports: [RouteLoaderService],
})
export class RouteLoaderModule {} 