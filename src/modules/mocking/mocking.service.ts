import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class MockingService {
  constructor() {}

  async getMockResponse(route: any): Promise<any | undefined> {
    if (!route.mock) return undefined;
    const mockResponse = route.mock_response;
    if (!mockResponse) return undefined;

    // Si c'est un objet inline
    if (typeof mockResponse === 'object') {
      return mockResponse;
    }

    // Si c'est un chemin de fichier
    if (typeof mockResponse === 'string') {
      const filePath = path.isAbsolute(mockResponse)
        ? mockResponse
        : path.join(process.cwd(), mockResponse);
      if (!fs.existsSync(filePath)) {
        throw new Error(`Mock file not found: ${filePath}`);
      }
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content);
    }
    return undefined;
  }
} 