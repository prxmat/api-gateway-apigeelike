import { Test, TestingModule } from '@nestjs/testing';
import { TransformationService } from './transformation.service';

describe('TransformationService', () => {
  let service: TransformationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TransformationService],
    }).compile();

    service = module.get<TransformationService>(TransformationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('transform', () => {
    it('should return original data if no expression provided', async () => {
      const data = { name: 'John', age: 30 };
      const result = await service.transform(data, '');
      expect(result).toEqual(data);
    });

    it('should perform simple mapping', async () => {
      const data = { name: 'John', age: 30 };
      const expression = '{ "fullName": name, "years": age }';
      const result = await service.transform(data, expression);
      expect(result).toEqual({ fullName: 'John', years: 30 });
    });

    it('should handle string concatenation', async () => {
      const data = { firstName: 'John', lastName: 'Doe' };
      const expression = '{ "fullName": firstName & " " & lastName }';
      const result = await service.transform(data, expression);
      expect(result).toEqual({ fullName: 'John Doe' });
    });

    it('should handle nested structures', async () => {
      const data = {
        user: {
          profile: {
            name: 'John',
            address: {
              city: 'Paris',
              country: 'France'
            }
          }
        }
      };
      const expression = '{ "userInfo": { "name": user.profile.name, "location": user.profile.address.city & ", " & user.profile.address.country } }';
      const result = await service.transform(data, expression);
      expect(result).toEqual({
        userInfo: {
          name: 'John',
          location: 'Paris, France'
        }
      });
    });

    it('should handle arrays', async () => {
      const data = {
        items: [
          { id: 1, name: 'Item 1' },
          { id: 2, name: 'Item 2' }
        ]
      };
      const expression = '{ "itemsList": items[*].{ "itemId": id, "itemName": name } }';
      const result = await service.transform(data, expression);
      expect(JSON.parse(JSON.stringify(result))).toEqual({
        itemsList: [
          { itemId: 1, itemName: 'Item 1' },
          { itemId: 2, itemName: 'Item 2' }
        ]
      });
    });

    it('should throw error for invalid expression', async () => {
      const data = { name: 'John' };
      const expression = '{ invalid expression }';
      await expect(service.transform(data, expression)).rejects.toThrow('Transformation error');
    });
  });
}); 