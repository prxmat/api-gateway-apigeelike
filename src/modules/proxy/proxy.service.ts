import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '../http/http.service';
import { LoadedRoute } from '../route-loader/interfaces/loaded-route.interface';
import { CustomLogger } from '../logger/logger.service';
import type { AxiosRequestConfig } from 'axios/index';

@Injectable()
export class ProxyService {
  constructor(
    private readonly httpService: HttpService,
    private readonly logger: CustomLogger,
  ) {
    this.logger.setContext('ProxyService');
  }

  async forwardRequest(route: LoadedRoute, data: any, headers: any) {
    try {
      const timeoutMs = route.timeout ? 
        (typeof route.timeout === 'string' && route.timeout.endsWith('s') ? 
          parseInt(route.timeout.slice(0, -1)) * 1000 : 
          (typeof route.timeout === 'string' ? parseInt(route.timeout) * 1000 : route.timeout * 1000)) : 
        5000; // Default timeout of 5 seconds

      const cleanHeaders = { ...headers };
      delete cleanHeaders['content-length'];
      delete cleanHeaders['host'];
      delete cleanHeaders['connection'];

      const config: AxiosRequestConfig = {
        method: route.method as any,
        url: route.backend_url,
        headers: cleanHeaders,
        data,
        timeout: timeoutMs,
        validateStatus: () => true,
      };

      const response = await this.httpService.request(route, data);

      if (!response) {
        throw new HttpException(
          'No response from backend',
          HttpStatus.BAD_GATEWAY,
        );
      }

      return response;
    } catch (error) {
      this.logger.error({
        message: 'Error forwarding request to backend',
        error: error.message,
        route_id: route.id,
        backend_url: route.backend_url,
      });

      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        throw new HttpException(
          'Backend service unavailable',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      if (error.code === 'ETIMEDOUT') {
        throw new HttpException(
          'Backend request timeout',
          HttpStatus.GATEWAY_TIMEOUT,
        );
      }

      throw new HttpException(
        'Error forwarding request to backend',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }
} 