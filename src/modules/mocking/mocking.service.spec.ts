import { MockingService } from './mocking.service';
import * as fs from 'fs';
import * as path from 'path';

describe('MockingService', () => {
  let service: MockingService;

  beforeEach(() => {
    service = new MockingService();
  });

  it('should return inline mock response', async () => {
    const route = {
      mock: true,
      mock_response: { foo: 'bar', value: 42 }
    };
    const result = await service.getMockResponse(route);
    expect(result).toEqual({ foo: 'bar', value: 42 });
  });

  it('should return mock response from file', async () => {
    const mockObj = { hello: 'world', arr: [1,2,3] };
    const filePath = path.join(process.cwd(), 'mock-test.json');
    fs.writeFileSync(filePath, JSON.stringify(mockObj), 'utf-8');
    const route = {
      mock: true,
      mock_response: 'mock-test.json'
    };
    const result = await service.getMockResponse(route);
    expect(result).toEqual(mockObj);
    fs.unlinkSync(filePath);
  });

  it('should return undefined if mock is false', async () => {
    const route = {
      mock: false,
      mock_response: { foo: 'bar' }
    };
    const result = await service.getMockResponse(route);
    expect(result).toBeUndefined();
  });

  it('should return undefined if no mock_response', async () => {
    const route = {
      mock: true
    };
    const result = await service.getMockResponse(route);
    expect(result).toBeUndefined();
  });

  it('should throw if file does not exist', async () => {
    const route = {
      mock: true,
      mock_response: 'not-exist.json'
    };
    await expect(service.getMockResponse(route)).rejects.toThrow('Mock file not found');
  });
}); 