/**
 * Asset Manager Schemas and Table Definitions
 * Defines the database schemas and table structures for various asset types
 */

export interface TableSchema {
  id: string;
  name: string;
  type: 'db';
  primary: string;
}

export interface TableProperty {
  name: string;
  type: 'text' | 'number' | 'date' | 'object' | 'boolean';
  unique?: string;
  primary?: string;
}



// Icon Sets Schema
export const ICONSETS_TABLE_SCHEMA: TableSchema = {
  id: 'iconsets',
  name: 'Icon Sets',
  type: 'db',
  primary: 'id',
};

export const ICONSETS_TABLE_PROPERTIES: TableProperty[] = [
  { name: 'id', type: 'text', unique: 'true', primary: 'true' },
  { name: 'name', type: 'text' },
  { name: 'icons', type: 'object' },
  { name: 'theme', type: 'text' },
  { name: 'description', type: 'text' },
  { name: 'tags', type: 'object' },
  { name: 'format', type: 'text' },
  { name: 'created', type: 'date' },
  { name: 'modified', type: 'date' },
];

// Color Palettes Schema
export const COLOR_PALETTES_TABLE_SCHEMA: TableSchema = {
  id: 'color-palettes',
  name: 'Color Palettes',
  type: 'db',
  primary: 'id',
};

export const COLOR_PALETTES_TABLE_PROPERTIES: TableProperty[] = [
  { name: 'id', type: 'text', unique: 'true', primary: 'true' },
  { name: 'name', type: 'text' },
  { name: 'colors', type: 'object' },
  { name: 'gradients', type: 'object' },
  { name: 'designSystemMapping', type: 'object' },
  { name: 'tags', type: 'object' },
  { name: 'category', type: 'text' },
  { name: 'description', type: 'text' },
  { name: 'created', type: 'date' },
  { name: 'modified', type: 'date' },
];

// Asset Space Configuration
export const ASSETS_SPACE_CONFIG = {
  ASSETS_SPACE_PATH: '$assets',
  ASSETS_TABLE: 'assets',
  ICONSETS_FOLDER: 'iconsets',
  TEXTURES_FOLDER: 'textures',
  AUDIO_FOLDER: 'audio',
  MODELS_FOLDER: 'models',
  IMAGES_FOLDER: 'images',
};