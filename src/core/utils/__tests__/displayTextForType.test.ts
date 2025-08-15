import { Superstate } from 'makemd-core';
import { SpaceProperty } from 'shared/types/mdb';
import { displayTextForType } from '../displayTextForType';

describe('displayTextForType', () => {
  describe('date fields', () => {
    it('should format date with custom format', () => {
      const property: SpaceProperty = {
        name: 'Created',
        type: 'date',
        value: JSON.stringify({ format: 'yyyy-MM-dd' })
      };
      
      const result = displayTextForType(property, '2024-01-15T10:30:00');
      expect(result).toMatch(/2024-01-15/);
    });
    
    it('should handle invalid dates', () => {
      const property: SpaceProperty = {
        name: 'Created',
        type: 'date',
        value: ''
      };
      
      const result = displayTextForType(property, 'invalid-date');
      expect(result).toBe('invalid-date');
    });
  });
  
  describe('link fields', () => {
    it('should use proper name from superstate when available', () => {
      const property: SpaceProperty = {
        name: 'Related',
        type: 'link',
        value: ''
      };
      
      const mockSuperstate = {
        pathsIndex: new Map([
          ['/path/to/document.md', { label: { name: 'My Document' } }]
        ])
      } as unknown as Superstate;
      
      const result = displayTextForType(property, '/path/to/document.md', mockSuperstate);
      expect(result).toBe('My Document');
    });
    
    it('should fallback to filename when superstate not available', () => {
      const property: SpaceProperty = {
        name: 'Related',
        type: 'link',
        value: ''
      };
      
      const result = displayTextForType(property, '/path/to/document.md');
      expect(result).toBe('document');
    });
    
    it('should display multiple proper names for link-multi', () => {
      const property: SpaceProperty = {
        name: 'References',
        type: 'link-multi',
        value: ''
      };
      
      const mockSuperstate = {
        pathsIndex: new Map([
          ['/docs/file1.md', { label: { name: 'First Document' } }],
          ['/docs/file2.md', { label: { name: 'Second Document' } }]
        ])
      } as unknown as Superstate;
      
      const result = displayTextForType(property, '["/docs/file1.md","/docs/file2.md"]', mockSuperstate);
      expect(result).toBe('First Document, Second Document');
    });
    
    it('should handle links without extensions', () => {
      const property: SpaceProperty = {
        name: 'Related',
        type: 'link',
        value: ''
      };
      
      const result = displayTextForType(property, '/path/to/folder');
      expect(result).toBe('folder');
    });
  });
  
  describe('boolean fields', () => {
    it('should display checkmark for true', () => {
      const property: SpaceProperty = {
        name: 'Completed',
        type: 'boolean',
        value: ''
      };
      
      expect(displayTextForType(property, 'true')).toBe('✓');
      expect(displayTextForType(property, true)).toBe('✓');
    });
    
    it('should display empty for false', () => {
      const property: SpaceProperty = {
        name: 'Completed',
        type: 'boolean',
        value: ''
      };
      
      expect(displayTextForType(property, 'false')).toBe('');
      expect(displayTextForType(property, false)).toBe('');
    });
  });
  
  describe('number fields', () => {
    it('should format currency', () => {
      const property: SpaceProperty = {
        name: 'Price',
        type: 'number',
        value: JSON.stringify({ format: 'currency' })
      };
      
      const result = displayTextForType(property, '99.99');
      expect(result).toContain('99.99');
      expect(result).toMatch(/\$|USD/);
    });
    
    it('should format percentage', () => {
      const property: SpaceProperty = {
        name: 'Progress',
        type: 'number',
        value: JSON.stringify({ format: 'percent' })
      };
      
      const result = displayTextForType(property, '0.75');
      expect(result).toBe('75.00%');
    });
  });
  
  describe('tags fields', () => {
    it('should format tags with hashtags', () => {
      const property: SpaceProperty = {
        name: 'Tags',
        type: 'tags-multi',
        value: ''
      };
      
      const result = displayTextForType(property, '["project","urgent","review"]');
      expect(result).toBe('#project #urgent #review');
    });
  });
  
  describe('empty values', () => {
    it('should return empty string for null/undefined/empty values', () => {
      const property: SpaceProperty = {
        name: 'Test',
        type: 'text',
        value: ''
      };
      
      expect(displayTextForType(property, null)).toBe('');
      expect(displayTextForType(property, undefined)).toBe('');
      expect(displayTextForType(property, '')).toBe('');
    });
  });
});