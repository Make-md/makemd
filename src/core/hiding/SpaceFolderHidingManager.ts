/**
 * SpaceFolderHidingManager
 * 
 * Main manager for space folder hiding functionality.
 * Coordinates DynamicCSSManager and TrackingStore.
 */

import { DataAdapter } from 'obsidian';
import { DynamicCSSManager } from './DynamicCSSManager';
import { TrackingStore, HidingState } from './TrackingStore';

export class SpaceFolderHidingManager {
  private cssManager: DynamicCSSManager;
  private tracking: TrackingStore;
  private reindexCallback: () => Promise<void>;

  constructor(
    adapter: DataAdapter,
    configDir: string,
    reindexCallback: () => Promise<void>
  ) {
    this.cssManager = new DynamicCSSManager();
    this.tracking = new TrackingStore(adapter, configDir);
    this.reindexCallback = reindexCallback;
  }

  /**
   * Initialize - load state and restore if needed
   */
  public async initialize(): Promise<void> {
    const state = await this.tracking.load();

    // Restore hiding if it was enabled
    if (state.mode === 'dynamic' && state.pattern) {
      this.cssManager.apply(state.pattern);
    }
  }

  /**
   * Enable hiding for the given pattern
   */
  public async enable(pattern: string): Promise<void> {
    if (!pattern || pattern.trim().length === 0) {
      throw new Error('Pattern cannot be empty');
    }

    const previousPattern = this.tracking.getPattern();
    const needsReindex = previousPattern !== pattern;

    // Apply CSS
    this.cssManager.apply(pattern);

    // Save state
    await this.tracking.save({
      mode: 'dynamic',
      pattern: pattern,
      applied_at: Date.now(),
      css_injected: true,
    });

    // Reindex if pattern changed
    if (needsReindex) {
      await this.reindexCallback();
    }
  }

  /**
   * Disable hiding
   */
  public async disable(): Promise<void> {
    // Remove CSS
    this.cssManager.remove();

    // Save state
    await this.tracking.save({
      mode: 'disabled',
      pattern: null,
      applied_at: null,
      css_injected: false,
    });
  }

  /**
   * Check if hiding is enabled
   */
  public isEnabled(): boolean {
    return this.cssManager.isActive();
  }

  /**
   * Get current pattern
   */
  public getCurrentPattern(): string | null {
    return this.cssManager.getCurrentPattern();
  }

  /**
   * Get current state
   */
  public getState(): HidingState {
    return this.tracking.getState();
  }

  /**
   * Check if reapply is needed (pattern mismatch)
   */
  public needsReapply(currentPattern: string): boolean {
    const activePattern = this.getCurrentPattern();
    return this.isEnabled() && activePattern !== currentPattern;
  }

  /**
   * Cleanup - called on plugin unload
   */
  public cleanup(): void {
    this.cssManager.remove();
  }
}
