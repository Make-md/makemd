import { 
  defaultPredicateFnForType,
  allPredicateFns,
  predicateFnsForType,
  cleanPredicateType,
  validatePredicate,
  defaultPredicateForSchema
} from '../predicate';
import { filterFnTypes } from '../filterFns/filterFnTypes';
import { sortFnTypes } from '../sort';
import { defaultPredicate } from '../../../../../shared/schemas/predicate';

describe('Predicate Utility Functions', () => {
  describe('defaultPredicateFnForType', () => {
    it('should return default filter function for string type', () => {
      const result = defaultPredicateFnForType('text', filterFnTypes);
      expect(result).toBeDefined();
    });

    it('should return default filter function for number type', () => {
      const result = defaultPredicateFnForType('number', filterFnTypes);
      expect(result).toBeDefined();
    });

    it('should return undefined for unsupported type', () => {
      const result = defaultPredicateFnForType('unsupported', filterFnTypes);
      expect(result).toBeUndefined();
    });

    it('should work with sort functions', () => {
      const result = defaultPredicateFnForType('text', sortFnTypes);
      expect(result).toBeDefined();
    });
  });

  describe('allPredicateFns', () => {
    it('should return all filter function names', () => {
      const result = allPredicateFns(filterFnTypes);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should return all sort function names', () => {
      const result = allPredicateFns(sortFnTypes);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should include expected filter functions', () => {
      const result = allPredicateFns(filterFnTypes);
      expect(result).toContain('is');
      expect(result).toContain('include');
    });
  });

  describe('predicateFnsForType', () => {
    it('should return filter functions for text type', () => {
      const result = predicateFnsForType('text', filterFnTypes);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should return filter functions for number type', () => {
      const result = predicateFnsForType('number', filterFnTypes);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should return empty array for unsupported type', () => {
      const result = predicateFnsForType('unsupported', filterFnTypes);
      expect(result).toEqual([]);
    });

    it('should work with sort functions', () => {
      const result = predicateFnsForType('text', sortFnTypes);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('cleanPredicateType', () => {
    it('should filter out invalid filter functions', () => {
      const filters = [
        { field: 'name', fn: 'is', value: 'test' },
        { field: 'age', fn: 'invalid_function', value: '25' },
        { field: 'email', fn: 'include', value: '@' }
      ];
      const result = cleanPredicateType(filters, filterFnTypes);
      expect(result).toHaveLength(2);
      expect(result[0].fn).toBe('is');
      expect(result[1].fn).toBe('include');
    });

    it('should return empty array when all functions are invalid', () => {
      const filters = [
        { field: 'name', fn: 'invalid1', value: 'test' },
        { field: 'age', fn: 'invalid2', value: '25' }
      ];
      const result = cleanPredicateType(filters, filterFnTypes);
      expect(result).toEqual([]);
    });

    it('should return same array when all functions are valid', () => {
      const filters = [
        { field: 'name', fn: 'is', value: 'test' },
        { field: 'email', fn: 'include', value: '@' }
      ];
      const result = cleanPredicateType(filters, filterFnTypes);
      expect(result).toHaveLength(2);
      expect(result).toEqual(filters);
    });

    it('should work with sort functions', () => {
      const sorts = [
        { field: 'name', fn: 'alphabetical' },
        { field: 'age', fn: 'invalid_sort' },
        { field: 'date', fn: 'latest' }
      ];
      const result = cleanPredicateType(sorts, sortFnTypes);
      expect(result.length).toBeLessThanOrEqual(2);
    });
  });

  describe('validatePredicate', () => {
    const mockDefaultPredicate = {
      view: 'list',
      listView: 'default',
      listItem: 'default',
      listGroup: 'default',
      listViewProps: {},
      listItemProps: {},
      listGroupProps: {},
      filters: [] as any[],
      sort: [] as any[],
      groupBy: [] as any[],
      colsOrder: [] as any[],
      colsHidden: [] as any[],
      colsSize: {},
      colsCalc: {}
    };

    it('should return default predicate when input is null', () => {
      const result = validatePredicate(null, mockDefaultPredicate);
      expect(result).toEqual(mockDefaultPredicate);
    });

    it('should return default predicate when input is undefined', () => {
      const result = validatePredicate(undefined, mockDefaultPredicate);
      expect(result).toEqual(mockDefaultPredicate);
    });

    it('should merge valid predicate with defaults', () => {
      const inputPredicate = {
        view: 'table',
        listView: 'custom',
        listItem: 'custom',
        listGroup: 'custom',
        listViewProps: { prop1: 'value1' },
        listItemProps: { prop2: 'value2' },
        listGroupProps: { prop3: 'value3' },
        filters: [{ field: 'name', fn: 'is', value: 'test', fType: 'text' }],
        sort: [{ field: 'date', fn: 'latest' }],
        groupBy: ['category'],
        colsOrder: ['name', 'date'],
        colsHidden: ['id'],
        colsSize: { name: 200 },
        colsCalc: { total: 'sum' }
      };

      const result = validatePredicate(inputPredicate, mockDefaultPredicate);
      
      expect(result.view).toBe('table');
      expect(result.listView).toBe('custom');
      expect(result.filters).toHaveLength(1);
      expect(result.sort).toHaveLength(1);
      expect(result.groupBy).toEqual(['category']);
      expect(result.colsOrder).toEqual(['name', 'date']);
      expect(result.colsHidden).toEqual(['id']);
      expect(result.colsSize).toEqual({ name: 200 });
      expect(result.colsCalc).toEqual({ total: 'sum' });
    });

    it('should filter out invalid filter functions', () => {
      const inputPredicate = {
        ...mockDefaultPredicate,
        filters: [
          { field: 'name', fn: 'is', value: 'test', fType: 'text' },
          { field: 'age', fn: 'invalid_fn', value: '25', fType: 'number' }
        ]
      };

      const result = validatePredicate(inputPredicate, mockDefaultPredicate);
      expect(result.filters.length).toBeLessThanOrEqual(1);
    });

    it('should handle non-array filters and sort', () => {
      const inputPredicate = {
        ...mockDefaultPredicate,
        filters: 'not an array',
        sort: 'not an array',
        groupBy: 'not an array',
        colsOrder: 'not an array',
        colsHidden: 'not an array'
      };

      const result = validatePredicate(inputPredicate as any, mockDefaultPredicate);
      expect(result.filters).toEqual([]);
      expect(result.sort).toEqual([]);
      expect(result.groupBy).toEqual([]);
      expect(result.colsOrder).toEqual([]);
      expect(result.colsHidden).toEqual([]);
    });

    it('should handle missing colsSize and colsCalc', () => {
      const inputPredicate = {
        ...mockDefaultPredicate,
        colsSize: null as any,
        colsCalc: undefined as any
      };

      const result = validatePredicate(inputPredicate, mockDefaultPredicate);
      expect(result.colsSize).toEqual({});
      expect(result.colsCalc).toEqual({});
    });
  });

  describe('defaultPredicateForSchema', () => {
    it('should return default predicate for primary schema', () => {
      const schema = { id: 'test', name: 'Test', type: 'db', primary: 'true' };
      const result = defaultPredicateForSchema(schema);
      expect(result).toEqual(defaultPredicate);
    });

    it('should return table view predicate for non-primary schema', () => {
      const schema = { id: 'test', name: 'Test', type: 'db', primary: 'false' };
      const result = defaultPredicateForSchema(schema);
      expect(result.view).toBe('table');
    });

    it('should return table view predicate when primary is undefined', () => {
      const schema = { id: 'test', name: 'Test', type: 'db' };
      const result = defaultPredicateForSchema(schema);
      expect(result.view).toBe('table');
    });

    it('should return table view predicate when schema is null', () => {
      const result = defaultPredicateForSchema(null);
      expect(result.view).toBe('table');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty function type objects', () => {
      const emptyFnTypes = {};
      expect(allPredicateFns(emptyFnTypes)).toEqual([]);
      expect(predicateFnsForType('text', emptyFnTypes)).toEqual([]);
      expect(defaultPredicateFnForType('text', emptyFnTypes)).toBeUndefined();
    });

    it('should handle null/undefined function type objects', () => {
      expect(() => allPredicateFns(null)).toThrow();
      expect(() => predicateFnsForType('text', null)).toThrow();
      expect(() => defaultPredicateFnForType('text', null)).toThrow();
    });

    it('should handle malformed function type objects', () => {
      const malformedFnTypes = {
        validFn: { type: ['text'], fn: () => true },
        invalidFn: null as any,
        anotherInvalidFn: { type: null as any }
      };

      expect(() => allPredicateFns(malformedFnTypes as any)).not.toThrow();
      expect(() => predicateFnsForType('text', malformedFnTypes as any)).toThrow();
    });

    it('should handle empty filter/sort arrays in cleanPredicateType', () => {
      expect(cleanPredicateType([], filterFnTypes)).toEqual([]);
      expect(cleanPredicateType([], sortFnTypes)).toEqual([]);
    });

    it('should handle null/undefined filter/sort arrays in cleanPredicateType', () => {
      expect(() => cleanPredicateType(null, filterFnTypes)).toThrow();
      expect(() => cleanPredicateType(undefined, filterFnTypes)).toThrow();
    });
  });
});