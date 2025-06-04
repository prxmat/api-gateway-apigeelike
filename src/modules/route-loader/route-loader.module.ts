import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { RouteLoaderService } from './route-loader.service';

@Module({
  imports: [EventEmitterModule.forRoot()],
  providers: [RouteLoaderService],
  exports: [RouteLoaderService],
})
export class RouteLoaderModule {} 