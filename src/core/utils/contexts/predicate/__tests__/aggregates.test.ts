import { aggregateFnTypes } from '../aggregates';

describe('Aggregate Functions', () => {
  describe('sum', () => {
    it('should sum numeric values correctly', () => {
      expect(aggregateFnTypes.sum.fn([1, 2, 3, 4, 5], 'number')).toBe(15);
      expect(aggregateFnTypes.sum.fn([10, 20, 30], 'number')).toBe(60);
      expect(aggregateFnTypes.sum.fn([-1, -2, -3], 'number')).toBe(-6);
    });

    it('should handle empty array', () => {
      expect(aggregateFnTypes.sum.fn([], 'number')).toBe(0);
    });

    it('should filter out non-numeric values', () => {
      expect(aggregateFnTypes.sum.fn([1, 'abc', 2, null, 3, undefined], 'number')).toBe(6);
    });
  });

  describe('avg', () => {
    it('should calculate average correctly', () => {
      expect(aggregateFnTypes.avg.fn([1, 2, 3, 4, 5], 'number')).toBe(3);
      expect(aggregateFnTypes.avg.fn([10, 20, 30], 'number')).toBe(20);
    });

    it('should filter out non-numeric values', () => {
      expect(aggregateFnTypes.avg.fn([2, 'abc', 4, null, 6], 'number')).toBe(4);
    });
  });

  describe('min', () => {
    it('should find minimum value', () => {
      expect(aggregateFnTypes.min.fn([5, 2, 8, 1, 9], 'number')).toBe(1);
      expect(aggregateFnTypes.min.fn([10, 20, 5, 30], 'number')).toBe(5);
    });

    it('should handle negative numbers', () => {
      expect(aggregateFnTypes.min.fn([1, -5, 3, -2], 'number')).toBe(-5);
    });
  });

  describe('max', () => {
    it('should find maximum value', () => {
      expect(aggregateFnTypes.max.fn([5, 2, 8, 1, 9], 'number')).toBe(9);
      expect(aggregateFnTypes.max.fn([10, 20, 5, 30], 'number')).toBe(30);
    });

    it('should handle negative numbers', () => {
      expect(aggregateFnTypes.max.fn([-1, -5, -3, -2], 'number')).toBe(-1);
    });
  });

  describe('count', () => {
    it('should count all values', () => {
      expect(aggregateFnTypes.count.fn(['a', 'b', 'c'], 'text')).toBe(3);
      expect(aggregateFnTypes.count.fn([1, 2, 3, 4], 'number')).toBe(4);
    });

    it('should return 0 for empty array', () => {
      expect(aggregateFnTypes.count.fn([], 'text')).toBe(0);
    });
  });

  describe('empty', () => {
    it('should count empty values', () => {
      expect(aggregateFnTypes.empty.fn(['a', '', 'b', null, 'c', undefined], 'text')).toBe(3);
      expect(aggregateFnTypes.empty.fn(['', null, undefined], 'text')).toBe(3);
    });

    it('should return 0 when no empty values', () => {
      expect(aggregateFnTypes.empty.fn(['a', 'b', 'c'], 'text')).toBe(0);
    });
  });

  describe('notEmpty', () => {
    it('should count non-empty values', () => {
      expect(aggregateFnTypes.notEmpty.fn(['a', '', 'b', null, 'c', undefined], 'text')).toBe(3);
      expect(aggregateFnTypes.notEmpty.fn(['a', 'b', 'c'], 'text')).toBe(3);
    });

    it('should return 0 for all empty values', () => {
      expect(aggregateFnTypes.notEmpty.fn(['', null, undefined], 'text')).toBe(0);
    });
  });

  describe('percentageEmpty', () => {
    it('should calculate percentage of empty values', () => {
      expect(aggregateFnTypes.percentageEmpty.fn(['a', '', 'b', null], 'text')).toBe('50%');
      expect(aggregateFnTypes.percentageEmpty.fn(['', null, undefined], 'text')).toBe('100%');
    });

    it('should return 0% when no empty values', () => {
      expect(aggregateFnTypes.percentageEmpty.fn(['a', 'b', 'c'], 'text')).toBe('0%');
    });
  });

  describe('percentageNotEmpty', () => {
    it('should calculate percentage of non-empty values', () => {
      expect(aggregateFnTypes.percentageNotEmpty.fn(['a', '', 'b', null], 'text')).toBe('50%');
      expect(aggregateFnTypes.percentageNotEmpty.fn(['a', 'b', 'c'], 'text')).toBe('100%');
    });

    it('should return 0% when all values are empty', () => {
      expect(aggregateFnTypes.percentageNotEmpty.fn(['', null, undefined], 'text')).toBe('0%');
    });
  });

  describe('complete', () => {
    it('should count true values', () => {
      expect(aggregateFnTypes.complete.fn(['true', 'false', 'true', 'true'], 'boolean')).toBe(3);
      expect(aggregateFnTypes.complete.fn(['true', 'true'], 'boolean')).toBe(2);
    });

    it('should return 0 when no true values', () => {
      expect(aggregateFnTypes.complete.fn(['false', 'false', 'false'], 'boolean')).toBe(0);
    });
  });

  describe('incomplete', () => {
    it('should count non-true values', () => {
      expect(aggregateFnTypes.incomplete.fn(['true', 'false', 'true', 'false'], 'boolean')).toBe(2);
      expect(aggregateFnTypes.incomplete.fn(['false', 'false'], 'boolean')).toBe(2);
    });

    it('should return 0 when all values are true', () => {
      expect(aggregateFnTypes.incomplete.fn(['true', 'true', 'true'], 'boolean')).toBe(0);
    });
  });

  describe('percentageComplete', () => {
    it('should calculate percentage of true values', () => {
      expect(aggregateFnTypes.percentageComplete.fn(['true', 'false', 'true', 'false'], 'boolean')).toBe('50%');
      expect(aggregateFnTypes.percentageComplete.fn(['true', 'true', 'true'], 'boolean')).toBe('100%');
    });

    it('should return 0% when no true values', () => {
      expect(aggregateFnTypes.percentageComplete.fn(['false', 'false', 'false'], 'boolean')).toBe('0%');
    });
  });

  describe('values', () => {
    it('should return unique values as comma-separated string', () => {
      const result = aggregateFnTypes.values.fn(['a', 'b', 'a', 'c'], 'text');
      expect(result).toContain('a');
      expect(result).toContain('b');
      expect(result).toContain('c');
    });

    it('should handle single value', () => {
      expect(aggregateFnTypes.values.fn(['hello'], 'text')).toBe('hello');
    });
  });

  describe('Function Types and Properties', () => {
    it('should have correct type definitions', () => {
      expect(aggregateFnTypes.sum.type).toBe('number');
      expect(aggregateFnTypes.sum.valueType).toBe('number');
      expect(aggregateFnTypes.avg.type).toBe('number');
      expect(aggregateFnTypes.count.type).toBe('any');
      expect(aggregateFnTypes.complete.type).toBe('boolean');
    });

    it('should have all required properties for each function', () => {
      Object.keys(aggregateFnTypes).forEach(key => {
        const fn = aggregateFnTypes[key];
        expect(fn).toHaveProperty('label');
        expect(fn).toHaveProperty('type');
        expect(fn).toHaveProperty('fn');
        expect(fn).toHaveProperty('valueType');
        expect(typeof fn.fn).toBe('function');
      });
    });

    it('should include all expected aggregate functions', () => {
      const expectedFunctions = [
        'values', 'sum', 'avg', 'median', 'count', 'countValues', 'countUniques',
        'percentageEmpty', 'percentageNotEmpty', 'min', 'max', 'range', 'empty',
        'notEmpty', 'earliest', 'latest', 'complete', 'incomplete', 'percentageComplete', 'dateRange'
      ];
      
      expectedFunctions.forEach(fnName => {
        expect(aggregateFnTypes).toHaveProperty(fnName);
      });
    });
  });
});