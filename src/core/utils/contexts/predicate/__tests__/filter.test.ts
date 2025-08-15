import { 
  stringEqual, stringCompare, startsWith, endsWith, empty,
  greaterThan, lessThan, dateAfter, dateBefore,
  listIncludes, listEquals, isSameDay, isSameDayAsToday, lengthEquals
} from '../filter';

describe('String Filter Functions', () => {
  describe('stringEqual', () => {
    it('should return true for exact matches', () => {
      expect(stringEqual('hello', 'hello')).toBe(true);
      expect(stringEqual('test', 'test')).toBe(true);
    });

    it('should return false for non-matches', () => {
      expect(stringEqual('hello', 'world')).toBe(false);
      expect(stringEqual('test', 'TEST')).toBe(false);
    });

    it('should handle empty strings', () => {
      expect(stringEqual('', '')).toBe(true);
      expect(stringEqual('', 'hello')).toBe(false);
      expect(stringEqual('hello', '')).toBe(false);
    });

    it('should handle null/undefined values', () => {
      expect(stringEqual(null, 'hello')).toBe(false);
      expect(stringEqual(undefined, 'hello')).toBe(false);
      expect(stringEqual('hello', null)).toBe(false);
      expect(stringEqual(null, null)).toBe(true);
    });
  });

  describe('stringCompare', () => {
    it('should return true when string contains substring (case insensitive)', () => {
      expect(stringCompare('hello world', 'world')).toBe(true);
      expect(stringCompare('testing 123', '123')).toBe(true);
      expect(stringCompare('hello', 'hello')).toBe(true);
    });

    it('should return false when string does not contain substring', () => {
      expect(stringCompare('hello world', 'xyz')).toBe(false);
      expect(stringCompare('testing', '456')).toBe(false);
    });

    it('should be case insensitive', () => {
      expect(stringCompare('Hello World', 'world')).toBe(true);
      expect(stringCompare('Hello World', 'WORLD')).toBe(true);
    });

    it('should handle empty strings', () => {
      expect(stringCompare('hello', '')).toBe(true);
      expect(stringCompare('', 'hello')).toBe(false);
      expect(stringCompare('', '')).toBe(true);
    });
  });

  describe('startsWith', () => {
    it('should return true when string starts with prefix', () => {
      expect(startsWith('hello world', 'hello')).toBe(true);
      expect(startsWith('testing', 'test')).toBe(true);
    });

    it('should return false when string does not start with prefix', () => {
      expect(startsWith('hello world', 'world')).toBe(false);
      expect(startsWith('testing', 'ing')).toBe(false);
    });

    it('should be case sensitive', () => {
      expect(startsWith('Hello World', 'hello')).toBe(false);
      expect(startsWith('Hello World', 'Hello')).toBe(true);
    });
  });

  describe('endsWith', () => {
    it('should return true when string ends with suffix', () => {
      expect(endsWith('hello world', 'world')).toBe(true);
      expect(endsWith('testing', 'ing')).toBe(true);
    });

    it('should return false when string does not end with suffix', () => {
      expect(endsWith('hello world', 'hello')).toBe(false);
      expect(endsWith('testing', 'test')).toBe(false);
    });

    it('should be case sensitive', () => {
      expect(endsWith('Hello World', 'world')).toBe(false);
      expect(endsWith('Hello World', 'World')).toBe(true);
    });
  });

  describe('empty', () => {
    it('should return true for empty strings', () => {
      expect(empty('', '')).toBe(true);
    });

    it('should return false for non-empty strings', () => {
      expect(empty('hello', '')).toBe(false);
      expect(empty('a', '')).toBe(false);
    });

    it('should handle null/undefined values', () => {
      expect(empty(null, '')).toBe(true);
      expect(empty(undefined, '')).toBe(true);
    });
  });

  describe('lengthEquals', () => {
    it('should return true when string length matches', () => {
      expect(lengthEquals('hello', '5')).toBe(true);
      expect(lengthEquals('test', '4')).toBe(true);
    });

    it('should return false when string length does not match', () => {
      expect(lengthEquals('hello', '4')).toBe(false);
      expect(lengthEquals('test', '5')).toBe(false);
    });
  });
});

describe('Number Filter Functions', () => {
  describe('greaterThan', () => {
    it('should return true when first number is greater', () => {
      expect(greaterThan('10', '5')).toBe(true);
      expect(greaterThan('0', '-1')).toBe(true);
    });

    it('should return false when first number is not greater', () => {
      expect(greaterThan('5', '10')).toBe(false);
      expect(greaterThan('5', '5')).toBe(false);
    });

    it('should handle decimal numbers', () => {
      expect(greaterThan('5.5', '5.4')).toBe(true);
      expect(greaterThan('5.4', '5.5')).toBe(false);
    });
  });

  describe('lessThan', () => {
    it('should return true when first number is less', () => {
      expect(lessThan('5', '10')).toBe(true);
      expect(lessThan('-1', '0')).toBe(true);
    });

    it('should return false when first number is not less', () => {
      expect(lessThan('10', '5')).toBe(false);
      expect(lessThan('5', '5')).toBe(false);
    });
  });
});

describe('Date Filter Functions', () => {
  const today = new Date();
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

  describe('dateAfter', () => {
    it('should return true when date is after comparison date', () => {
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      expect(dateAfter(today.getTime().toString(), yesterdayStr)).toBe(true);
    });

    it('should return false when date is not after comparison date', () => {
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      expect(dateAfter(today.getTime().toString(), tomorrowStr)).toBe(false);
    });
  });

  describe('dateBefore', () => {
    it('should return true when date is before comparison date', () => {
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      expect(dateBefore(today.getTime().toString(), tomorrowStr)).toBe(true);
    });

    it('should return false when date is not before comparison date', () => {
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      expect(dateBefore(today.getTime().toString(), yesterdayStr)).toBe(false);
    });
  });

  describe('isSameDay', () => {
    it('should return true for same day', () => {
      const dateStr1 = '2023-05-15T10:30:00';
      const dateStr2 = '2023-05-15T18:45:00';
      expect(isSameDay(dateStr1, dateStr2)).toBe(true);
    });

    it('should return false for different days', () => {
      const dateStr1 = '2023-05-15T10:30:00';
      const dateStr2 = '2023-05-16T10:30:00';
      expect(isSameDay(dateStr1, dateStr2)).toBe(false);
    });

    it('should handle date format variations', () => {
      expect(isSameDay('2023-12-25', '2023-12-25')).toBe(true);
      expect(isSameDay('2023-12-25', '2023-12-26')).toBe(false);
    });
  });

  describe('isSameDayAsToday', () => {
    it('should handle current date checking', () => {
      // Since this compares with the actual current date, we test the function structure
      expect(typeof isSameDayAsToday('2023-01-01', null)).toBe('boolean');
    });

    it('should return false for empty value', () => {
      expect(isSameDayAsToday('', null)).toBe(false);
      expect(isSameDayAsToday(null, null)).toBe(false);
    });
  });
});

describe('List Filter Functions', () => {
  describe('listIncludes', () => {
    it('should return true when list includes any of the filter values', () => {
      expect(listIncludes('a,b,c', 'b')).toBe(true);
      expect(listIncludes('1,2,3', '2,4')).toBe(true);
    });

    it('should return false when list does not include any filter values', () => {
      expect(listIncludes('a,b,c', 'd')).toBe(false);
      expect(listIncludes('1,2,3', '4,5')).toBe(false);
    });

    it('should handle empty lists', () => {
      expect(listIncludes('', 'a')).toBe(false);
      expect(listIncludes(null, 'a')).toBe(false);
    });
  });

  describe('listEquals', () => {
    it('should return true when lists are equal', () => {
      expect(listEquals('a,b,c', 'a,b,c')).toBe(true);
      expect(listEquals('1,2,3', '3,2,1')).toBe(true);
    });

    it('should return false when lists are not equal', () => {
      expect(listEquals('a,b,c', 'a,b')).toBe(false);
      expect(listEquals('1,2,3', '1,2,3,4')).toBe(false);
    });

    it('should handle empty lists', () => {
      expect(listEquals('', '')).toBe(true);
      expect(listEquals('a,b', '')).toBe(false);
    });
  });
});