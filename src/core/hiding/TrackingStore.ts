/**
 * TrackingStore
 * 
 * Manages persistent state for space folder hiding.
 * Stores state in .obsidian/plugins/make-md/hiding-state.json
 */

import { DataAdapter } from 'obsidian';
import { safelyParseJSON } from 'shared/utils/json';

export interface HidingState {
  version: string;
  mode: 'dynamic' | 'disabled';
  pattern: string | null;
  applied_at: number | null;
  css_injected: boolean;
}

const DEFAULT_STATE: HidingState = {
  version: '1.0',
  mode: 'disabled',
  pattern: null,
  applied_at: null,
  css_injected: false,
};

export class TrackingStore {
  private state: HidingState;
  private filePath: string;

  constructor(
    private adapter: DataAdapter,
    private configDir: string
  ) {
    this.filePath = `${configDir}/plugins/make-md/hiding-state.json`;
    this.state = { ...DEFAULT_STATE };
  }

  /**
   * Load state from disk
   */
  public async load(): Promise<HidingState> {
    try {
      const content = await this.adapter.read(this.filePath);
      const parsed = safelyParseJSON(content);
      
      if (parsed && typeof parsed === 'object') {
        this.state = { ...DEFAULT_STATE, ...parsed };
      } else {
        this.state = { ...DEFAULT_STATE };
      }
    } catch (error) {
      // File doesn't exist or can't be read - use default state
      this.state = { ...DEFAULT_STATE };
    }

    return this.state;
  }

  /**
   * Save state to disk
   */
  public async save(updates: Partial<HidingState>): Promise<void> {
    this.state = { ...this.state, ...updates };

    try {
      const content = JSON.stringify(this.state, null, 2);
      await this.adapter.write(this.filePath, content);
    } catch (error) {
      console.error('Failed to save hiding state:', error);
      throw error;
    }
  }

  /**
   * Get current state (in-memory)
   */
  public getState(): HidingState {
    return { ...this.state };
  }

  /**
   * Check if hiding is enabled
   */
  public isEnabled(): boolean {
    return this.state.mode === 'dynamic';
  }

  /**
   * Get current pattern
   */
  public getPattern(): string | null {
    return this.state.pattern;
  }

  /**
   * Clear state (reset to default)
   */
  public async clear(): Promise<void> {
    this.state = { ...DEFAULT_STATE };
    
    try {
      await this.adapter.remove(this.filePath);
    } catch (error) {
      // Ignore if file doesn't exist
    }
  }
}
