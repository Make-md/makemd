// Import visualization types
export type ScaleType = 'linear' | 'ordinal' | 'band' | 'time' | 'log' | 'sqrt' | 'pow';

// Chart types supported
export type ChartType = 'bar' | 'line' | 'scatter' | 'pie' | 'area' | 'heatmap' | 'histogram' | 'box';

// Data encoding channels
export interface Encoding {
  field: string;
  type: 'quantitative' | 'ordinal' | 'nominal' | 'temporal';
  scale?: {
    type: ScaleType;
    domain?: [number, number] | string[];
    range?: [number, number] | string[];
    nice?: boolean;
    clamp?: boolean;
  };
  axis?: {
    title?: string;
    grid?: boolean;
    ticks?: number;
    format?: string;
    orient?: 'bottom' | 'top' | 'left' | 'right';
  };
  legend?: {
    title?: string;
    orient?: 'left' | 'right' | 'top' | 'bottom';
    format?: string;
  };
}

// Mark properties for visual encoding
export interface Mark {
  type: 'rect' | 'line' | 'circle' | 'area' | 'arc' | 'path' | 'text';
  fill?: string | Encoding;
  stroke?: string | Encoding;
  strokeWidth?: number | Encoding;
  opacity?: number | Encoding;
  size?: number | Encoding;
  pointSize?: number | Encoding;
  x?: Encoding;
  y?: Encoding;
  x2?: Encoding;
  y2?: Encoding;
  angle?: Encoding;
  radius?: Encoding;
  text?: Encoding;
  tooltip?: Encoding[];
}

// Interaction configurations
export interface AssetInteraction {
  type: 'brush' | 'zoom' | 'pan' | 'hover' | 'click' | 'select';
  encodings?: string[]; // Which encodings to bind
  on?: string; // Event trigger
  clear?: string; // Clear event
  translate?: [number, number]; // For pan/zoom
  scale?: [number, number]; // For zoom
}

// Layout and styling
export interface Layout {
  width?: number;
  height?: number;
  padding?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
  background?: string;
  title?: {
    text: string;
    fontSize?: number;
    color?: string;
    anchor?: 'start' | 'middle' | 'end';
  };
  subtitle?: {
    text: string;
    fontSize?: number;
    color?: string;
  };
  grid?: {
    x?: boolean;
    y?: boolean;
    color?: string;
    strokeDasharray?: string;
  };
  xAxis?: {
    show: boolean;
    label?: string;
    tickAngle?: number;
    tickColor?: string;
    labelColor?: string;
    labelFontSize?: number;
  };
  yAxis?: {
    show: boolean;
    label?: string;
    tickColor?: string;
    labelColor?: string;
    labelFontSize?: number;
    format?: string;
  };
  legend?: {
    show: boolean;
    position?: 'top' | 'right' | 'bottom' | 'left';
    orient?: 'horizontal' | 'vertical';
    itemColor?: string;
    itemFontSize?: number;
  };
  tooltip?: {
    show: boolean;
    backgroundColor?: string;
    borderColor?: string;
    textColor?: string;
    fontSize?: number;
    format?: string;
  };
  showDataLabels?: boolean; // Show data labels on charts (e.g., pie slice labels)
}

// Data transformation operations
export interface Transform {
  type: 'filter' | 'aggregate' | 'bin' | 'sort' | 'window' | 'pivot';
  field?: string;
  op?: 'count' | 'sum' | 'mean' | 'median' | 'min' | 'max' | 'stdev' | 'variance';
  as?: string;
  groupby?: string[];
  filter?: string; // Expression string
  bins?: number | { step: number };
  sort?: { field: string; order: 'asc' | 'desc' }[];
}

// Main visualization configuration
export interface VisualizationConfig {
  id: string;
  name: string;
  description?: string;
  chartType: ChartType;

  // Data specification
  data: {
    listId: string; // Reference to the list/table to visualize
    transforms?: Transform[];
  };

  // Visual encoding
  mark: Mark;
  encoding: {
    x?: Encoding | Encoding[]; // Support multiple fields for x-axis
    y?: Encoding | Encoding[]; // Support multiple fields for y-axis
    color?: Encoding;
    size?: Encoding;
    opacity?: Encoding;
    shape?: Encoding;
    facet?: Encoding; // For small multiples
    row?: Encoding;
    column?: Encoding;
  };

  // Layout and styling
  layout: Layout;
  
  // Stacking configuration
  stacked?: boolean; // Enable stacked mode for bar and area charts

  // Interactions
  interactions?: AssetInteraction[];

  // Animation settings
  animation?: {
    duration?: number;
    delay?: number;
    ease?: string;
  };

  // Responsive settings
  responsive?: {
    breakpoints?: Record<string, Partial<VisualizationConfig>>;
    autoResize?: boolean;
  };

  // Custom D3 code for advanced customization
  customCode?: {
    preProcess?: string; // JavaScript code to run before rendering
    postProcess?: string; // JavaScript code to run after rendering
    customMarks?: string; // Custom D3 mark generation
  };
}

// Visualization asset extending BaseAsset
export interface VisualizationAsset extends BaseAsset {
  type: 'visualization';
  config: VisualizationConfig;
  preview?: string; // Base64 encoded preview image
  tags?: string[];
}

// Preset visualization templates
export interface VisualizationTemplate {
  id: string;
  name: string;
  description: string;
  chartType: ChartType;
  config: Partial<VisualizationConfig>;
  requiredFields: {
    field: string;
    type: 'quantitative' | 'ordinal' | 'nominal' | 'temporal';
    description: string;
  }[];
  previewImage?: string;
}


// Base asset interface
export interface BaseAsset {
  id: string;
  name: string;
  path: string;
  type: AssetType;
  size?: number;
  created?: number;
  modified?: number;
  metadata?: Record<string, unknown>;
}

// Asset types supported by the system
export type AssetType = 'icon' | 'iconset' | 'image' | 'audio' | 'texture' | 'model' | 'visualization' | 'colorpalette';

// Specific asset interfaces extending BaseAsset

export interface IconAsset extends BaseAsset {
  type: 'icon';
  format: 'svg' | 'png' | 'jpg' | 'gif' | 'emoji';
  svg?: string; // Cached SVG content for svg icons
  emoji?: string; // Emoji character(s) for emoji icons
  iconsetId?: string; // Reference to parent iconset if part of a set
}

export interface IconsetAsset extends BaseAsset {
  type: 'iconset';
  icons: IconMetadata[];
  theme?: 'light' | 'dark' | 'auto';
  description?: string;
  tags?: string[];
  format?: 'mixed' | 'svg' | 'png' | 'emoji'; // Type of icons in the set
}

export interface IconMetadata {
  id: string;
  name: string;
  path?: string; // Optional for emoji icons
  emoji?: string; // For emoji icons (deprecated)
  unicode?: string; // Unicode code for emoji icons
  category?: string;
  keywords?: string[];
  size?: { width: number; height: number };
}


export interface ImageAsset extends BaseAsset {
  type: 'image';
  format: 'png' | 'jpg' | 'gif' | 'webp' | 'bmp';
  width?: number;
  height?: number;
  cached?: boolean; // Whether the image is cached in memory
}

export interface TextureAsset extends BaseAsset {
  type: 'texture';
  format: 'png' | 'jpg' | 'gif' | 'webp';
  width?: number;
  height?: number;
  frameWidth?: number;
  frameHeight?: number;
  frameCount?: number;
  isAnimated?: boolean;
}

export interface AudioAsset extends BaseAsset {
  type: 'audio';
  format: 'mp3' | 'wav' | 'ogg' | 'aac';
  duration?: number;
  sampleRate?: number;
}


export interface ModelAsset extends BaseAsset {
  type: 'model';
  format: 'gltf' | 'glb' | 'obj' | 'fbx';
  vertices?: number;
  faces?: number;
  animations?: string[];
}

// Color palette interfaces
export interface NamedColor {
  name: string;                    // "Primary Blue", "Accent Orange"
  value: string;                   // hex color value "#3867d6"
  cssVariable?: string;            // mapped design token "mk-color-blue"
  semanticTokens?: string[];       // semantic usages ["mk-ui-active", "mk-ui-text-accent"]
  description?: string;
  aliases?: string[];
  category: 'brand' | 'base' | 'ui' | 'custom';
}

export interface NamedGradient {
  name: string;                    // "Sunset Glow", "Ocean Depth"
  description?: string;
  type: 'linear' | 'radial';
  stops: Array<{
    color: string;
    position: number;              // 0-1
  }>;
  direction?: number;              // degrees for linear gradients
  center?: { x: number; y: number }; // center point for radial gradients
  radius?: number;                 // radius for radial gradients
}

export interface ColorPaletteAsset extends BaseAsset {
  type: 'colorpalette';
  colors: NamedColor[];
  gradients?: NamedGradient[];
  designSystemMapping: {
    baseTokens: Record<string, string>;      // "mk-color-blue" -> "#3867d6"
    semanticTokens: Record<string, string>;  // "mk-ui-active" -> "mk-color-blue"
  };
  tags: string[];
  category: 'theme' | 'brand' | 'material' | 'custom';
  description?: string;
}

// Union type for all asset types
export type Asset = IconAsset | IconsetAsset | ImageAsset | TextureAsset | AudioAsset | ModelAsset | VisualizationAsset | ColorPaletteAsset;


// Asset loading and caching options
export interface AssetLoadOptions {
  cache?: boolean;
  priority?: 'low' | 'normal' | 'high';
  timeout?: number;
  retries?: number;
}

// Asset manager events
export interface AssetManagerEvents {
  assetLoaded: (asset: Asset) => void;
  assetLoadError: (path: string, error: Error) => void;
  assetCached: (asset: Asset) => void;
  assetUpdated: (asset: Asset) => void;
  assetDeleted: (assetId: string) => void;
  cacheCleared: () => void;
}

// Cover image interface
export interface CoverImage {
  url: string;
  name: string;
  tags: string[];
  created: number;
  modified: number;
}

// Asset manager interface
export interface IAssetManager {
  // Icon caches and mappings
  iconsCache: Map<string, string>;
  iconsetCaches: Map<string, Map<string, string>>;
  iconPathMapping: Map<string, string>;
  
  // Cover images mapping
  coverImages: Map<string, CoverImage>;
  
  // Initialization
  initialize(): Promise<void>;
  
  // Core asset operations
  loadAsset(path: string, options?: AssetLoadOptions): Promise<Asset | null>;
  getAsset(id: string): Asset | null;
  getCachedAsset(id: string): Asset | null;
  updateAsset(asset: Asset): Promise<boolean>;
  deleteAsset(id: string): Promise<boolean>;

  // Type-specific getters
  getIcons(): IconAsset[];
  getIconsets(): IconsetAsset[];
  getImages(): ImageAsset[];
  getTextures(): TextureAsset[];
  getAudios(): AudioAsset[];
  getModels(): ModelAsset[];
  getVisualizations(): VisualizationAsset[];
  getColorPalettes(): ColorPaletteAsset[];

  // Asset discovery and indexing
  discoverAssets(basePath?: string): Promise<Asset[]>;
  reindexAssets(): Promise<void>;
  refreshAsset(id: string): Promise<Asset | null>;

  // Cache management
  preloadAssets(assetIds: string[]): Promise<Asset[]>;
  clearCache(type?: AssetType): void;
  getCacheStats(): AssetCacheStats;

  // Utility methods
  getAssetPath(id: string): string | null;
  isAssetCached(id: string): boolean;
  getAssetsByType(type: AssetType): Asset[];
  searchAssets(query: string, type?: AssetType): Asset[];

  // Events
  on<K extends keyof AssetManagerEvents>(event: K, handler: AssetManagerEvents[K]): void;
  off<K extends keyof AssetManagerEvents>(event: K, handler: AssetManagerEvents[K]): void;
  // Configuration management
  saveVisualizationConfig(config: VisualizationConfig): Promise<boolean>;
  deleteVisualizationConfig(id: string): Promise<boolean>;
  saveColorPalette(palette: ColorPaletteAsset): Promise<boolean>;
  deleteColorPalette(id: string): Promise<boolean>;
  loadColorPalette(path: string): Promise<ColorPaletteAsset | null>;
  reloadColorPalette(id: string): Promise<ColorPaletteAsset | null>;

  // Iconset management
  loadIconset(path: string): Promise<IconsetAsset | null>;
  saveIconset(iconset: IconsetAsset): Promise<boolean>;
  deleteIconset(id: string): Promise<boolean>;
  getIconFromSet(iconsetId: string, iconId: string): IconMetadata | null;
  
  // Icon caching methods
  getCachedIcon(iconId: string, iconsetId?: string): string | null;
  cacheIconFromPath(path: string, content: string): void;
  hasIcon(iconName: string): boolean;
  getIcon(key: string): Promise<string | undefined>;
  getIconSync(key: string): string | undefined;

  // Cover image management
  addCoverImage(url: string, name: string, tags?: string[]): Promise<boolean>;
  removeCoverImage(url: string): Promise<boolean>;
  getCoverImage(url: string): CoverImage | null;
  getCoverImagesByTag(tag: string): CoverImage[];
  getCoverImagesByName(name: string): CoverImage[];
  getAllCoverImages(): CoverImage[];
  saveCoverImages(): Promise<void>;
  loadCoverImages(): Promise<void>;

  // Aliases
  deleteVisualization(id: string): Promise<boolean>;
  deleteImage(id: string): Promise<boolean>;
}

// Cache statistics
export interface AssetCacheStats {
  totalAssets: number;
  cachedAssets: number;
  cacheSize: number; // in bytes
  hitRate: number; // percentage
  byType: Record<AssetType, {
    total: number;
    cached: number;
    size: number;
  }>;
}

// Asset metadata for storage in $assets space
export interface AssetMetadata {
  id: string;
  name: string;
  type: AssetType;
  path: string;
  size: number;
  checksum?: string;
  created: number;
  modified: number;
  tags?: string[];
  description?: string;
  metadata: Record<string, unknown>;
}