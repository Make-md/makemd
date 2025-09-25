import { getAbstractFileAtPath } from "adapters/obsidian/utils/file";
import { installSpaceKit } from "adapters/obsidian/ui/kit/kits";
import MakeMDPlugin from "main";
import { FileView, Notice, TFile, ViewStateResult, WorkspaceLeaf } from "obsidian";
import React from "react";
import { createRoot, Root } from "react-dom/client";
import { SpaceKit } from "shared/types/kits";
import { safelyParseJSON } from "shared/utils/json";
import { MKitFramePreview } from "./MKitFramePreview";

export const MKIT_FILE_VIEWER_TYPE = "mk-mkit-view";
export const ICON = "package";

interface MKitViewerProps {
  plugin: MakeMDPlugin;
  spaceKit: SpaceKit | null;
  filePath: string;
  onInstall: () => void;
}

const MKitViewerComponent: React.FC<MKitViewerProps> = ({ plugin, spaceKit, filePath, onInstall }) => {
  const [installing, setInstalling] = React.useState(false);

  // Set CSS variable based on fullWidth property
  React.useEffect(() => {
    if (spaceKit?.definition?.fullWidth) {
      document.documentElement.style.setProperty('--page-width', '100%');
    } else {
      // Reset to default if not fullWidth
      document.documentElement.style.removeProperty('--page-width');
    }

    // Cleanup on unmount
    return () => {
      document.documentElement.style.removeProperty('--page-width');
    };
  }, [spaceKit?.definition?.fullWidth]);

  const handleInstall = async () => {
    if (!spaceKit || installing) return;

    setInstalling(true);
    try {
      // Get the parent folder of the .mkit file as the install location
      const file = getAbstractFileAtPath(plugin.app, filePath) as TFile;
      const parentPath = file.parent?.path || '/';

      await installSpaceKit(plugin, plugin.superstate, spaceKit, parentPath);
      new Notice(`Successfully installed ${spaceKit.name}`);
      onInstall();
    } catch (error) {
      console.error("Failed to install space kit:", error);
      new Notice(`Failed to install space kit: ${error.message}`);
    } finally {
      setInstalling(false);
    }
  };

  if (!spaceKit) {
    return (
      <div className="mk-mkit-viewer">
        <div className="mk-mkit-error">
          <h2>Invalid MKit File</h2>
          <p>Unable to parse the space kit data from this file.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mk-mkit-viewer">
      <div className="mk-mkit-header">
        <button
          className="mod-cta"
          onClick={handleInstall}
          disabled={installing}
        >
          {installing ? "Installing..." : "Install Space Kit"}
        </button>
      </div>

      <div className="mk-mkit-content">
        <MKitFramePreview
          superstate={plugin.superstate}
          spaceKit={spaceKit}
        />
      </div>
    </div>
  );
};

export class MKitFileViewer extends FileView {
  plugin: MakeMDPlugin;
  navigation = true;
  root: Root | null = null;
  spaceKit: SpaceKit | null = null;

  constructor(leaf: WorkspaceLeaf, plugin: MakeMDPlugin) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType(): string {
    return MKIT_FILE_VIEWER_TYPE;
  }

  getDisplayText(): string {
    return this.file?.name || "MKit Viewer";
  }

  async onClose() {
    this.destroy();
  }

  destroy() {
    if (this.root) {
      try {
        this.root.unmount();
      } catch (e) {
        console.error("Error unmounting MKit viewer:", e);
      }
      this.root = null;
    }
    // Clean up CSS variable
    if (this.contentEl) {
      this.contentEl.style.removeProperty('--page-width');
    }
  }

  async onOpen(): Promise<void> {
    // Don't destroy on open, just clear the content
    this.contentEl.empty();
  }

  async setState(state: any, result: ViewStateResult): Promise<void> {
    this.file = getAbstractFileAtPath(this.plugin.app, state.file) as TFile;
    await this.loadFile(this.file);
    await super.setState(state, result);

    // Update title
    const displayName = this.spaceKit?.name || this.file.name;
    this.leaf.tabHeaderInnerTitleEl.innerText = displayName;
    //@ts-ignore
    this.leaf.view.titleEl = displayName;
    const headerEl = this.leaf.view.headerEl;
    if (headerEl) {
      //@ts-ignore
      headerEl.querySelector(".view-header-title").innerText = displayName;
    }

    result.history = true;
    return;
  }

  getState(): any {
    const state = super.getState();
    state.file = this.file?.path;
    return state;
  }

  async loadFile(file: TFile) {
    try {
      const mkitString = await this.plugin.app.vault.read(file);
      this.spaceKit = safelyParseJSON(mkitString) as SpaceKit;

      // Destroy existing root before creating new one
      if (this.root) {
        try {
          this.root.unmount();
        } catch (e) {
          console.error("Error unmounting previous root:", e);
        }
        this.root = null;
      }

      // Clear content
      this.contentEl.empty();

      // Create a container div for React
      const container = this.contentEl.createDiv("mk-mkit-root");

      // Check if fullWidth is set and apply CSS variable
      if (this.spaceKit?.definition?.fullWidth) {
        this.contentEl.style.setProperty('--page-width', '100%');
      }

      // Use the plugin's UI createRoot method if available, otherwise use React's createRoot
      if (this.plugin.ui?.createRoot) {
        this.root = this.plugin.ui.createRoot(container);
      } else {
        // Fallback to standard React createRoot
        this.root = createRoot(container);
      }

      if (this.root) {
        this.root.render(
          <MKitViewerComponent
            plugin={this.plugin}
            spaceKit={this.spaceKit}
            filePath={file.path}
            onInstall={() => {
              // Refresh the view after installation
              this.loadFile(file);
            }}
          />
        );
      }

    } catch (error) {
      console.error("Failed to load MKit file:", error);
      this.contentEl.empty();
      this.contentEl.createEl("div", {
        cls: "mk-mkit-error",
        text: `Failed to load MKit file: ${error.message}`
      });
    }
  }

}