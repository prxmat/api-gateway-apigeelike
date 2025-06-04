import { Injectable } from '@nestjs/common';
import * as jsonata from 'jsonata';

@Injectable()
export class TransformationService {
  constructor() {}

  async transform(data: any, expression: string): Promise<any> {
    if (!expression) {
      return data;
    }

    try {
      const transform = jsonata(expression);
      return await transform.evaluate(data);
    } catch (error) {
      throw new Error(`Transformation error: ${error.message}`);
    }
  }
} 